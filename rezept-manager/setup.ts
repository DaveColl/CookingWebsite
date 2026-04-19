import Database from 'better-sqlite3';

const db = new Database('rezepte.db');

const create_table = `
-- Tabelle fuer Rezepte IF NOT EXISTS prueft ob die Tabelle bereits erstellt wurde
  CREATE TABLE IF NOT EXISTS rezepte(
    id INTEGER PRIMARY KEY,
    titel TEXT UNIQUE,
    portionen INTEGER,
    zubereitungszeit INTEGER,
    anleitung TEXT
    );
-- Tabelle fuer Zutaten, denn Rezepte benutzen die selben Zutaten oefters
  CREATE TABLE IF NOT EXISTS zutaten(
    id INTEGER PRIMARY KEY,
    zutat TEXT UNIQUE,
    ist_fluessigkeit INTEGER
    );
-- Tabelle um zutaten rezepte zuzuordnen
  CREATE TABLE IF NOT EXISTS rezepte_zutaten(
    rezept_id INTEGER,
    zutat_id INTEGER,
    menge INTEGER,
    einheit TEXT,
    PRIMARY KEY (rezept_id, zutat_id),
    FOREIGN KEY (rezept_id) REFERENCES rezepte(id)
    FOREIGN KEY (zutat_id) REFERENCES zutaten(id)
  );
  `;

db.exec(create_table);

console.log('yessir');
