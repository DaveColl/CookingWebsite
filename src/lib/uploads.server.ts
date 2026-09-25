// Zentraler Ort für hochgeladene Rezeptbilder.
// Die Dateien werden zur Laufzeit über src/hooks.server.ts ausgeliefert,
// damit neue Uploads ohne Rebuild sichtbar sind.
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'static/uploads');
export const UPLOAD_URL_PREFIX = '/uploads/';

export const BILD_TYPEN: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	gif: 'image/gif'
};

const MIME_ZU_ENDUNG: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif'
};

// Nur einfache Dateinamen mit erlaubter Bild-Endung, kein Pfad, keine Steuerzeichen.
const DATEINAME_MUSTER = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp|gif)$/i;

export function istGueltigerDateiname(name: string): boolean {
	return DATEINAME_MUSTER.test(name) && !name.includes('..');
}

/** '/uploads/abc.jpg' → 'abc.jpg', sonst null */
export function dateinameAusPfad(bildPfad: string | null | undefined): string | null {
	if (!bildPfad || !bildPfad.startsWith(UPLOAD_URL_PREFIX)) return null;
	const name = bildPfad.slice(UPLOAD_URL_PREFIX.length);
	return istGueltigerDateiname(name) ? name : null;
}

function endungFuer(mime: string, fallbackName?: string): string {
	const ausMime = MIME_ZU_ENDUNG[mime.split(';')[0].trim().toLowerCase()];
	if (ausMime) return ausMime;
	const ausName = fallbackName?.split('.').pop()?.toLowerCase();
	return ausName && ausName in BILD_TYPEN ? ausName : 'jpg';
}

/** Speichert Bilddaten unter einem zufälligen Namen und gibt den öffentlichen Pfad zurück. */
export async function bildDatenSpeichern(
	daten: ArrayBuffer | Uint8Array,
	mime: string,
	originalName?: string
): Promise<string> {
	await mkdir(UPLOAD_DIR, { recursive: true });
	const name = `${randomUUID()}.${endungFuer(mime, originalName)}`;
	const bytes = daten instanceof Uint8Array ? daten : new Uint8Array(daten);
	await writeFile(path.join(UPLOAD_DIR, name), bytes);
	return `${UPLOAD_URL_PREFIX}${name}`;
}

export async function bildSpeichern(datei: File): Promise<string> {
	return bildDatenSpeichern(await datei.arrayBuffer(), datei.type, datei.name);
}

/** Löscht ein Bild anhand des öffentlichen Pfads; fehlende Dateien werden ignoriert. */
export async function bildLoeschen(bildPfad: string | null | undefined): Promise<void> {
	const name = dateinameAusPfad(bildPfad);
	if (!name) return;
	try {
		await unlink(path.join(UPLOAD_DIR, name));
	} catch {
		// Datei fehlt bereits
	}
}

/** Liest ein Bild für die Auslieferung; null, wenn Name ungültig oder Datei fehlt. */
export async function bildLesen(
	name: string
): Promise<{ daten: Buffer; contentType: string } | null> {
	if (!istGueltigerDateiname(name)) return null;
	const endung = name.split('.').pop()!.toLowerCase();
	const voll = path.join(UPLOAD_DIR, name);
	if (path.dirname(voll) !== UPLOAD_DIR) return null;
	try {
		const daten = await readFile(voll);
		return { daten, contentType: BILD_TYPEN[endung] };
	} catch {
		return null;
	}
}
