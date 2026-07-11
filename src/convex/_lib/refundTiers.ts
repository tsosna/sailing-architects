export function matchRefundTier(args: {
	tiers: Array<{ minDaysBefore: number; refundPercent: number }>
	daysBeforeDeparture: number
	availableToRefund: number
}) {
	const sortedTiers = [...args.tiers].sort(
		(a, b) => b.minDaysBefore - a.minDaysBefore
	)
	const matchedTier =
		sortedTiers.find((t) => args.daysBeforeDeparture >= t.minDaysBefore) ?? null
	const percent = matchedTier?.refundPercent ?? 0
	const suggestedAmount = Math.floor(args.availableToRefund * percent)

	return { matchedTier, percent, suggestedAmount }
}
