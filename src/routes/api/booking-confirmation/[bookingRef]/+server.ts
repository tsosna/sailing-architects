import { error } from '@sveltejs/kit'
import { ConvexHttpClient } from 'convex/browser'
import { PUBLIC_CONVEX_URL } from '$env/static/public'
import {
	bookingConfirmationFilename,
	generateBookingConfirmationPdf
} from '$lib/server/booking-confirmation-pdf'
import { api } from '$convex/api'
import type { RequestHandler } from './$types'

const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL)

export const GET: RequestHandler = async ({ params, url }) => {
	const userId = url.searchParams.get('userId')
	if (!userId) error(400, 'Missing userId')

	const confirmation = await convex.query(
		api.queries.bookingConfirmationByRef,
		{
			bookingRef: params.bookingRef,
			userId
		}
	)

	if (!confirmation) error(404, 'Booking not found')
	const pdf = await generateBookingConfirmationPdf(confirmation)
	const filename = bookingConfirmationFilename(confirmation.booking.bookingRef)

	return new Response(new Uint8Array(pdf), {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `attachment; filename="${filename}"`,
			'cache-control': 'no-store'
		}
	})
}
