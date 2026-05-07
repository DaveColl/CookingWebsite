import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import db from '$lib/db';

interface Aufgabe {
	id: number;
	titel: string;
	dauer_minuten: number;
	wiederholung: string;
	geplant_fuer: string;
	erledigt: number;
	erstellt: number;
}

export const load: PageServerLoad = () => {
	const aufgaben = db
		.prepare('SELECT * FROM aufgaben ORDER BY geplant_fuer ASC, id ASC')
		.all() as Aufgabe[];
	return { aufgaben };
};

function naechstesDatum(datum: string, wiederholung: string): string {
	const d = new Date(datum + 'T00:00:00');
	if (wiederholung === 'taeglich') d.setDate(d.getDate() + 1);
	else if (wiederholung === 'woechentlich') d.setDate(d.getDate() + 7);
	else if (wiederholung === 'monatlich') d.setMonth(d.getMonth() + 1);
	return d.toISOString().slice(0, 10);
}

const GUELTIGE_WIEDERHOLUNGEN = ['einmalig', 'taeglich', 'woechentlich', 'monatlich'];

export const actions: Actions = {
	erstellen: async ({ request }) => {
		const data = await request.formData();
		const titel = data.get('titel')?.toString().trim();
		const dauer = Math.max(1, Math.round(Number(data.get('dauer_minuten')) || 15));
		const wiederholung = data.get('wiederholung')?.toString() ?? 'einmalig';
		const geplant_fuer = data.get('geplant_fuer')?.toString();

		if (!titel) return { erfolg: false, message: 'Titel fehlt.' };
		if (!geplant_fuer || !/^\d{4}-\d{2}-\d{2}$/.test(geplant_fuer))
			return { erfolg: false, message: 'Ungültiges Datum.' };
		if (!GUELTIGE_WIEDERHOLUNGEN.includes(wiederholung))
			return { erfolg: false, message: 'Ungültige Wiederholung.' };

		db.prepare(
			'INSERT INTO aufgaben (titel, dauer_minuten, wiederholung, geplant_fuer) VALUES (?, ?, ?, ?)'
		).run(titel, dauer, wiederholung, geplant_fuer);

		return { erfolg: true };
	},

	erledigen: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) error(400);

		const aufgabe = db.prepare('SELECT * FROM aufgaben WHERE id = ?').get(id) as Aufgabe | undefined;
		if (!aufgabe) error(404);

		db.transaction(() => {
			db.prepare('UPDATE aufgaben SET erledigt = 1 WHERE id = ?').run(id);
			if (aufgabe.wiederholung !== 'einmalig') {
				const naechstes = naechstesDatum(aufgabe.geplant_fuer, aufgabe.wiederholung);
				db.prepare(
					'INSERT INTO aufgaben (titel, dauer_minuten, wiederholung, geplant_fuer) VALUES (?, ?, ?, ?)'
				).run(aufgabe.titel, aufgabe.dauer_minuten, aufgabe.wiederholung, naechstes);
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

	loeschen: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) error(400);
		db.prepare('DELETE FROM aufgaben WHERE id = ?').run(id);
		return { erfolg: true };
	}
};
