export type CascadePayment = {
	_id: string
	_creationTime: number
	amount: number
	refundedAmount: number
	status: string
	stripePaymentIntentId?: string
	label: string
}

export function allocateCascade(args: {
	payments: CascadePayment[]
	totalAmount: number
}): {
	allocation: Array<{
		bookingPaymentId: string
		stripePaymentIntentId: string
		amount: number
		paymentLabel: string
	}>
	totalAllocated: number
	totalAvailable: number
} {
	if (args.totalAmount <= 0) {
		throw new Error('Total amount must be > 0')
	}
	if (!Number.isInteger(args.totalAmount)) {
		throw new Error('Total amount must be integer (grosze)')
	}
	const paidPayments = args.payments
		.filter((p) => p.status === 'paid' && p.stripePaymentIntentId)
		.sort((a, b) => b._creationTime - a._creationTime)

	// Walidacja: czy total mieści się w available
	const totalAvailable = paidPayments.reduce(
		(sum, p) => sum + (p.amount - p.refundedAmount),
		0
	)
	if (args.totalAmount > totalAvailable) {
		throw new Error(
			`Requested ${args.totalAmount} exceeds available ${totalAvailable}`
		)
	}

	// Cascade allocation
	let remaining = args.totalAmount
	const allocation: Array<{
		bookingPaymentId: string
		stripePaymentIntentId: string
		amount: number
		paymentLabel: string
	}> = []

	for (const payment of paidPayments) {
		if (remaining <= 0) break

		const available = payment.amount - payment.refundedAmount
		if (available <= 0) continue

		const allocatedToThisCharge = Math.min(remaining, available)
		allocation.push({
			bookingPaymentId: payment._id,
			stripePaymentIntentId: payment.stripePaymentIntentId!,
			amount: allocatedToThisCharge,
			paymentLabel: payment.label
		})
		remaining -= allocatedToThisCharge
	}
	const totalAllocated = args.totalAmount - remaining

	return { allocation, totalAllocated, totalAvailable }
}
