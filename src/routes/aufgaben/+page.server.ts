import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import db from '$lib/db';

interface RawAufgabe {
	id: number;
	titel: string;
	dauer_minuten: number;
	wiederholung: string;
	geplant_fuer: string;
	erledigt: number;
	erstellt: number;
	zugewiesen_an: string | null;
	beschreibung: string | null;
}

export const load: PageServerLoad = () => {
	const rawAufgaben = db
		.prepare('SELECT * FROM aufgaben ORDER BY geplant_fuer ASC, id ASC')
		.all() as RawAufgabe[];
	const aufgaben = rawAufgaben.map((a) => ({
		...a,
		zugewiesen_an: a.zugewiesen_an ? (JSON.parse(a.zugewiesen_an) as string[]) : []
	}));
	const personen = (
		db.prepare('SELECT name FROM personen ORDER BY name').all() as { name: string }[]
	).map((r) => r.name);
	const titelVorschlaege = (
		db.prepare('SELECT DISTINCT titel FROM aufgaben ORDER BY titel').all() as { titel: string }[]
	).map((r) => r.titel);
	return { aufgaben, personen, titelVorschlaege };
};

function localDateStr(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function naechstesDatum(datum: string, wiederholung: string): string {
	const d = new Date(datum + 'T00:00:00');
	if (wiederholung === 'taeglich') d.setDate(d.getDate() + 1);
	else if (wiederholung === 'woechentlich') d.setDate(d.getDate() + 7);
	else if (wiederholung === 'monatlich') d.setMonth(d.getMonth() + 1);
	return localDateStr(d);
}

function datumAusTeilen(data: FormData): string | null {
	const tagNum = parseInt(data.get('tag')?.toString() ?? '');
	const monatNum = parseInt(data.get('monat')?.toString() ?? '');
	const jahrNum = parseInt(data.get('jahr')?.toString() ?? '');
	if (isNaN(tagNum) || isNaN(monatNum) || isNaN(jahrNum)) return null;
	if (tagNum < 1 || tagNum > 31 || monatNum < 1 || monatNum > 12 || jahrNum < 2024) return null;
	return `${jahrNum}-${String(monatNum).padStart(2, '0')}-${String(tagNum).padStart(2, '0')}`;
}

function personBereinigen(name: string) {
	const lower = name.toLowerCase();
	const inTask = db
		.prepare(
			`SELECT COUNT(*) as n FROM aufgaben WHERE zugewiesen_an IS NOT NULL AND EXISTS (
        SELECT 1 FROM json_each(zugewiesen_an) WHERE value = ?
      )`
		)
		.get(lower) as { n: number };
	if (inTask.n === 0) {
		db.prepare('DELETE FROM personen WHERE name = ?').run(lower);
	}
}

const GUELTIGE_WIEDERHOLUNGEN = ['einmalig', 'taeglich', 'woechentlich', 'monatlich'];

export const actions: Actions = {
	erstellen: async ({ request }) => {
		const data = await request.formData();
		const titelRoh = data.get('titel')?.toString().trim();
		const titel = titelRoh ? titelRoh.toLowerCase() : undefined;
		const dauer = Math.max(1, Math.round(Number(data.get('dauer_minuten')) || 15));
		const wiederholung = data.get('wiederholung')?.toString() ?? 'einmalig';
		const geplant_fuer = datumAusTeilen(data);
		const namensEingabe = data.get('zugewiesen_an')?.toString().trim().toLowerCase() || null;
		const zugewiesen_an = namensEingabe ? JSON.stringify([namensEingabe]) : null;

		if (!titel) return { erfolg: false, message: 'Titel fehlt.' };
		if (!geplant_fuer) return { erfolg: false, message: 'Ungültiges Datum.' };
		if (!GUELTIGE_WIEDERHOLUNGEN.includes(wiederholung))
			return { erfolg: false, message: 'Ungültige Wiederholung.' };

		db.prepare(
			'INSERT INTO aufgaben (titel, dauer_minuten, wiederholung, geplant_fuer, zugewiesen_an) VALUES (?, ?, ?, ?, ?)'
		).run(titel, dauer, wiederholung, geplant_fuer, zugewiesen_an);

		if (namensEingabe) {
			db.prepare('INSERT OR IGNORE INTO personen (name) VALUES (?)').run(namensEingabe);
		}

		return { erfolg: true };
	},

	erledigen: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) error(400);

		const aufgabe = db.prepare('SELECT * FROM aufgaben WHERE id = ?').get(id) as
			| RawAufgabe
			| undefined;
		if (!aufgabe) error(404);

		db.transaction(() => {
			db.prepare('UPDATE aufgaben SET erledigt = 1 WHERE id = ?').run(id);
			if (aufgabe.wiederholung !== 'einmalig') {
				const naechstes = naechstesDatum(aufgabe.geplant_fuer, aufgabe.wiederholung);
				db.prepare(
					'INSERT INTO aufgaben (titel, dauer_minuten, wiederholung, geplant_fuer, zugewiesen_an) VALUES (?, ?, ?, ?, ?)'
				).run(
					aufgabe.titel,
					aufgabe.dauer_minuten,
					aufgabe.wiederholung,
					naechstes,
					aufgabe.zugewiesen_an
				);
			}
		})();

		return { erfolg: true };
	},

	rueckgaengig: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) error(400);
		db.prepare('UPDATE aufgaben SET erledigt = 0 WHERE id = ?').run(id);
		return { erfolg: true };
	},

	verschieben: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const neuesDatum = data.get('neues_datum')?.toString();
		if (!id || !neuesDatum || !/^\d{4}-\d{2}-\d{2}$/.test(neuesDatum)) error(400);
		db.prepare('UPDATE aufgaben SET geplant_fuer = ? WHERE id = ?').run(neuesDatum, id);
		return { erfolg: true };
	},

	bearbeiten: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const titelRoh = data.get('titel')?.toString().trim();
		const titel = titelRoh ? titelRoh.toLowerCase() : undefined;
		const dauer = Math.max(1, Math.round(Number(data.get('dauer_minuten')) || 15));
		const wiederholung = data.get('wiederholung')?.toString() ?? 'einmalig';
		const geplant_fuer = datumAusTeilen(data);
		const beschreibung = data.get('beschreibung')?.toString().trim() || null;

		if (!id || !titel) error(400);
		if (!geplant_fuer) error(400);
		if (!GUELTIGE_WIEDERHOLUNGEN.includes(wiederholung)) error(400);

		db.prepare(
			'UPDATE aufgaben SET titel = ?, dauer_minuten = ?, wiederholung = ?, geplant_fuer = ?, beschreibung = ? WHERE id = ?'
		).run(titel, dauer, wiederholung, geplant_fuer, beschreibung, id);

		return { erfolg: true };
	},

	person_hinzufuegen: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const nameRoh = data.get('name')?.toString().trim();
		const name = nameRoh ? nameRoh.toLowerCase() : undefined;
		if (!id || !name) error(400);
		const row = db.prepare('SELECT zugewiesen_an FROM aufgaben WHERE id = ?').get(id) as
			| { zugewiesen_an: string | null }
			| undefined;
		if (!row) error(404);
		const personen: string[] = row.zugewiesen_an ? JSON.parse(row.zugewiesen_an) : [];
		if (!personen.includes(name)) personen.push(name);
		db.prepare('UPDATE aufgaben SET zugewiesen_an = ? WHERE id = ?').run(
			JSON.stringify(personen),
			id
		);
		db.prepare('INSERT OR IGNORE INTO personen (name) VALUES (?)').run(name);
		return { erfolg: true };
	},

	person_entfernen: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const nameRoh = data.get('name')?.toString().trim();
		const name = nameRoh ? nameRoh.toLowerCase() : undefined;
		if (!id || !name) error(400);
		const row = db.prepare('SELECT zugewiesen_an FROM aufgaben WHERE id = ?').get(id) as
			| { zugewiesen_an: string | null }
			| undefined;
		if (!row) error(404);
		const personen: string[] = row.zugewiesen_an ? JSON.parse(row.zugewiesen_an) : [];
		const neue = personen.filter((p) => p !== name);
		db.prepare('UPDATE aufgaben SET zugewiesen_an = ? WHERE id = ?').run(
			neue.length ? JSON.stringify(neue) : null,
			id
		);
		personBereinigen(name);
		return { erfolg: true };
	},

	loeschen: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) error(400);
		const row = db.prepare('SELECT zugewiesen_an FROM aufgaben WHERE id = ?').get(id) as
			| { zugewiesen_an: string | null }
			| undefined;
		const personenVorher: string[] = row?.zugewiesen_an ? JSON.parse(row.zugewiesen_an) : [];
		db.prepare('DELETE FROM aufgaben WHERE id = ?').run(id);
		for (const name of personenVorher) {
			personBereinigen(name);
		}
		return { erfolg: true };
	}
};
