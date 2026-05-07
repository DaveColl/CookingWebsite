import type { RequestHandler } from './$types';
import db from '$lib/db';

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
				const rows = db.prepare('SELECT * FROM einkaufsliste ORDER BY erstellt ASC').all();
				controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(rows)}\n\n`));
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
