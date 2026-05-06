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
`);

export default db;
