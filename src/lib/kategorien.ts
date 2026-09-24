// src/lib/kategorien.ts
// Rezept-Kategorien: gemeinsam für Server (Validierung, Loader) und Client (Formular, Nav).

export const KATEGORIEN = ['mittagessen', 'nachtisch'] as const;
export type Kategorie = (typeof KATEGORIEN)[number];

export const STANDARD_KATEGORIE: Kategorie = 'mittagessen';

export const KATEGORIE_LABEL: Record<Kategorie, string> = {
	mittagessen: 'Mittagessen',
	nachtisch: 'Nachtisch'
};

/** Listenseite je Kategorie */
export const KATEGORIE_PFAD: Record<Kategorie, '/rezepte' | '/nachtisch'> = {
	mittagessen: '/rezepte',
	nachtisch: '/nachtisch'
};

export function istKategorie(wert: unknown): wert is Kategorie {
	return typeof wert === 'string' && (KATEGORIEN as readonly string[]).includes(wert);
}

export interface Rezeptkarte {
	id: number;
	titel: string;
	portionen: number;
	zubereitungszeit: number;
	bild: string | null;
}
