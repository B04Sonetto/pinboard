<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { Bell, Menu, PenLine, Search, Settings, UserRound, BookMarked, LogOut, ShieldCheck, CheckCheck } from '@lucide/svelte';
	import Avatar from './Avatar.svelte';
	import type { Activity, Profile } from '$lib/types';
	import { relativeTime } from '$lib/utils';

	let {
		profile,
		activity = [],
		notifications = [],
		unread = 0,
		onMenu
	}: {
		profile: Profile;
		activity?: Activity[];
		notifications?: Activity[];
		unread?: number;
		onMenu: () => void;
	} = $props();

	let searchInput = $state<HTMLInputElement>();
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

	$effect(() => {
		function onKey(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) {
				event.preventDefault();
				searchInput?.focus();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<header
	class="sticky top-0 z-40 flex min-h-16 items-center gap-2 border-b-2 border-ink bg-paper/95 px-3 py-2 backdrop-blur sm:px-5"
>
	<button type="button" class="btn btn-secondary btn-icon btn-sm lg:hidden" aria-label="Open navigation" onclick={onMenu}>
		<Menu size={18} />
	</button>

	<form action="/notes" method="get" class="relative min-w-0 flex-1 sm:max-w-md" role="search">
		<label class="flex min-h-10 items-center gap-2 rounded-lg border-2 border-ink bg-white px-2.5">
			<Search size={16} class="shrink-0 text-ink-soft" />
			<input
				bind:this={searchInput}
				type="search"
				name="q"
				value={page.url.searchParams.get('q') ?? ''}
				placeholder="Search notes, subjects, topics…"
				aria-label="Search notes"
				class="min-w-0 flex-1 border-none bg-transparent text-[0.82rem] outline-none placeholder:text-ink-faint"
			/>
			<kbd class="hidden rounded border border-ink/30 bg-paper px-1 font-mono text-[0.6rem] text-ink-soft sm:block">/</kbd>
		</label>
	</form>

	<div class="ml-auto flex items-center gap-1.5 sm:gap-2">
		{#if profile.department}
			<a
				href="/notes?department={profile.department.id}"
				class="hidden md:inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-paper-card px-2.5 py-1 text-xs font-bold hover:bg-paper-deep transition"
				title="View {profile.department.name} Notes"
			>
				<span class="h-2 w-2 rounded-full border border-ink" style="background:{profile.department.color || '#FFD34D'}"></span>
				<span>{profile.department.short_name}</span>
			</a>
		{/if}

		<a href="/notes/new" class="btn btn-primary btn-sm hidden sm:inline-flex">
			<PenLine size={15} />
			Write
		</a>

		<details class="group relative">
			<summary
				class="btn btn-secondary btn-icon btn-sm relative list-none [&::-webkit-details-marker]:hidden"
				aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
				title="Notifications"
			>
				<Bell size={17} />
				{#if unread > 0}
					<span class="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-ink bg-[#E5484D] px-1 font-mono text-[0.55rem] font-bold text-white">
						{unread > 9 ? '9+' : unread}
					</span>
				{:else if activity.length}
					<span class="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#E5484D] ring-2 ring-white"></span>
				{/if}
			</summary>
			<div
				class="card absolute right-0 top-[calc(100%+10px)] z-50 w-[min(88vw,360px)] overflow-hidden shadow-[4px_4px_0_#211D31]"
			>
				<div class="flex items-center justify-between gap-2 border-b-2 border-ink bg-paper-deep px-3 py-2">
					<span class="kicker !text-[0.6rem]">Your updates</span>
					{#if unread > 0}
						<button type="button" class="link inline-flex items-center gap-1 text-[0.66rem]" onclick={markAllRead} disabled={markingRead}>
							<CheckCheck size={12} /> {markingRead ? 'Marking…' : 'Mark all read'}
						</button>
					{:else}
						<span class="font-mono text-[0.6rem] text-ink-soft">All caught up</span>
					{/if}
				</div>

				{#if notifications.length}
					<div>
						<p class="px-3 pt-2 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-ink-faint">On your notes</p>
						<ul class="divide-y divide-ink/10">
							{#each notifications.slice(0, 5) as item (item.id)}
								<li>
									<a href={item.note ? `/notes/${item.note.id}` : '/notes'} class="flex gap-2.5 px-3 py-2.5 hover:bg-paper-deep/70">
										<span
											class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink {item.kind === 'note_verified' ? 'bg-[#C9F2D9]' : 'bg-[#FFD9D3]'}"
										>
											<Bell size={13} />
										</span>
										<span class="min-w-0">
											<span class="block text-[0.78rem] font-semibold leading-snug">{notificationText(item)}</span>
											{#if item.note?.title}
												<span class="block truncate text-[0.7rem] text-ink-soft">{item.note.title}</span>
											{/if}
											<span class="mt-0.5 block text-[0.62rem] text-ink-faint">
												{item.actor?.full_name ? `${item.actor.full_name} · ` : ''}{relativeTime(item.created_at)}
											</span>
										</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if activity.length}
					<div class={notifications.length ? 'border-t-2 border-ink/10' : ''}>
						<p class="px-3 pt-2 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-ink-faint">Around the board</p>
						<ul class="divide-y divide-ink/10">
							{#each activity.slice(0, 4) as item (item.id)}
								<li>
									<a href={item.note ? `/notes/${item.note.id}` : '/notes'} class="flex gap-2.5 px-3 py-2.5 hover:bg-paper-deep/70">
										<Avatar name={item.actor?.full_name} color={item.actor?.avatar_color} size={28} />
										<span class="min-w-0">
											<span class="block text-[0.78rem] font-semibold leading-snug">{activityText(item)}</span>
											{#if item.note?.title}
												<span class="block truncate text-[0.7rem] text-ink-soft">{item.note.title}</span>
											{/if}
											<span class="mt-0.5 block text-[0.62rem] text-ink-faint">{relativeTime(item.created_at)}</span>
										</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if notifications.length === 0 && activity.length === 0}
					<p class="p-4 text-sm text-ink-soft">No activity yet. Be the first to share a note.</p>
				{/if}
			</div>
		</details>

		<details class="group relative">
			<summary class="list-none [&::-webkit-details-marker]:hidden" aria-label="Account menu">
				<span class="flex h-9 w-9 cursor-pointer items-center justify-center">
					<Avatar name={profile.full_name} color={profile.avatar_color} size={36} role={profile.role} />
				</span>
			</summary>
			<div class="card absolute right-0 top-[calc(100%+10px)] z-50 w-[min(88vw,248px)] overflow-hidden shadow-[4px_4px_0_#211D31]">
				<div class="border-b-2 border-ink bg-paper-deep px-3 py-2.5">
					<p class="truncate text-sm font-bold">{profile.full_name}</p>
					<p class="truncate text-[0.68rem] capitalize text-ink-soft">{profile.role}{#if profile.program} · {profile.program.code}{/if}</p>
				</div>
				<nav class="flex flex-col p-1.5">
					<a href="/profile" class="nav-link !min-h-9 !text-[0.78rem]"><UserRound size={15} /> Profile & settings</a>
					<a href="/collection" class="nav-link !min-h-9 !text-[0.78rem]"><BookMarked size={15} /> My Collection</a>
					{#if profile.role !== 'student'}
						<a href="/moderation" class="nav-link !min-h-9 !text-[0.78rem]"><ShieldCheck size={15} /> Review queue</a>
					{/if}
					{#if profile.role === 'admin'}
						<a href="/admin" class="nav-link !min-h-9 !text-[0.78rem]"><Settings size={15} /> Admin console</a>
					{/if}
				</nav>
				<form method="POST" action="/logout" class="border-t-2 border-ink p-1.5">
					<button type="submit" class="nav-link !min-h-9 w-full !text-[0.78rem]"><LogOut size={15} /> Sign out</button>
				</form>
			</div>
		</details>
	</div>
</header>
