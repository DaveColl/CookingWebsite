import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import db from '$lib/db';

interface EinkaufsArtikel {
	id: number;
	name: string;
	menge: string | null;
	erledigt: number;
	erstellt: number;
}

export const load: PageServerLoad = () => {
	const artikel = db
		.prepare('SELECT * FROM einkaufsliste ORDER BY erstellt ASC')
		.all() as EinkaufsArtikel[];
	return { artikel };
};

export const actions: Actions = {
	hinzufuegen: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const menge = data.get('menge')?.toString().trim() || null;
		if (!name) return { erfolg: false, message: 'Name darf nicht leer sein.' };
		db.prepare('INSERT INTO einkaufsliste (name, menge) VALUES (?, ?)').run(name, menge);
		return { erfolg: true };
	},

	umschalten: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) error(400);
		db.prepare(
			'UPDATE einkaufsliste SET erledigt = CASE WHEN erledigt = 0 THEN 1 ELSE 0 END WHERE id = ?'
		).run(id);
		return { erfolg: true };
	},

	entfernen: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) error(400);
		db.prepare('DELETE FROM einkaufsliste WHERE id = ?').run(id);
		return { erfolg: true };
	},

	erledigtLoeschen: async () => {
		db.prepare('DELETE FROM einkaufsliste WHERE erledigt = 1').run();
		return { erfolg: true };
	}
};
