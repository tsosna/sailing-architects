import { error } from '@sveltejs/kit'
import { ConvexHttpClient } from 'convex/browser'
import { PUBLIC_CONVEX_URL } from '$env/static/public'
import {
	bookingConfirmationFilename,
	generateBookingConfirmationPdf
} from '$lib/server/booking-confirmation-pdf'
import { api } from '$convex/api'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, locals }) => {
	const { getToken } = locals.auth()
	const token = await getToken({ template: 'convex' })
	if (!token) error(401, 'Unauthorized')

	const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL)
	convex.setAuth(token)

	const confirmation = await convex.query(
		api.queries.bookingConfirmationByRef,
		{
			bookingRef: params.bookingRef
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
