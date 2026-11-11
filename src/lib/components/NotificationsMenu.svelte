<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Bell, CheckCheck } from '@lucide/svelte';
	import Avatar from './Avatar.svelte';
	import { dismissable } from '$lib/actions';
	import type { Activity } from '$lib/types';
	import { relativeTime } from '$lib/utils';

	let {
		activity = [],
		notifications = [],
		unread = 0
	}: { activity?: Activity[]; notifications?: Activity[]; unread?: number } = $props();

	let markingRead = $state(false);

	function notificationText(item: Activity) {
		switch (item.kind) {
			case 'note_verified':
				return 'Your note was verified';
			case 'note_rejected':
				return 'Your note needs a revision';
			default:
				return 'There is an update on your note';
		}
	}

	function activityText(item: Activity) {
		const name = item.actor?.full_name?.split(' ')[0] ?? 'A student';
		switch (item.kind) {
			case 'note_verified':
				return `${name} verified a note`;
			case 'note_rejected':
				return `${name} returned a note for revision`;
			case 'note_submitted':
				return `${name} shared a note`;
			default:
				return `${name} added a contribution`;
		}
	}

	async function markAllRead() {
		if (markingRead) return;
		markingRead = true;
		try {
			await fetch('/api/notifications/seen', { method: 'POST' });
			await invalidateAll();
		} finally {
			markingRead = false;
		}
	}
</script>

<details class="relative" use:dismissable>
	<summary
		class="relative flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border-[2.5px] border-ink bg-white transition hover:bg-paper-deep [&::-webkit-details-marker]:hidden"
		aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
		title="Notifications"
	>
		<Bell size={18} strokeWidth={2.2} />
		{#if unread > 0}
			<span
				class="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-[#e5484d] px-1 font-mono text-[0.6rem] font-bold text-white"
			>
				{unread > 9 ? '9+' : unread}
			</span>
		{/if}
	</summary>

	<div class="menu-panel absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,360px)] overflow-hidden">
		<div class="flex items-center justify-between gap-2 border-b-[3px] border-ink bg-paper-deep px-3 py-2.5">
			<span class="kicker">Your updates</span>
			{#if unread > 0}
				<button
					type="button"
					class="link inline-flex items-center gap-1 text-xs"
					onclick={markAllRead}
					disabled={markingRead}
				>
					<CheckCheck size={13} />
					{markingRead ? 'Marking…' : 'Mark all read'}
				</button>
			{:else}
				<span class="text-xs text-ink-soft">All caught up</span>
			{/if}
		</div>

		<div class="scroll-thin max-h-[60vh] overflow-y-auto">
			{#if notifications.length}
				<p class="px-3 pt-2.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-ink-soft">On your notes</p>
				<ul class="divide-y divide-ink/10">
					{#each notifications.slice(0, 5) as item (item.id)}
						<li>
							<a
								href={item.note ? `/notes/${item.note.id}` : '/notes'}
								class="flex gap-2.5 px-3 py-2.5 transition hover:bg-paper-deep/70"
							>
								<span
									class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink {item.kind ===
									'note_verified'
										? 'bg-leaf'
										: 'bg-blush'}"
								>
									<Bell size={13} />
								</span>
								<span class="min-w-0">
									<span class="block text-sm font-semibold leading-snug">{notificationText(item)}</span>
									{#if item.note?.title}
										<span class="block truncate text-xs text-ink-soft">{item.note.title}</span>
									{/if}
									<span class="mt-0.5 block text-xs text-ink-faint">
										{item.actor?.full_name ? `${item.actor.full_name} · ` : ''}{relativeTime(item.created_at)}
									</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			{#if activity.length}
				<p
					class="px-3 pt-2.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-ink-soft {notifications.length
						? 'border-t-2 border-ink/10'
						: ''}"
				>
					Around the board
				</p>
				<ul class="divide-y divide-ink/10">
					{#each activity.slice(0, 4) as item (item.id)}
						<li>
							<a
								href={item.note ? `/notes/${item.note.id}` : '/notes'}
								class="flex gap-2.5 px-3 py-2.5 transition hover:bg-paper-deep/70"
							>
								<Avatar name={item.actor?.full_name} color={item.actor?.avatar_color} size={28} />
								<span class="min-w-0">
									<span class="block text-sm font-semibold leading-snug">{activityText(item)}</span>
									{#if item.note?.title}
										<span class="block truncate text-xs text-ink-soft">{item.note.title}</span>
									{/if}
									<span class="mt-0.5 block text-xs text-ink-faint">{relativeTime(item.created_at)}</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			{#if notifications.length === 0 && activity.length === 0}
				<p class="p-4 text-sm text-ink-soft">No activity yet. Be the first to share a note.</p>
			{/if}
		</div>
	</div>
</details>
