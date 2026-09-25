// src/routes/rezepte/neues-rezept/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { SqliteError } from 'better-sqlite3';
import db from '$lib/db';
import { bildSpeichern, dateinameAusPfad, UPLOAD_URL_PREFIX } from '$lib/uploads.server';
import { istKategorie, STANDARD_KATEGORIE } from '$lib/kategorien';

const ERLAUBTE_TYPEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

// Vorauswahl über ?kategorie=nachtisch (z. B. aus der Nachtisch-Liste)
export const load: PageServerLoad = ({ url }) => {
	const wunsch = url.searchParams.get('kategorie');
	return { kategorie: istKategorie(wunsch) ? wunsch : STANDARD_KATEGORIE };
};

export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();

		const titel = formData.get('titel')?.toString().trim();
		const portionen = Number(formData.get('portionen'));
		const zubereitungszeit = Number(formData.get('zubereitungszeit'));
		const anleitung = formData.get('anleitung')?.toString().trim();
		const kategorieRoh = formData.get('kategorie')?.toString();

		const zutatNamen = formData.getAll('zutat_name').map(String);
		const zutatMengen = formData.getAll('zutat_menge').map(Number);
		const zutatEinheiten = formData.getAll('zutat_einheit').map(String);

		// Validierung: Kategorie (Pflichtauswahl, nur die zwei erlaubten Werte)
		if (!istKategorie(kategorieRoh)) {
			return {
				erfolg: false,
				message: 'Bitte wähle aus, ob das Rezept zu Mittagessen oder Nachtisch gehört.',
				werte: { titel, portionen, zubereitungszeit, anleitung }
			};
		}
		const kategorie = kategorieRoh;

		// Validierung: Rezept
		if (
			!titel ||
			!anleitung ||
			!(portionen > 0) ||
			!Number.isInteger(portionen) ||
			!(zubereitungszeit > 0) ||
			!Number.isInteger(zubereitungszeit)
		) {
			return {
				erfolg: false,
				message: 'Füll die Felder korrekt aus (nur ganze Zahlen > 0).',
				werte: { titel, portionen, zubereitungszeit, anleitung, kategorie }
			};
		}

		// Validierung: Zutaten
		if (zutatNamen.length === 0 || zutatNamen.some((n) => !n.trim())) {
			return {
				erfolg: false,
				message: 'Bitte mindestens eine Zutat angeben.',
				werte: { kategorie }
			};
		}
		if (zutatMengen.some((m) => !(m > 0) || !Number.isInteger(m))) {
			return {
				erfolg: false,
				message: 'Mengen müssen ganze Zahlen > 0 sein.',
				werte: { kategorie }
			};
		}

		// Bild verarbeiten (optional)
		let bildPfad: string | null = null;
		const bildDatei = formData.get('bild');
		if (bildDatei instanceof File && bildDatei.size > 0) {
			if (!ERLAUBTE_TYPEN.includes(bildDatei.type))
				return {
					erfolg: false,
					message: 'Nur JPEG, PNG, WebP und GIF sind erlaubt.',
					werte: { kategorie }
				};
			if (bildDatei.size > MAX_BYTES)
				return {
					erfolg: false,
					message: 'Das Bild darf maximal 5 MB groß sein.',
					werte: { kategorie }
				};
			try {
				bildPfad = await bildSpeichern(bildDatei);
			} catch {
				return {
					erfolg: false,
					message: 'Fehler beim Speichern des Bildes.',
					werte: { kategorie }
				};
			}
		} else {
			// Use pre-downloaded image from scraper if no manual upload
			const importPfad = formData.get('bild_pfad')?.toString().trim();
			const importName = dateinameAusPfad(importPfad);
			if (importName) {
				bildPfad = `${UPLOAD_URL_PREFIX}${importName}`;
			}
		}

		const rezeptEinfuegen = db.prepare(`
			INSERT INTO rezepte (titel, portionen, zubereitungszeit, anleitung, bild, kategorie)
			VALUES (?, ?, ?, ?, ?, ?)
		`);
		const zutatEinfuegen = db.prepare(`
			INSERT OR IGNORE INTO zutaten (zutat) VALUES (?)
		`);
		const zutatIdHolen = db.prepare(`
			SELECT id FROM zutaten WHERE zutat = ?
		`);
		const rezeptZutatEinfuegen = db.prepare(`
			INSERT INTO rezepte_zutaten (rezept_id, zutat_id, menge, einheit)
			VALUES (?, ?, ?, ?)
		`);

		try {
			db.transaction(() => {
				const { lastInsertRowid: rezeptId } = rezeptEinfuegen.run(
					titel,
					portionen,
					zubereitungszeit,
					anleitung,
					bildPfad,
					kategorie
				);

				for (let i = 0; i < zutatNamen.length; i++) {
					const name = zutatNamen[i].trim().toLowerCase();
					zutatEinfuegen.run(name);
					const { id: zutatId } = zutatIdHolen.get(name) as { id: number };
					rezeptZutatEinfuegen.run(rezeptId, zutatId, zutatMengen[i], zutatEinheiten[i]);
				}
			})();

			return { erfolg: true, werte: { kategorie } };
		} catch (error: unknown) {
			if (error instanceof SqliteError && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
				return {
					erfolg: false,
					message: 'Ein Rezept mit diesem Titel existiert bereits.',
					werte: { kategorie }
				};
			}
			console.error('Systemerror:', error);
			return {
				erfolg: false,
				message: 'Ein unerwarteter Fehler ist aufgetreten.',
				werte: { kategorie }
			};
		}
	}
} satisfies Actions;
