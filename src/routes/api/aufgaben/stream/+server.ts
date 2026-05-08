import type { RequestHandler } from './$types';
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

export const GET: RequestHandler = ({ request }) => {
	let interval: ReturnType<typeof setInterval>;

	const stream = new ReadableStream({
		start(controller) {
			const send = () => {
				if (request.signal.aborted) {
					clearInterval(interval);
					try {
						controller.close();
					} catch {
						/* already closed */
					}
					return;
				}

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
					db.prepare('SELECT DISTINCT titel FROM aufgaben ORDER BY titel').all() as {
						titel: string;
					}[]
				).map((r) => r.titel);

				const payload = { aufgaben, personen, titelVorschlaege };

				controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
			};

			send();
			interval = setInterval(send, 2000);

			request.signal.addEventListener('abort', () => {
				clearInterval(interval);
				try {
					controller.close();
				} catch {
					/* already closed */
				}
			});
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
