import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
	'expire checkout holds',
	{ minutes: 1 },
	internal.mutations.expireCheckoutHolds,
	{}
)

crons.daily(
	'mark overdue payments',
	{ hourUTC: 6, minuteUTC: 0 },
	internal.reminders.markOverduePayments,
	{}
)

crons.daily(
	'send crew data reminders',
	{ hourUTC: 9, minuteUTC: 0 },
	internal.reminders.sendCrewDataReminders,
	{}
)

crons.daily(
	'send upcoming payment reminders',
	{ hourUTC: 9, minuteUTC: 5 },
	internal.reminders.sendUpcomingPaymentReminders,
	{}
)

crons.daily(
	'send overdue payment reminders',
	{ hourUTC: 9, minuteUTC: 10 },
	internal.reminders.sendOverduePaymentReminders,
	{}
)

export default crons
