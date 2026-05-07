import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/db';

interface EingehenderArtikel {
	name: string;
	menge: string;
}

export const POST: RequestHandler = async ({ request }) => {
	let body: { zutaten: EingehenderArtikel[] };
	try {
		body = await request.json();
	} catch {
		error(400, 'Ungültige JSON-Daten');
	}

	if (!Array.isArray(body.zutaten) || body.zutaten.length === 0) {
		error(400, 'Keine Zutaten angegeben');
	}

	const einfuegen = db.prepare('INSERT INTO einkaufsliste (name, menge) VALUES (?, ?)');

	db.transaction(() => {
		for (const z of body.zutaten) {
			const name = z.name?.toString().trim();
			const menge = z.menge?.toString().trim() || null;
			if (name) einfuegen.run(name, menge);
		}
	})();

	return json({ erfolg: true });
};
