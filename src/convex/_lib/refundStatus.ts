import type {Doc} from '../_generated/dataModel'

type PaymentStatus = NonNullable<Doc<'bookings'>['paymentStatus']>

export function calculatePaymentStatusAfterRefund(args:{
    totalPaid: number
    totalRefunded: number
    currentStatus: PaymentStatus 
}): PaymentStatus {
    if (args.totalRefunded === 0) return args.currentStatus
    if (args.totalRefunded>= args.totalPaid) return 'refunded'
    return 'partially_refunded'
}