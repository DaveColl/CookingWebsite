// src/lib/rezeptkarten.server.ts
import db from '$lib/db';
import type { Kategorie, Rezeptkarte } from '$lib/kategorien';

export function rezeptkartenLaden(kategorie: Kategorie): Rezeptkarte[] {
	return db
		.prepare(
			`SELECT id, titel, portionen, zubereitungszeit, bild
       FROM rezepte
       WHERE kategorie = ?
       ORDER BY rowid DESC`
		)
		.all(kategorie) as Rezeptkarte[];
}
