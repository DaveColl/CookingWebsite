/**
 * Macht einen Wert tief reaktiv (wie `$state`).
 *
 * Gedacht für beschreibbare `$derived`-Werte, die serverseitige Daten spiegeln und
 * zusätzlich optimistisch verändert werden: `$derived` selbst proxied Objekte nicht,
 * verschachtelte Mutationen wie `liste[i].erledigt = 1` wären sonst nicht reaktiv.
 *
 *   let daten = $derived(tiefReaktiv(data));   // folgt `data` nach invalidate
 *   daten = tiefReaktiv(JSON.parse(e.data));    // SSE-Update überschreibt lokal
 */
export function tiefReaktiv<T>(wert: T): T {
	const zustand = $state({ wert });
	return zustand.wert;
}
