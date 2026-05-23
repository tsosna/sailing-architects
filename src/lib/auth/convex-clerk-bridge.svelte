<script lang="ts">
    import { useClerkContext } from 'svelte-clerk'
    import { useConvexClient } from 'convex-svelte'
  
    const clerkCtx = useClerkContext()
    const convexClient = useConvexClient()
  
    $effect(() => {
      const session = clerkCtx.session
      convexClient.setAuth(async () =>
        session ? ((await session.getToken({ template: 'convex' })) ?? null) : null
      )
    })
  </script>