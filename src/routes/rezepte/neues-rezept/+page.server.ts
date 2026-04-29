import type { Actions } from './$types';
import Database from 'better-sqlite3';

// Connect to your database
//const db = new Database('rezepte.db');

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
				eingabefehler: true,
				message: 'Füll die Felder korrekt aus (nur ganze Zahlen > 0).',
				werte: { titel, portionen, zubereitungszeit, anleitung }
			};
		}

		console.log('Received recipe data on server:', titel, portionen, zubereitungszeit, anleitung);

		// 3. Do your database saving or API calling here
		// const recipeName = formData.get('recipe_name');

		// 4. Return a response to the frontend
		return { success: true };
	}
} satisfies Actions;
