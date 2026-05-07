import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

function parseISODuration(iso: string): number {
	const hours = parseInt(iso.match(/(\d+)H/)?.[1] ?? '0');
	const minutes = parseInt(iso.match(/(\d+)M/)?.[1] ?? '0');
	return hours * 60 + minutes;
}

function parseZeitText(text: string): number {
	const std = parseInt(text.match(/(\d+)\s*Std/)?.[1] ?? '0');
	const min = parseInt(text.match(/(\d+)\s*Min/)?.[1] ?? '0');
	return std * 60 + min;
}

const EINHEITEN_MAP: Record<string, string> = {
	g: 'g',
	gramm: 'g',
	ml: 'ml',
	milliliter: 'ml',
	tl: 'TL',
	teelöffel: 'TL',
	teeloffel: 'TL',
	prise: 'Prise',
	prisen: 'Prise',
	stück: 'Stück',
	stuck: 'Stück',
	stk: 'Stück',
	bund: 'Bund',
	dose: 'Dose',
	dosen: 'Dose',
	packung: 'Packung',
	pkg: 'Packung',
	pack: 'Packung'
};

const UNICODE_FRACTIONS: Record<string, number> = {
	'½': 0.5,
	'¼': 0.25,
	'¾': 0.75,
	'⅓': 0.33,
	'⅔': 0.67
};

function parseZutat(zeile: string): { name: string; menge: number; einheit: string } {
	let str = zeile.trim();
	for (const [frac, val] of Object.entries(UNICODE_FRACTIONS)) {
		str = str.replace(frac, String(val));
	}

	const match = str.match(/^([\d.,/]+)\s*([a-zA-ZäöüÄÖÜßéàè.]+\.?)?\s+(.+)$/);
	if (!match) {
		return { name: str, menge: 1, einheit: 'Stück' };
	}

	const mengeRaw = parseFloat(match[1].replace(',', '.').replace(/\/.*/, ''));
	const einheitRaw = (match[2] ?? '').toLowerCase().replace(/\.$/, '');
	const name = match[3].trim();

	let einheit = EINHEITEN_MAP[einheitRaw] ?? 'Stück';
	let menge = Math.max(1, Math.round(isNaN(mengeRaw) ? 1 : mengeRaw));

	if (einheitRaw === 'el' || einheitRaw === 'esslöffel' || einheitRaw === 'essloffel') {
		einheit = 'TL';
		menge = Math.max(1, Math.round((isNaN(mengeRaw) ? 1 : mengeRaw) * 3));
	} else if (einheitRaw === 'l' || einheitRaw === 'liter') {
		einheit = 'ml';
		menge = Math.max(1, Math.round((isNaN(mengeRaw) ? 1 : mengeRaw) * 1000));
	} else if (einheitRaw === 'kg' || einheitRaw === 'kilogramm') {
		einheit = 'g';
		menge = Math.max(1, Math.round((isNaN(mengeRaw) ? 1 : mengeRaw) * 1000));
	}

	return { name, menge, einheit };
}

