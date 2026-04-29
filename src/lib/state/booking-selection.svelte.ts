import { voyageSegments } from '$lib/data/voyage-segments'

class BookingSelection {
	selectedSegment = $state(voyageSegments[0].id)
	selectedBerths = $state<string[]>([])

	get hasSelectedBerths() {
		return this.selectedBerths.length > 0
	}

	get selectedBerthsParam() {
		return this.selectedBerths.join(',')
	}

	selectSegment(id: string) {
		if (!voyageSegments.some((segment) => segment.id === id)) return

		if (this.selectedSegment !== id) {
			this.selectedSegment = id
			this.selectedBerths = []
		}
	}

	toggleBerth(id: string) {
		if (this.selectedBerths.includes(id)) {
			this.selectedBerths = this.selectedBerths.filter((berth) => berth !== id)
		} else {
			this.selectedBerths = [...this.selectedBerths, id]
		}
	}

	bookingPath(base: string, segmentId = this.selectedSegment) {
		const params = new URLSearchParams({ segment: segmentId })

		if (this.hasSelectedBerths && segmentId === this.selectedSegment) {
			params.set('berths', this.selectedBerthsParam)
		}

		return `${base}?${params.toString()}`
	}
}

export const bookingSelection = new BookingSelection()
