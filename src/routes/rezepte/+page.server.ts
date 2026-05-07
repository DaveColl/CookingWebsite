import type { PageServerLoad } from './$types';
import db from '$lib/db';

export interface Rezeptkarte {
	id: number;
	titel: string;
	portionen: number;
	zubereitungszeit: number;
	bild: string | null;
}

export const load: PageServerLoad = () => {
	const rezepte = db
		.prepare(`SELECT id, titel, portionen, zubereitungszeit, bild FROM rezepte ORDER BY rowid DESC`)
		.all() as Rezeptkarte[];
	return { rezepte };
};
