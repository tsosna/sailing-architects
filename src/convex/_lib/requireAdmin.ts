import type {
	GenericQueryCtx,
	GenericMutationCtx,
	GenericActionCtx
} from 'convex/server'
import type { DataModel } from '../_generated/dataModel'

type AnyCtx =
	| GenericQueryCtx<DataModel>
	| GenericMutationCtx<DataModel>
	| GenericActionCtx<DataModel>

const ADMIN_ROLE = 'admin'

export async function requireConvexAdmin(ctx: AnyCtx) {
	const identity = await ctx.auth.getUserIdentity()
	if (!identity) {
		throw new Error('Unauthorized: brak sesji')
	}
	const role = (identity as { role?: unknown }).role
	if (role !== ADMIN_ROLE) {
		throw new Error('Forbidden: wymagana rola admin')
	}
	return identity
}
