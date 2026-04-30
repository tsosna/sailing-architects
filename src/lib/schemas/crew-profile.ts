import { z } from 'zod'

const dateOfBirthPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/
const phonePattern = /^\+?[0-9\s-]{7,20}$/
const documentPattern = /^[A-Z0-9]{5,15}$/
const polishIdPattern = /^[A-Z]{3}\d{6}$/

function isPastDate(value: string): boolean {
	const match = value.match(dateOfBirthPattern)
	if (!match) return false

	const day = Number(match[1])
	const month = Number(match[2])
	const year = Number(match[3])
	const date = new Date(year, month - 1, day)

	if (
		date.getFullYear() !== year ||
		date.getMonth() !== month - 1 ||
		date.getDate() !== day
	) {
		return false
	}

	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return date < today
}

function hasValidPhoneLength(value: string): boolean {
	const digits = value.replace(/\D/g, '')
	return digits.length >= 7 && digits.length <= 15
}

export const crewProfileSchema = z
	.object({
		firstName: z.string().trim().min(1, 'Pole wymagane'),
		lastName: z.string().trim().min(1, 'Pole wymagane'),
		email: z.string().trim().email('Podaj poprawny adres e-mail'),
		dob: z
			.string()
			.trim()
			.min(1, 'Pole wymagane')
			.refine(isPastDate, 'Podaj datę w formacie dd/mm/yyyy'),
		birthPlace: z.string().trim().min(1, 'Pole wymagane'),
		nationality: z.string().min(1, 'Wybierz narodowość'),
		phone: z
			.string()
			.trim()
			.min(1, 'Pole wymagane')
			.regex(phonePattern, 'Podaj poprawny numer telefonu')
			.refine(hasValidPhoneLength, 'Podaj poprawny numer telefonu'),
		docType: z.enum(['passport', 'id']),
		docNumber: z
			.string()
			.trim()
			.min(1, 'Pole wymagane')
			.transform((value) => value.toUpperCase())
			.refine((value) => documentPattern.test(value), {
				message: 'Użyj 5-15 liter i cyfr, bez spacji'
			}),
		emergencyName: z.string().trim().min(1, 'Pole wymagane'),
		emergencyPhone: z
			.string()
			.trim()
			.min(1, 'Pole wymagane')
			.regex(phonePattern, 'Podaj poprawny numer telefonu')
			.refine(hasValidPhoneLength, 'Podaj poprawny numer telefonu'),
		swimming: z.string().min(1, 'Wybierz opcję'),
		experience: z.string().min(1, 'Wybierz opcję'),
		diet: z.string().trim(),
		medical: z.string().trim()
	})
	.superRefine((value, ctx) => {
		if (
			value.nationality === 'PL' &&
			value.docType === 'id' &&
			!polishIdPattern.test(value.docNumber)
		) {
			ctx.addIssue({
				code: 'custom',
				path: ['docNumber'],
				message: 'Polski dowód ma format ABC123456'
			})
		}
	})

export type CrewProfileForm = z.input<typeof crewProfileSchema>
export type CrewProfileData = z.output<typeof crewProfileSchema>

export function getCrewProfileErrors(
	error: z.ZodError
): Record<string, string> {
	const next: Record<string, string> = {}

	for (const issue of error.issues) {
		const field = issue.path[0]
		if (typeof field === 'string' && !next[field]) {
			next[field] = issue.message
		}
	}

	return next
}
