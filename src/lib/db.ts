// src/lib/db.ts
import Database from 'better-sqlite3';

const db = new Database('rezepte.db');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS rezepte (
    id                INTEGER PRIMARY KEY,
    titel             TEXT    UNIQUE NOT NULL,
    portionen         INTEGER NOT NULL,
    zubereitungszeit  INTEGER NOT NULL,
    anleitung         TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS zutaten (
    id    INTEGER PRIMARY KEY,
    zutat TEXT    UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rezepte_zutaten (
    id        INTEGER PRIMARY KEY,
    rezept_id INTEGER NOT NULL,
    zutat_id  INTEGER NOT NULL,
    menge     INTEGER NOT NULL,
    einheit   TEXT    NOT NULL CHECK(einheit IN (
      'g', 'ml', 'TL',
      'Prise', 'Stück', 'Bund', 'Dose', 'Packung'
    )),
    FOREIGN KEY (rezept_id) REFERENCES rezepte(id) ON DELETE CASCADE,
    FOREIGN KEY (zutat_id)  REFERENCES zutaten(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS einkaufsliste (
    id       INTEGER PRIMARY KEY,
    name     TEXT    NOT NULL,
    menge    TEXT,
    erledigt INTEGER NOT NULL DEFAULT 0,
    erstellt INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS aufgaben (
    id            INTEGER PRIMARY KEY,
    titel         TEXT    NOT NULL,
    dauer_minuten INTEGER NOT NULL DEFAULT 15,
    wiederholung  TEXT    NOT NULL DEFAULT 'einmalig'
      CHECK(wiederholung IN ('einmalig', 'taeglich', 'woechentlich', 'monatlich')),
    geplant_fuer  TEXT    NOT NULL,
    erledigt      INTEGER NOT NULL DEFAULT 0,
    erstellt      INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_aufgaben_datum ON aufgaben(geplant_fuer, erledigt);
`);

const spalten = db.pragma('table_info(rezepte)') as { name: string }[];
if (!spalten.some((s) => s.name === 'bild')) {
	db.exec(`ALTER TABLE rezepte ADD COLUMN bild TEXT`);
}

const aufgabenSpalten = db.pragma('table_info(aufgaben)') as { name: string }[];
if (!aufgabenSpalten.some((s) => s.name === 'zugewiesen_an')) {
	db.exec(`ALTER TABLE aufgaben ADD COLUMN zugewiesen_an TEXT`);
}

// Migrate single-name values to JSON arrays
db.exec(`
  UPDATE aufgaben
  SET zugewiesen_an = json_array(zugewiesen_an)
  WHERE zugewiesen_an IS NOT NULL
    AND NOT (zugewiesen_an LIKE '[%')
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS personen (
    id   INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  );
`);

const aufgabenSpalten2 = db.pragma('table_info(aufgaben)') as { name: string }[];
if (!aufgabenSpalten2.some((s) => s.name === 'beschreibung')) {
	db.exec(`ALTER TABLE aufgaben ADD COLUMN beschreibung TEXT`);
}

// Normalize existing zugewiesen_an values to lowercase
db.exec(`
  UPDATE aufgaben
  SET zugewiesen_an = (
    SELECT json_group_array(lower(value))
    FROM json_each(zugewiesen_an)
  )
  WHERE zugewiesen_an IS NOT NULL;
`);

// Normalize existing task titles to lowercase
db.exec(`UPDATE aufgaben SET titel = lower(titel) WHERE titel != lower(titel);`);

// Add reihenfolge column for within-day ordering
const aufgabenSpalten4 = db.pragma('table_info(aufgaben)') as { name: string }[];
if (!aufgabenSpalten4.some((s) => s.name === 'reihenfolge')) {
	db.exec(`ALTER TABLE aufgaben ADD COLUMN reihenfolge INTEGER NOT NULL DEFAULT 0`);
	const tage = db.prepare(
		'SELECT DISTINCT geplant_fuer FROM aufgaben'
	).all() as { geplant_fuer: string }[];
	const initOrder = db.transaction((tage: { geplant_fuer: string }[]) => {
		for (const { geplant_fuer } of tage) {
			const ids = db.prepare(
				'SELECT id FROM aufgaben WHERE geplant_fuer = ? ORDER BY id ASC'
			).all(geplant_fuer) as { id: number }[];
			ids.forEach((row, i) =>
				db.prepare('UPDATE aufgaben SET reihenfolge = ? WHERE id = ?').run(i, row.id)
			);
		}
	});
	initOrder(tage);
}

// Populate personen from existing task assignments
db.exec(`
  INSERT OR IGNORE INTO personen (name)
  SELECT DISTINCT lower(value)
  FROM aufgaben, json_each(zugewiesen_an)
  WHERE zugewiesen_an IS NOT NULL;
`);

export default db;
