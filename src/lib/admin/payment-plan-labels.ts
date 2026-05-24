/** Admin-only copy — kept out of .svelte so Wuchale does not wrap script literals. */

export const PAYMENT_PLAN_FALLBACK_NAME = 'Plan domyślny'

export function defaultPlanName(segmentName: string) {
	return `Plan ${segmentName}`
}

export const PAYMENT_PLAN_ITEM_LABELS = {
	full: 'Całość',
	customFirst: 'Pozycja 1',
	deposit: 'Zaliczka',
	installment: (index: number) => `Rata ${index}`,
	item: (index: number) => `Pozycja ${index}`
} as const

export const PAYMENT_PLAN_TOAST = {
	regenerated:
		'Pozycje wygenerowane. Możesz teraz dopiąć kwoty i terminy.',
	sumOver: 'Suma pozycji przekracza cenę za koję. Skoryguj kwoty.',
	amountRequired: 'Każda pozycja musi mieć kwotę większą od zera.',
	labelRequired: 'Każda pozycja musi mieć nazwę.',
	dueRequired: 'Każda pozycja musi mieć datę.',
	saved:
		'Plan zapisany. Nowe rezerwacje dostaną ten harmonogram; istniejące pozostają bez zmian.',
	saveFailed: 'Nie udało się zapisać planu.'
} as const
