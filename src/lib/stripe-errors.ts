const messages: Record<string, string> = {
	payment_intent_unexpected_state:
		'Ta płatność jest już nieaktualna. Odśwież stronę, aby zobaczyć aktualny stan rezerwacji.',
	card_declined: 'Twój bank odrzucił płatność.',
	expired_card:
		'Twoja karta straciła ważność. Użyj innej lub zmień formę płatności.',
	incorrect_cvc: 'Kod CVC jest niepoprawny — wprowadź go jeszcze raz.',
	incorrect_number: 'Numer karty jest niepoprawny — wprowadź go jeszcze raz.',
	processing_error:
		'Przetwarzanie Twojej płatności nie powiodło się. Spróbuj jeszcze raz za chwilę.',
	payment_intent_authentication_failure:
		'Dwuetapowe potwierdzenie Twojego banku nie powiodło się. Spróbuj jeszcze raz za chwilę.'
}

const declineMessage: Record<string, string> = {
	insufficient_funds: 'Brak środków na koncie. Zasil konto i spróbuj ponownie.',
	do_not_honor:
		'Odmowa Twojego banku bez podania powodu. Skontaktuj się z Twoim bankiem.',
	generic_decline:
		'Odmowa Twojego banku bez podania szczegółów. Skontaktuj się z Twoim bankiem.',
	transaction_not_allowed:
		'Odmowa Twojego banku, ze względu na typ transakcji. Skontaktuj się z Twoim bankiem.',
	card_velocity_exceeded:
		'Przekroczenie limitu transakcji lub kwoty. Zwiększ swoje limity.'
}

export function stripeErrorMessage(
	code: string | undefined,
	declineCode: string | undefined,
	fallback: string | undefined
): string {
	const general = code ? messages[code] : undefined
	const detail = declineCode ? declineMessage[declineCode] : undefined
	if (general && detail) return `${general} ${detail}`
	if (general) return general
	return fallback ?? 'Płatność nie powiodła się'
}
