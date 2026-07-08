import { ConvexHttpClient } from 'convex/browser'
import type {
	FunctionReference,
	FunctionReturnType,
	OptionalRestArgs
} from 'convex/server'
import { PUBLIC_CONVEX_URL } from '$env/static/public'
import { CONVEX_ADMIN_KEY } from '$env/static/private'

/** @internal — exists on ConvexHttpClient at runtime, omitted from public .d.ts */
type ConvexHttpClientWithAdmin = ConvexHttpClient & {
	setAdminAuth(token: string): void
}

type InternalQuery = FunctionReference<'query', 'internal'>
type InternalMutation = FunctionReference<'mutation', 'internal'>

export type ConvexAdminClient = ConvexHttpClientWithAdmin & {
	query<Query extends InternalQuery>(
		query: Query,
		...args: OptionalRestArgs<Query>
	): Promise<FunctionReturnType<Query>>
	mutation<Mutation extends InternalMutation>(
		mutation: Mutation,
		...args: OptionalRestArgs<Mutation>
	): Promise<FunctionReturnType<Mutation>>
}

/**
 * ConvexHttpClient z admin auth dla wywołań `internal.*` z SvelteKit server.
 * Używany przez API routes (Stripe webhook, payment endpoints) do wołania
 * mutations server-only które nie są wystawione w `api.*`.
 *
 * NIE używać w `+page.svelte` / `+page.ts` (uniwersalne) — admin key
 * jest sekretem server-side.
 */
export function createConvexAdminClient(): ConvexAdminClient {
	const client = new ConvexHttpClient(
		PUBLIC_CONVEX_URL
	) as ConvexHttpClientWithAdmin
	client.setAdminAuth(CONVEX_ADMIN_KEY)
	return client as ConvexAdminClient
}
