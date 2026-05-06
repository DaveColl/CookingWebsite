// src/routes/api/zutaten/+server.ts
// GET /api/zutaten?q=meh  →  gibt passende Zutaten aus der DB zurück

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types'; // ← SvelteKit generiert das
import db from '$lib/db';

export const GET: RequestHandler = ({ url }) => {
	//                ↑ jetzt weiß TypeScript: url ist ein URL-Objekt
	const q = `%${url.searchParams.get('q')?.toLowerCase().trim() ?? ''}%`;
	const zutaten = db
		.prepare(`SELECT zutat FROM zutaten WHERE zutat LIKE ? ORDER BY zutat LIMIT 10`)
		.all(q) as { zutat: string }[];
	return json(zutaten.map((z) => z.zutat));
};
