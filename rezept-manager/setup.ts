import Database from 'better-sqlite3';

const db = new Database('rezepte.db');

const create_table = `
  CREATE TABLE IF NOT EXISTS rezepte(
    id INTEGER PRIMARY KEY,
    titel TEXT UNIQUE,
    portionen INTEGER,
    zubereitungszeit INTEGER,
    anleitung TEXT
    );
  CREATE TABLE IF NOT EXISTS zutaten(
    id INTEGER PRIMARY KEY,
    zutat TEXT UNIQUE,
    istFlüssigkeit INTEGER
    );
  `;

db.exec(create_table);

console.log('yessir');
