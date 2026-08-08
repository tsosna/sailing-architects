import type { Doc } from '../_generated/dataModel'

type PaymentStatus = Doc<'bookingPayments'>['status']

export function shouldCancelPaymentAfterFullRefund(args: {
	currentStatus: PaymentStatus
}): boolean {
	return (
		args.currentStatus === 'pending' ||
		args.currentStatus === 'overdue' ||
		args.currentStatus === 'failed'
	)
}