export const POST = async ({ request }: RequestEvent) => {
	let body: { url?: string };
	try {
		body = await request.json();
	} catch {
		error(400, 'Ungültige JSON-Daten');
	}

	const url = body.url?.trim();
	if (!url) error(400, 'URL fehlt');
	try {
		new URL(url);
	} catch {
		error(400, 'Ungültige URL');
	}

	const { default: puppeteer } = await import('puppeteer');
	let browser;
	try {
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
		});
		const page = await browser.newPage();
		await page.setUserAgent(
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
		);
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

		const { ldJsonBlocks, gesamtzeitText, ogImage } = await page.evaluate(() => {
			const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
			const ldJsonBlocks = scripts
				.map((s) => {
					try {
						return JSON.parse(s.textContent ?? '');
					} catch {
						return null;
					}
				})
				.filter(Boolean);

			// DOM-based Gesamtzeit: find element with text "Gesamtzeit" and read sibling/parent
			let gesamtzeitText = '';
			const allEls = Array.from(document.querySelectorAll('*'));
			for (const el of allEls) {
				if (el.children.length === 0 && el.textContent?.trim() === 'Gesamtzeit') {
					const prev = el.previousElementSibling;
					if (prev) {
						gesamtzeitText = prev.textContent?.trim() ?? '';
						break;
					}
					const parentPrev = el.parentElement?.previousElementSibling;
					if (parentPrev) {
						gesamtzeitText = parentPrev.textContent?.trim() ?? '';
						break;
					}
				}
			}

			const ogImage =
				document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '';

			return { ldJsonBlocks, gesamtzeitText, ogImage };
		});

		let recipeData: Record<string, unknown> | null = null;
		for (const block of ldJsonBlocks) {
			const b = block as Record<string, unknown>;
			if (b['@type'] === 'Recipe') {
				recipeData = b;
				break;
			}
			if (Array.isArray(b['@graph'])) {
				const found = (b['@graph'] as Record<string, unknown>[]).find(
					(g) => g['@type'] === 'Recipe'
				);
				if (found) {
					recipeData = found;
					break;
				}
			}
		}

		if (!recipeData) {
			error(422, 'Kein Rezept-Schema auf dieser Seite gefunden.');
		}

		const titel = String(recipeData['name'] ?? '').trim();

		const yieldRaw = Array.isArray(recipeData['recipeYield'])
			? String(recipeData['recipeYield'][0])
			: String(recipeData['recipeYield'] ?? '1');
		const portionen = parseInt(yieldRaw.match(/\d+/)?.[0] ?? '1') || 1;

		const durationStr = String(recipeData['totalTime'] ?? recipeData['cookTime'] ?? '');
		const zubereitungszeit =
			parseZeitText(gesamtzeitText) || parseISODuration(durationStr) || 30;

		const instructionsRaw = recipeData['recipeInstructions'];
		let anleitung = '';
		if (Array.isArray(instructionsRaw)) {
			const texte: string[] = [];
			for (const step of instructionsRaw) {
				if (typeof step === 'string') {
					texte.push(step.trim());
				} else {
					const s = step as Record<string, unknown>;
					if (s['@type'] === 'HowToSection' && Array.isArray(s['itemListElement'])) {
						// Chefkoch and others wrap steps in HowToSection objects
						for (const subStep of s['itemListElement'] as Record<string, unknown>[]) {
							const t = String(subStep['text'] ?? subStep['name'] ?? '').trim();
							if (t) texte.push(t);
						}
					} else {
						const t = String(s['text'] ?? s['name'] ?? '').trim();
						if (t) texte.push(t);
					}
				}
			}
			anleitung = texte.join('\n\n');
		} else {
			anleitung = String(instructionsRaw ?? '').trim();
		}

		const ingredientStrings: string[] = Array.isArray(recipeData['recipeIngredient'])
			? (recipeData['recipeIngredient'] as unknown[]).map(String)
			: [];
		const zutaten = ingredientStrings.map(parseZutat);

		let bildPfad: string | null = null;
		const imageRaw = recipeData['image'];
		let imageUrl = '';
		if (typeof imageRaw === 'string') imageUrl = imageRaw;
		else if (Array.isArray(imageRaw) && imageRaw.length > 0) imageUrl = String(imageRaw[0]);
		else if (imageRaw && typeof imageRaw === 'object') {
			const img = imageRaw as Record<string, unknown>;
			imageUrl = String(img['url'] ?? '');
		}
		if (!imageUrl && ogImage) imageUrl = ogImage;

		if (imageUrl) {
			try {
				const imgRes = await fetch(imageUrl, { headers: { Referer: url } });
				if (imgRes.ok) {
					const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg';
					const extMap: Record<string, string> = {
						'image/jpeg': 'jpg',
						'image/png': 'png',
						'image/webp': 'webp'
					};
					const ext = extMap[contentType.split(';')[0].trim()] ?? 'jpg';
					const filename = `${randomUUID()}.${ext}`;
					await mkdir('static/uploads', { recursive: true });
					await writeFile(
						join('static/uploads', filename),
						new Uint8Array(await imgRes.arrayBuffer())
					);
					bildPfad = `/uploads/${filename}`;
				}
			} catch {
				// image download failure is non-fatal
			}
		}

		return json({ titel, portionen, zubereitungszeit, anleitung, zutaten, bild: bildPfad });
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('Scrape error:', err);
		error(500, 'Fehler beim Abrufen der Seite.');
	} finally {
		await browser?.close();
	}
};
