// Responsive check with puppeteer: renders pages on phone/tablet/desktop viewports,
// takes full-page screenshots and reports horizontal overflow and small touch targets.
//
// Usage:
//   node .claude/scripts/viewport-check.mjs --base http://127.0.0.1:5199 \
//     --paths /,/einkauf --out <dir> [--script interaction.mjs]
//
// --script: optional ES module with `export default async (page, viewport) => {...}`
// that runs after page load (e.g. open the hamburger menu) before measuring.
// Exit code 1 if any viewport has horizontal overflow or the script throws.
import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(
	process.argv
		.slice(2)
		.join(' ')
		.split('--')
		.filter(Boolean)
		.map((a) => {
			const [k, ...v] = a.trim().split(' ');
			return [k, v.join(' ')];
		})
);
const base = args.base || 'http://127.0.0.1:5199';
const paths = (args.paths || '/').split(',');
const out = resolve(args.out || 'viewport-shots');
mkdirSync(out, { recursive: true });
const interaction = args.script
	? (await import(pathToFileURL(resolve(args.script)).href)).default
	: null;

// Breakpoints used in the project: 700, 600, 500, 375 (all max-width).
const viewports = [
	{ name: 'phone-320', width: 320, height: 640, isMobile: true, hasTouch: true },
	{ name: 'phone-390', width: 390, height: 844, isMobile: true, hasTouch: true },
	{ name: 'tablet-768', width: 768, height: 1024, isMobile: true, hasTouch: true },
	{ name: 'desktop-1440', width: 1440, height: 900, isMobile: false, hasTouch: false }
];

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const results = [];
let failed = false;

for (const path of paths) {
	for (const vp of viewports) {
		const page = await browser.newPage();
		await page.setViewport({ ...vp, deviceScaleFactor: 1 });
		const consoleErrors = [];
		page.on('pageerror', (e) => consoleErrors.push(String(e)));
		page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
		// SSE streams keep connections open, so wait for load + settle instead of networkidle.
		await page.goto(base + path, { waitUntil: 'load' });
		await new Promise((r) => setTimeout(r, 400));

		let scriptError = null;
		if (interaction) {
			try {
				await interaction(page, vp);
			} catch (e) {
				scriptError = String(e);
			}
		}

		const metrics = await page.evaluate((touch) => {
			const vw = document.documentElement.clientWidth;
			const overflowing = [];
			for (const el of document.querySelectorAll('body *')) {
				const r = el.getBoundingClientRect();
				const cs = getComputedStyle(el);
				if (r.width === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
				if (r.right > vw + 1) {
					const id =
						el.tagName.toLowerCase() +
						(el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : '');
					overflowing.push(`${id} (right=${Math.round(r.right)})`);
				}
			}
			const smallTargets = [];
			if (touch) {
				for (const el of document.querySelectorAll(
					'a, button, input, select, textarea, [role=button]'
				)) {
					const r = el.getBoundingClientRect();
					if (r.width === 0 || r.height === 0) continue;
					if (r.width < 32 || r.height < 32) {
						smallTargets.push(
							`${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/)[0] : ''} ${Math.round(r.width)}x${Math.round(r.height)}`
						);
					}
				}
			}
			return {
				viewportWidth: vw,
				scrollWidth: document.documentElement.scrollWidth,
				overflowing: overflowing.slice(0, 10),
				smallTargets: [...new Set(smallTargets)].slice(0, 10)
			};
		}, vp.hasTouch);

		const file = `${out}/${path.replace(/\W+/g, '_') || 'root'}-${vp.name}.png`;
		await page.screenshot({ path: file, fullPage: true });
		const hasOverflow = metrics.scrollWidth > metrics.viewportWidth;
		if (hasOverflow || scriptError) failed = true;
		results.push({
			path,
			viewport: vp.name,
			hasOverflow,
			...metrics,
			consoleErrors,
			scriptError,
			screenshot: file
		});
		await page.close();
	}
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
process.exit(failed ? 1 : 0);
