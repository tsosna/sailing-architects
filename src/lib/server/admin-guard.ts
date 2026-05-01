import { dev } from '$app/environment'
import { error, redirect } from '@sveltejs/kit'
import { clerkClient } from 'svelte-clerk/server'
import { env } from '$env/dynamic/private'

const ADMIN_ROLE = 'admin'

type AuthLike = {
	auth: () => {
		userId: string | null
		sessionClaims?: Record<string, unknown> | null
	}
}

export type AdminCheck = {
	userId: string
	source: 'clerk-role' | 'dev-allowlist'
}

function getDevAllowlist(): string[] {
	const raw = env.ADMIN_DEV_ALLOWLIST ?? ''
	return raw
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean)
}

function readClaimRole(
	claims: Record<string, unknown> | null | undefined
): string | undefined {
	if (!claims) return undefined
	const direct = (claims as { role?: unknown }).role
	if (typeof direct === 'string') return direct
	const meta =
		(claims as { publicMetadata?: { role?: unknown } }).publicMetadata ??
		(claims as { metadata?: { role?: unknown } }).metadata
	const role = meta?.role
	return typeof role === 'string' ? role : undefined
}

/**
 * Resolve admin status for the current request. Returns null when the user is
 * not signed in or has no admin permissions. Caller decides whether to
 * redirect, render a forbidden state, or fall back silently.
 */
export async function resolveAdmin(
	locals: AuthLike
): Promise<AdminCheck | null> {
	const auth = locals.auth()
	if (!auth.userId) return null

	const claimRole = readClaimRole(auth.sessionClaims)
	if (claimRole === ADMIN_ROLE) {
		return { userId: auth.userId, source: 'clerk-role' }
	}

	let role: string | undefined
	let emails: string[] = []
	try {
		const user = await clerkClient.users.getUser(auth.userId)
		const meta = (user.publicMetadata ?? {}) as { role?: unknown }
		if (typeof meta.role === 'string') role = meta.role
		emails = (user.emailAddresses ?? [])
			.map((entry) => entry.emailAddress?.toLowerCase())
			.filter((value): value is string => Boolean(value))
	} catch {
		return null
	}

	if (role === ADMIN_ROLE) {
		return { userId: auth.userId, source: 'clerk-role' }
	}

	if (dev) {
		const allowlist = getDevAllowlist()
		if (allowlist.length && emails.some((mail) => allowlist.includes(mail))) {
			return { userId: auth.userId, source: 'dev-allowlist' }
		}
	}

	return null
}

/**
 * Throw the appropriate response when the current user is not an admin.
 * Anonymous users are redirected to sign-in; signed-in non-admins get a 403
 * which the nearest +error.svelte renders as a forbidden state.
 */
export async function requireAdmin(locals: AuthLike): Promise<AdminCheck> {
	const { userId } = locals.auth()
	if (!userId) {
		throw redirect(303, '/book?auth=signin&next=admin')
	}
	const result = await resolveAdmin(locals)
	if (!result) {
		throw error(403, 'Brak uprawnień administracyjnych.')
	}
	return result
}
