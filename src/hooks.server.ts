import type { Handle } from '@sveltejs/kit';
import { bildLesen, UPLOAD_URL_PREFIX } from '$lib/uploads.server';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	if (pathname.startsWith(UPLOAD_URL_PREFIX)) {
		const methode = event.request.method;
		if (methode !== 'GET' && methode !== 'HEAD') {
			return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
		}
		let name: string;
		try {
			name = decodeURIComponent(pathname.slice(UPLOAD_URL_PREFIX.length));
		} catch {
			return new Response('Bad Request', { status: 400 });
		}
		const bild = await bildLesen(name);
		if (!bild) return new Response('Not Found', { status: 404 });
		return new Response(methode === 'HEAD' ? null : new Uint8Array(bild.daten), {
			headers: {
				'Content-Type': bild.contentType,
				'Content-Length': String(bild.daten.byteLength),
				'Cache-Control': 'public, max-age=31536000, immutable',
				'X-Content-Type-Options': 'nosniff'
			}
		});
	}

	const response = await resolve(event);
	if (response.headers.get('content-type')?.includes('text/html')) {
		response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
	}
	return response;
};
