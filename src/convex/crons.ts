import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
	'expire checkout holds',
	{ minutes: 1 },
	internal.mutations.expireCheckoutHolds,
	{}
)

export default crons
