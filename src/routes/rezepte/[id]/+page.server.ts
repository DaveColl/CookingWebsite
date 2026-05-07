import type { PageServerLoad, Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { SqliteError } from 'better-sqlite3';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import db from '$lib/db';

interface Rezept {
	id: number;
	titel: string;
	portionen: number;
	zubereitungszeit: number;
	anleitung: string;
	bild: string | null;
}

interface ZutatZeile {
	name: string;
	menge: number;
	einheit: string;
}

const ERLAUBTE_TYPEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

async function bildSpeichern(datei: File): Promise<string> {
	await mkdir('static/uploads', { recursive: true });
	const ext = datei.name.split('.').pop()?.toLowerCase() ?? 'jpg';
	const name = `${randomUUID()}.${ext}`;
	await writeFile(join('static/uploads', name), new Uint8Array(await datei.arrayBuffer()));
	return `/uploads/${name}`;
}

function verwaistZutatenLoeschen() {
	db.prepare(
		'DELETE FROM zutaten WHERE id NOT IN (SELECT DISTINCT zutat_id FROM rezepte_zutaten)'
	).run();
}

async function alteBildLoeschen(bildPfad: string | null) {
	if (!bildPfad) return;
	try {
		await unlink(`static${bildPfad}`);
	} catch {
		// ignore missing file
	}
}

export const load: PageServerLoad = ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) error(404);

	const rezept = db.prepare('SELECT * FROM rezepte WHERE id = ?').get(id) as Rezept | undefined;
	if (!rezept) error(404, 'Rezept nicht gefunden');

	const zutaten = db
		.prepare(
			`SELECT z.zutat AS name, rz.menge, rz.einheit
       FROM rezepte_zutaten rz
       JOIN zutaten z ON rz.zutat_id = z.id
       WHERE rz.rezept_id = ?
       ORDER BY rz.id`
		)
		.all(id) as ZutatZeile[];

	return { rezept, zutaten };
};

export const actions: Actions = {
	bearbeiten: async ({ request, params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id) || id <= 0) error(400);

		const formData = await request.formData();
		const titel = formData.get('titel')?.toString().trim();
		const portionen = Number(formData.get('portionen'));
		const zubereitungszeit = Number(formData.get('zubereitungszeit'));
		const anleitung = formData.get('anleitung')?.toString().trim();

		const zutatNamen = formData.getAll('zutat_name').map(String);
		const zutatMengen = formData.getAll('zutat_menge').map(Number);
		const zutatEinheiten = formData.getAll('zutat_einheit').map(String);

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
				werte: { titel, portionen, zubereitungszeit, anleitung }
			};
		}
		if (zutatNamen.length === 0 || zutatNamen.some((n) => !n.trim())) {
			return { erfolg: false, message: 'Bitte mindestens eine Zutat angeben.' };
		}
		if (zutatMengen.some((m) => !(m > 0) || !Number.isInteger(m))) {
			return { erfolg: false, message: 'Mengen müssen ganze Zahlen > 0 sein.' };
		}

		const aktuell = db.prepare('SELECT bild FROM rezepte WHERE id = ?').get(id) as
			| { bild: string | null }
			| undefined;

		let bildPfad: string | null = aktuell?.bild ?? null;
		const bildDatei = formData.get('bild');
		if (bildDatei instanceof File && bildDatei.size > 0) {
			if (!ERLAUBTE_TYPEN.includes(bildDatei.type))
				return { erfolg: false, message: 'Nur JPEG, PNG, WebP und GIF sind erlaubt.' };
			if (bildDatei.size > MAX_BYTES)
				return { erfolg: false, message: 'Das Bild darf maximal 5 MB groß sein.' };
			try {
				const neuerPfad = await bildSpeichern(bildDatei);
				await alteBildLoeschen(aktuell?.bild ?? null);
				bildPfad = neuerPfad;
			} catch {
				return { erfolg: false, message: 'Fehler beim Speichern des Bildes.' };
			}
		}

		try {
			db.transaction(() => {
				db.prepare(
					`UPDATE rezepte SET titel=?, portionen=?, zubereitungszeit=?, anleitung=?, bild=? WHERE id=?`
				).run(titel, portionen, zubereitungszeit, anleitung, bildPfad, id);

				db.prepare('DELETE FROM rezepte_zutaten WHERE rezept_id=?').run(id);

				const zutatEinfuegen = db.prepare('INSERT OR IGNORE INTO zutaten (zutat) VALUES (?)');
				const zutatIdHolen = db.prepare('SELECT id FROM zutaten WHERE zutat = ?');
				const zutatVerknuepfen = db.prepare(
					'INSERT INTO rezepte_zutaten (rezept_id, zutat_id, menge, einheit) VALUES (?, ?, ?, ?)'
				);

				for (let i = 0; i < zutatNamen.length; i++) {
					const name = zutatNamen[i].trim().toLowerCase();
					zutatEinfuegen.run(name);
					const { id: zutatId } = zutatIdHolen.get(name) as { id: number };
					zutatVerknuepfen.run(id, zutatId, zutatMengen[i], zutatEinheiten[i]);
				}
			})();

			verwaistZutatenLoeschen();
			return { erfolg: true };
		} catch (err: unknown) {
			if (err instanceof SqliteError && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
				return { erfolg: false, message: 'Ein Rezept mit diesem Titel existiert bereits.' };
			}
			console.error('Systemerror:', err);
			return { erfolg: false, message: 'Ein unerwarteter Fehler ist aufgetreten.' };
		}
	},

	loeschen: async ({ params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id) || id <= 0) error(400);

		const rezept = db.prepare('SELECT bild FROM rezepte WHERE id = ?').get(id) as
			| { bild: string | null }
			| undefined;

		db.prepare('DELETE FROM rezepte WHERE id = ?').run(id);
		verwaistZutatenLoeschen();
		await alteBildLoeschen(rezept?.bild ?? null);

		redirect(303, '/rezepte');
	}
};
