export type ToastStatus = 'success' | 'error' | 'info' | 'warning'

export type Toast = {
	id: string
	message: string
	status: ToastStatus
	duration: number
}
type AddToastOptions = {
	message: string
	status?: ToastStatus
	duration?: number
}

class ToastState {
	toasts = $state<Toast[]>([])
	private timeouts = new Map<string, ReturnType<typeof setTimeout>>()

	addToast(options: AddToastOptions) {
		const { message, status = 'info', duration = 3000 } = options
		const id = crypto.randomUUID()
		this.toasts = [...this.toasts, { id, message, status, duration }]
		if (duration > 0 && duration !== Infinity) {
			const timeoutId = setTimeout(() => this.removeToast(id), duration)
			this.timeouts.set(id, timeoutId)
		}
	}

	removeToast(id: string) {
		const pending = this.timeouts.get(id)
		if (pending !== undefined) {
			clearTimeout(pending)
			this.timeouts.delete(id)
		}
		this.toasts = this.toasts.filter((toast) => toast.id !== id)
	}
}

export const toastState = new ToastState()
