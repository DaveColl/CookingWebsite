import type { Actions } from './$types';
import Database, { SqliteError } from 'better-sqlite3';

// Connect to your database
const db = new Database('rezepte.db');

export const actions = {
	create: async ({ request }) => {
		//create wird aufgerufen wenn die HTML create als ?/create hat normalerweise wird default ausgeführt wenn nichts definiert wurde
		// 1. Extract the form data from the incoming request
		const formData = await request.formData();

		// 2. Convert inputs into values for the db
		const titel = formData.get('titel')?.toString().trim(); // get('titel') braucht das ? um zu checken ob das Ergebnis nicht null ist, trim entfernt nur Randleerzeichen
		const portionen = Number(formData.get('portionen')); // number gibt bei null 0 aus und bei Text NaN
		const zubereitungszeit = Number(formData.get('zubereitungszeit'));
		const anleitung = formData.get('anleitung')?.toString().trim();

		if (
			!titel ||
			!anleitung ||
			!(portionen > 0) ||
			!Number.isInteger(portionen) ||
			!(zubereitungszeit > 0) ||
			!Number.isInteger(zubereitungszeit)
		) {
			return {
				erfolg: false,
				message: 'Füll die Felder korrekt aus (nur ganze Zahlen > 0).',
				werte: { titel, portionen, zubereitungszeit, anleitung }
			};
		}

		const statement = db.prepare(`
      INSERT INTO rezepte(titel, portionen, zubereitungszeit, anleitung)
      VALUES (?,?,?,?)
      `);

		try {
			statement.run(titel, portionen, zubereitungszeit, anleitung);
			console.log('Received recipe data on server:', titel, portionen, zubereitungszeit, anleitung);
			return {
				erfolg: true,
				message: 'Daten wurden in die Datenbank eingetragen'
			};
		} catch (error: unknown) {
			if (error instanceof SqliteError) {
				if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
					return {
						erfolg: false,
						message: 'Das Rezept befindet sich bereits in der Datenbank'
					};
				}
			}
			console.error('Systemerror: ', error);
			return {
				erfolg: false,
				message: 'Ein unerwarteter Fehler ist aufgetreten'
			};
		}
	}
} satisfies Actions;
