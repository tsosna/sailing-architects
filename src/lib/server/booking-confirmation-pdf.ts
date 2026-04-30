import { createRequire } from 'node:module'
import PDFDocument from 'pdfkit'

const require = createRequire(import.meta.url)
const regularFontPath = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf')
const boldFontPath = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf')

type BookingConfirmationPayload = {
	booking: {
		bookingRef: string
		status: string
		paidAt?: number
	}
	segment: {
		name: string
		dates: string
		days: number
		pricePerBerth: number
	} | null
	profile: {
		firstName: string
		lastName: string
		email?: string
		dateOfBirth: string
		birthPlace?: string
		nationality: string
		phone?: string
		docType: 'passport' | 'id'
		docNumber: string
		emergencyContactName: string
		emergencyContactPhone: string
	} | null
	berths: Array<{ berthId: string }>
}

function sanitizeFilename(value: string): string {
	return value.replace(/[^A-Z0-9-]/gi, '_')
}

function money(value: number): string {
	return `${value.toLocaleString('pl-PL')} PLN`
}

function statusLabel(status: string): string {
	switch (status) {
		case 'confirmed':
			return 'Potwierdzona'
		case 'pending':
			return 'Oczekuje na płatność'
		case 'expired':
			return 'Wygasła'
		case 'cancelled':
			return 'Anulowana'
		default:
			return status
	}
}

function writeRow(doc: PDFKit.PDFDocument, label: string, value: string) {
	doc
		.font('DejaVu-Bold')
		.fontSize(9)
		.fillColor('#6b7280')
		.text(label.toUpperCase(), { continued: true })
		.font('DejaVu')
		.fontSize(11)
		.fillColor('#111827')
		.text(`  ${value}`)
		.moveDown(0.55)
}

function collectPdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = []
		doc.on('data', (chunk: Buffer) => chunks.push(chunk))
		doc.on('end', () => resolve(Buffer.concat(chunks)))
		doc.on('error', reject)
		doc.end()
	})
}

export function bookingConfirmationFilename(bookingRef: string): string {
	return `sailing-architects-${sanitizeFilename(bookingRef)}.pdf`
}

export async function generateBookingConfirmationPdf(
	confirmation: BookingConfirmationPayload
): Promise<Buffer> {
	const { booking, segment, profile, berths } = confirmation
	if (!segment) throw new Error('Voyage segment not found')

	const berthIds = berths.map((b) => b.berthId).join(', ')
	const total = segment.pricePerBerth * berths.length
	const issuedAt = new Date().toLocaleDateString('pl-PL')
	const paidAt = booking.paidAt
		? new Date(booking.paidAt).toLocaleDateString('pl-PL')
		: '-'

	const doc = new PDFDocument({
		size: 'A4',
		margin: 56,
		info: {
			Title: `Potwierdzenie rezerwacji ${booking.bookingRef}`,
			Author: 'Sailing Architects'
		}
	})

	doc.registerFont('DejaVu', regularFontPath)
	doc.registerFont('DejaVu-Bold', boldFontPath)

	doc
		.rect(0, 0, doc.page.width, 132)
		.fill('#0d1b2e')
		.fillColor('#c4923a')
		.font('DejaVu-Bold')
		.fontSize(12)
		.text('SAILING ARCHITECTS', 56, 42, { characterSpacing: 1.6 })
		.fillColor('#f5f0e8')
		.font('DejaVu')
		.fontSize(28)
		.text('Potwierdzenie rezerwacji', 56, 66)

	doc
		.fillColor('#111827')
		.font('DejaVu-Bold')
		.fontSize(16)
		.text(booking.bookingRef, 56, 166)
		.font('DejaVu')
		.fontSize(10)
		.fillColor('#6b7280')
		.text(`Wystawiono: ${issuedAt}`)
		.moveDown(2)

	writeRow(doc, 'Status', statusLabel(booking.status))
	writeRow(doc, 'Rejs', 'Sail Adventure 2026')
	writeRow(doc, 'Etap', segment.name)
	writeRow(doc, 'Termin', segment.dates)
	writeRow(doc, 'Liczba dni', String(segment.days))
	writeRow(doc, berths.length === 1 ? 'Koja' : 'Koje', berthIds || '-')
	writeRow(doc, 'Cena za miejsce', money(segment.pricePerBerth))
	writeRow(doc, 'Razem', money(total))
	writeRow(doc, 'Data płatności', paidAt)

	doc.moveDown(1.2).font('DejaVu-Bold').fontSize(13).fillColor('#0d1b2e')
	doc.text('Dane uczestnika')
	doc.moveDown(0.8)

	if (profile) {
		writeRow(doc, 'Imię i nazwisko', `${profile.firstName} ${profile.lastName}`)
		writeRow(doc, 'E-mail', profile.email ?? '-')
		writeRow(doc, 'Data urodzenia', profile.dateOfBirth)
		writeRow(doc, 'Miejsce urodzenia', profile.birthPlace ?? '-')
		writeRow(doc, 'Narodowość', profile.nationality)
		writeRow(doc, 'Telefon', profile.phone ?? '-')
		writeRow(doc, 'Dokument', `${profile.docType} ${profile.docNumber}`)
		writeRow(doc, 'Kontakt alarmowy', profile.emergencyContactName)
		writeRow(doc, 'Tel. alarmowy', profile.emergencyContactPhone)
	} else {
		doc.font('DejaVu').fontSize(11).fillColor('#111827')
		doc.text('Profil załogi nie został jeszcze uzupełniony.')
	}

	doc
		.moveDown(2)
		.font('DejaVu')
		.fontSize(9)
		.fillColor('#6b7280')
		.text(
			'Dokument wygenerowany automatycznie. W razie pytań skontaktuj się z organizatorem: sailingarchitects@gmail.com'
		)

	return collectPdf(doc)
}
