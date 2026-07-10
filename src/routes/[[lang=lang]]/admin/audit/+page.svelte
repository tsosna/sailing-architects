<script lang="ts">
	import { useQuery } from 'convex-svelte'
	import { api } from '$convex/api'

	const auditQuery = useQuery(api.admin.listRecentAuditLog, () => ({}))
</script>

<section class="audit">
	<h1>Historia akcji admina</h1>
	{#if auditQuery.isLoading}
		<p>Wczytuje</p>
	{:else if auditQuery.error}
		<p>Błąd: {auditQuery.error.message}</p>
	{:else if auditQuery.data}
		<table>
			<thead
				><tr>
					<th>Data</th>
					<th>Akcja</th>
					<th>Rezerwacja</th>
					<th>Szczegóły</th>
					<th>Admin</th>
				</tr>
			</thead>
			<tbody>
				{#each auditQuery.data as entry (entry._id)}
					<tr>
						<th>{new Date(entry._creationTime).toLocaleString('pl-PL')}</th>
						<th>{entry.action}</th>
						<th>{entry.bookingRef ?? '-'}</th>
						<td>
							{#if entry.action === 'refund_initiated'}
								Zwrot zainicjowany :{(entry.metadata.totalAmount / 100).toFixed(
									2
								)} zł {entry.metadata.releaseBerth ? ' · koja zwolniona' : ''}
							{:else if entry.action === 'refund_completed'}
								Zwrot potwierdzony: {(
									entry.metadata.amountRefunded / 100
								).toFixed(2)} zł
							{:else if entry.action === 'refund_failed'}
								Zwrot nieudany: {entry.metadata.failureReason ?? '-'}
							{:else if entry.action === 'reblock_berth'}
								Koja zablokowana ponownie
							{:else if entry.action === 'release_berth_manual'}
								Koja zwolniona ręcznie
							{:else if entry.action === 'policy_updated'}
								Zmiana progów zwrotu
							{/if}
						</td>
						<th>{entry.adminName ?? entry.adminUserId}</th>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

<style>
	.audit {
		padding: 2rem;
		max-width: 1100px;
		margin: 0 auto;
		color: var(--admin-warm-white);
	}

	.audit h1 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th {
		text-align: left;
		padding: 0.5rem 0.75rem;
		color: var(--admin-brass);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.75rem;
		border-bottom: 1px solid var(--admin-line-strong);
	}

	td {
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid var(--admin-line);
		vertical-align: top;
	}

	tbody tr:hover {
		background: var(--admin-navy-mid);
	}
</style>
