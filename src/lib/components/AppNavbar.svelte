<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { BookMarked, LogOut, Menu, PenLine, Search, Settings, ShieldCheck, UserRound, X } from '@lucide/svelte';
	import Logo from './Logo.svelte';
	import Avatar from './Avatar.svelte';
	import NotificationsMenu from './NotificationsMenu.svelte';
	import { dismissable } from '$lib/actions';
	import type { Activity, Profile } from '$lib/types';

	let {
		profile,
		counts,
		activity = [],
		notifications = [],
		unread = 0
	}: {
		profile: Profile;
		counts: { saved: number; moderation: number };
		activity?: Activity[];
		notifications?: Activity[];
		unread?: number;
	} = $props();

	const links = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/notes', label: 'Community Notes' },
		{ href: '/topics', label: 'Explore Topics' },
		{ href: '/courses', label: 'Courses' },
		{ href: '/study', label: 'AI Study' },
		{ href: '/suggestions', label: 'Suggestions' }
	];

	let menuOpen = $state(false);

	afterNavigate(() => {
		menuOpen = false;
	});

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		if (href === '/notes') return path.startsWith('/notes') && !path.startsWith('/notes/new');
		return path === href || path.startsWith(`${href}/`);
	}

	// Searching from a department board keeps you on that board.
	const searchDepartment = $derived(
		page.url.pathname === '/notes' ? (page.url.searchParams.get('department') ?? '') : ''
	);
	const searchValue = $derived(page.url.pathname === '/notes' ? (page.url.searchParams.get('q') ?? '') : '');
	const isStaff = $derived(profile.role === 'moderator' || profile.role === 'admin');

	// "/" focuses the search box, like most knowledge sites.
	$effect(() => {
		function onKey(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			if (event.key !== '/' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '') || target?.isContentEditable) {
				return;
			}
			// Whichever search box is actually on screen (desktop bar or mobile menu).
			const visible = ['nav-search', 'mobile-search']
				.map((id) => document.getElementById(id) as HTMLInputElement | null)
				.find((input) => input && input.offsetParent !== null);
			if (visible) {
				event.preventDefault();
				visible.focus();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

{#snippet searchBox(id: string, widthClass: string)}
	<form action="/notes" method="get" role="search" class={widthClass}>
		{#if searchDepartment}<input type="hidden" name="department" value={searchDepartment} />{/if}
		<label
			class="flex min-h-11 items-center gap-2 rounded-lg border-[2.5px] border-ink bg-white px-3 focus-within:shadow-[0_0_0_4px_rgba(255,216,77,0.6)]"
		>
			<Search size={16} strokeWidth={2.4} class="shrink-0" aria-hidden="true" />
			<input
				{id}
				type="search"
				name="q"
				value={searchValue}
				placeholder="Search notes"
				aria-label="Search notes by keyword or topic"
				class="min-w-0 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-ink-faint"
			/>
		</label>
	</form>
{/snippet}

<header class="topnav sticky top-0 z-40 border-b-[3px] border-ink bg-paper-card">
	<div class="mx-auto flex min-h-[72px] max-w-[1360px] items-center gap-x-6 px-4 py-2 sm:px-6 lg:px-10">
		<Logo size={30} />

		<nav aria-label="Main" class="hidden flex-1 flex-wrap items-center gap-x-[18px] xl:flex">
			{#each links as link (link.href)}
				<a href={link.href} class="topnav-link" aria-current={isActive(link.href) ? 'page' : undefined}>
					<span>{link.label}</span>
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-2.5 sm:gap-3">
			{@render searchBox('nav-search', 'hidden w-[190px] xl:block')}

			<a
				href="/collection"
				class="relative hidden h-11 w-11 items-center justify-center rounded-lg border-[2.5px] border-ink bg-white transition hover:bg-paper-deep sm:flex"
				aria-label={counts.saved ? `My Collection, ${counts.saved} saved` : 'My Collection'}
				title="My Collection"
			>
				<BookMarked size={18} strokeWidth={2.2} />
				{#if counts.saved}
					<span class="count absolute -right-2 -top-2 !text-[0.65rem]" aria-hidden="true">{counts.saved}</span>
				{/if}
			</a>

			<NotificationsMenu {activity} {notifications} {unread} />

			<details class="relative" use:dismissable>
				<summary
					class="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg [&::-webkit-details-marker]:hidden"
					aria-label="Account menu"
				>
					<Avatar name={profile.full_name} color={profile.avatar_color || '#BDEBCB'} size={44} role={profile.role} />
				</summary>
				<div class="menu-panel absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,264px)] overflow-hidden">
					<div class="border-b-[3px] border-ink bg-paper-deep px-3 py-3">
						<p class="truncate text-sm font-bold">{profile.full_name}</p>
						<p class="truncate text-xs capitalize text-ink-soft">
							{profile.role}{#if profile.program} · {profile.program.code}{:else if profile.department} · {profile.department.short_name}{/if}
						</p>
					</div>
					<nav class="flex flex-col p-1.5" aria-label="Account">
						<a href="/profile" class="nav-link"><UserRound size={16} /> Profile &amp; settings</a>
						<a href="/collection" class="nav-link">
							<BookMarked size={16} />
							<span class="flex-1">My Collection</span>
							{#if counts.saved}<span class="count">{counts.saved}</span>{/if}
						</a>
						{#if isStaff}
							<a href="/moderation" class="nav-link">
								<ShieldCheck size={16} />
								<span class="flex-1">Review queue</span>
								{#if counts.moderation}<span class="count">{counts.moderation}</span>{/if}
							</a>
						{/if}
						{#if profile.role === 'admin'}
							<a href="/admin" class="nav-link"><Settings size={16} /> Admin console</a>
						{/if}
					</nav>
					<form method="POST" action="/logout" class="border-t-[3px] border-ink p-1.5">
						<button type="submit" class="nav-link w-full"><LogOut size={16} /> Sign out</button>
					</form>
				</div>
			</details>

			<a href="/notes/new" class="btn btn-primary hidden sm:inline-flex">
				<PenLine size={15} strokeWidth={2.6} aria-hidden="true" />
				Write a note
			</a>

			<button
				type="button"
				class="btn btn-secondary btn-icon xl:hidden"
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={menuOpen}
				aria-controls="mobile-menu"
				onclick={() => (menuOpen = !menuOpen)}
			>
				{#if menuOpen}<X size={20} />{:else}<Menu size={20} />{/if}
			</button>
		</div>
	</div>

	{#if menuOpen}
		<div id="mobile-menu" class="border-t-[3px] border-ink bg-paper-card px-4 pb-5 pt-3 sm:px-6 xl:hidden">
			{@render searchBox('mobile-search', 'mb-3')}
			<nav aria-label="Main" class="flex flex-col">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="flex min-h-12 items-center border-b-2 border-dashed border-ink/15 text-base"
						class:font-bold={isActive(link.href)}
						class:font-medium={!isActive(link.href)}
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						<span
							class="px-0.5"
							style={isActive(link.href)
								? 'background:linear-gradient(transparent 58%,#ffd84d 58%,#ffd84d 92%,transparent 92%)'
								: ''}
						>
							{link.label}
						</span>
					</a>
				{/each}
			</nav>
			<div class="mt-4 flex flex-wrap gap-2">
				<a href="/notes/new" class="btn btn-primary flex-1"><PenLine size={15} strokeWidth={2.6} /> Write a note</a>
				<a href="/collection" class="btn btn-secondary flex-1"><BookMarked size={15} /> My Collection</a>
			</div>
		</div>
	{/if}
</header>
