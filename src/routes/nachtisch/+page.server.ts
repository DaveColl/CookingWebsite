import type { PageServerLoad } from './$types';
import { rezeptkartenLaden } from '$lib/rezeptkarten.server';

export const load: PageServerLoad = () => {
	return { rezepte: rezeptkartenLaden('nachtisch') };
};
