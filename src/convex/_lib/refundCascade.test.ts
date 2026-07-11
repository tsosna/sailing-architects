import { describe, it, expect } from 'vitest'
import { allocateCascade } from './refundCascade'
import type { CascadePayment } from './refundCascade'

describe('allocateCascade (src/convex/_lib/refundCascade.ts)', () => {
	it('Jedna rata starcza — totalAmount mieści się w najnowszej płatności → allocation ma 1 wpis', () => {
		// Arrange
		const payments: CascadePayment[] = [
			{
				_id: 'p1',
				_creationTime: 1,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				stripePaymentIntentId: 'pi_1',
				label: 'Rata 1'
			},
			{
				_id: 'p2',
				_creationTime: 2,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				stripePaymentIntentId: 'pi_2',
				label: 'Rata 2'
			}
		]

		// Act
		const result = allocateCascade({
			payments,
			totalAmount: 600
		})

		// Assert
		expect(result).toEqual({
			allocation: [
				{
					bookingPaymentId: 'p2',
					stripePaymentIntentId: 'pi_2',
					amount: 600,
					paymentLabel: 'Rata 2'
				}
			],
			totalAllocated: 600,
			totalAvailable: 2000
		})
	})
	it('Przelanie (twoje) — totalAmount większy niż available najnowszej → 2 wpisy, reszta spływa na starszą. Ten test dowodzi też kolejności: najnowsza pierwsza (sort desc po _creationTime).', () => {
		// Arrange
		const payments: CascadePayment[] = [
			{
				_id: 'p1',
				_creationTime: 1,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				stripePaymentIntentId: 'pi_1',
				label: 'Rata 1'
			},
			{
				_id: 'p2',
				_creationTime: 2,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				stripePaymentIntentId: 'pi_2',
				label: 'Rata 2'
			}
		]

		// Act
		const result = allocateCascade({
			payments,
			totalAmount: 1200
		})

		// Assert
		expect(result).toEqual({
			allocation: [
				{
					bookingPaymentId: 'p2',
					stripePaymentIntentId: 'pi_2',
					amount: 1000,
					paymentLabel: 'Rata 2'
				},
				{
					bookingPaymentId: 'p1',
					stripePaymentIntentId: 'pi_1',
					amount: 200,
					paymentLabel: 'Rata 1'
				}
			],
			totalAllocated: 1200,
			totalAvailable: 2000
		})
	})
	it('Filtr statusu (twoje) — payment pending albo bez stripePaymentIntentId w wejściu → nie liczy się do totalAvailable, nie dostaje alokacji.', () => {
		// Arrange
		const payments: CascadePayment[] = [
			{
				_id: 'p1',
				_creationTime: 1,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				stripePaymentIntentId: 'pi_1',
				label: 'Rata 1'
			},
			{
				_id: 'p2',
				_creationTime: 2,
				amount: 1000,
				refundedAmount: 0,
				status: 'pending',
				stripePaymentIntentId: 'pi_2',
				label: 'Rata 2'
			},
			{
				_id: 'p3',
				_creationTime: 3,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				label: 'Rata 3'
			}
		]

		// Act
		const result = allocateCascade({
			payments,
			totalAmount: 500
		})

		// Assert
		expect(result).toEqual({
			allocation: [
				{
					bookingPaymentId: 'p1',
					stripePaymentIntentId: 'pi_1',
					amount: 500,
					paymentLabel: 'Rata 1'
				}
			],
			totalAllocated: 500,
			totalAvailable: 1000
		})
	})
	it('Zużyta rata pominięta — payment z refundedAmount === amount (available 0) → continue, kasa idzie do następnej.', () => {
		// Arrange
		const payments: CascadePayment[] = [
			{
				_id: 'p1',
				_creationTime: 1,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				stripePaymentIntentId: 'pi_1',
				label: 'Rata 1'
			},
			{
				_id: 'p2',
				_creationTime: 2,
				amount: 1000,
				refundedAmount: 1000,
				status: 'paid',
				stripePaymentIntentId: 'pi_2',
				label: 'Rata 2'
			}
		]

		// Act
		const result = allocateCascade({
			payments,
			totalAmount: 500
		})

		// Assert
		expect(result).toEqual({
			allocation: [
				{
					bookingPaymentId: 'p1',
					stripePaymentIntentId: 'pi_1',
					amount: 500,
					paymentLabel: 'Rata 1'
				}
			],
			totalAllocated: 500,
			totalAvailable: 1000
		})
	})
	it('Granica 100% (twoje) — totalAmount === totalAvailable dokładnie → przechodzi bez throw, alokuje wszystko.', () => {
		// Arrange
		const payments: CascadePayment[] = [
			{
				_id: 'p1',
				_creationTime: 1,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				stripePaymentIntentId: 'pi_1',
				label: 'Rata 1'
			}
		]

		// Act
		const result = allocateCascade({
			payments,
			totalAmount: 1000
		})

		// Assert
		expect(result).toEqual({
			allocation: [
				{
					bookingPaymentId: 'p1',
					stripePaymentIntentId: 'pi_1',
					amount: 1000,
					paymentLabel: 'Rata 1'
				}
			],
			totalAllocated: 1000,
			totalAvailable: 1000
		})
	})
	it('totalAmount: 0', () => {
		// Arrange
		const payments: CascadePayment[] = [
			{
				_id: 'p1',
				_creationTime: 1,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				stripePaymentIntentId: 'pi_1',
				label: 'Rata 1'
			}
		]

		// Act
		// Assert

		expect(() => allocateCascade({ payments, totalAmount: 0 })).toThrow(
			'Total amount must be > 0'
		)
	})
	it('totalAmount: 100.5 ', () => {
		// Arrange
		const payments: CascadePayment[] = [
			{
				_id: 'p1',
				_creationTime: 1,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				stripePaymentIntentId: 'pi_1',
				label: 'Rata 1'
			}
		]

		// Act
		// Assert

		expect(() => allocateCascade({ payments, totalAmount: 100.5 })).toThrow(
			'Total amount must be integer (grosze)'
		)
	})
	it(' totalAmount > totalAvailable.', () => {
		// Arrange
		const payments: CascadePayment[] = [
			{
				_id: 'p1',
				_creationTime: 1,
				amount: 1000,
				refundedAmount: 0,
				status: 'paid',
				stripePaymentIntentId: 'pi_1',
				label: 'Rata 1'
			}
		]

		// Act
		// Assert
		expect(() => allocateCascade({ payments, totalAmount: 2000 })).toThrow(
			`Requested 2000 exceeds available 1000`
		)
	})
})
