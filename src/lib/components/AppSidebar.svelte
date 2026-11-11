<script lang="ts">
	import type { Component } from 'svelte';
	import { page } from '$app/state';
	import {
		BookMarked,
		BookOpen,
		Compass,
		GraduationCap,
		LayoutDashboard,
		Lightbulb,
		LogOut,
		PenLine,
		ShieldCheck,
		Sparkles,
		StickyNote,
		UserRound
	} from '@lucide/svelte';
	import Logo from './Logo.svelte';
	import Avatar from './Avatar.svelte';
	import type { Profile } from '$lib/types';
	import { firstName } from '$lib/utils';

	let {
		profile,
		counts = { saved: 0, contributions: 0, moderation: 0 },
		open = $bindable(false)
	}: {
		profile: Profile;
		counts?: { saved: number; contributions: number; moderation: number };
		open?: boolean;
	} = $props();

	interface NavItem {
		href: string;
		label: string;
		icon: Component;
		badge?: number;
	}
	interface NavGroup {
		label: string;
		items: NavItem[];
	}

	const groups = $derived.by<NavGroup[]>(() => {
		const groups: NavGroup[] = [
			{
				label: 'Study',
				items: [
					{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
					{ href: '/notes', label: 'Community Notes', icon: StickyNote },
					{ href: '/topics', label: 'Explore Topics', icon: Compass },
					{ href: '/courses', label: 'Courses & Lessons', icon: BookOpen },
					{ href: '/study', label: 'AI Study Assistant', icon: Sparkles }
				]
			},
			{
				label: 'Your library',
				items: [
					{ href: '/collection', label: 'My Collection', icon: BookMarked, badge: counts.saved },
					{ href: '/suggestions', label: 'Suggestions', icon: Lightbulb }
				]
			}
		];

		if (profile.role === 'moderator' || profile.role === 'admin') {
			groups.push({
				label: 'Moderation',
				items: [
					{
						href: '/moderation',
						label: 'Review Queue',
						icon: ShieldCheck,
						badge: counts.moderation
					}
				]
			});
		}

		if (profile.role === 'admin') {
			groups.push({
				label: 'Administration',
				items: [{ href: '/admin', label: 'Admin Console', icon: UserRound }]
			});
		}

		return groups;
	});

	function active(href: string) {
		return href === '/dashboard' ? page.url.pathname === href : page.url.pathname.startsWith(href);
	}
</script>

{#if open}
	<button
		type="button"
		class="fixed inset-0 z-[65] bg-ink/35 backdrop-blur-[1px] lg:hidden"
		aria-label="Close navigation"
		onclick={() => (open = false)}
	></button>
{/if}

<aside
	class="fixed inset-y-0 left-0 z-[70] flex w-[282px] shrink-0 flex-col border-r-2 border-ink bg-paper-card transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-dvh lg:w-[264px] lg:translate-x-0 {open
		? 'translate-x-0'
		: '-translate-x-full'}"
	aria-label="Sidebar"
>
	<div class="flex min-h-16 items-center justify-between border-b-2 border-ink px-4 py-3">
		<Logo size={28} />
		<button
			type="button"
			class="btn btn-ghost btn-icon btn-sm lg:hidden"
			aria-label="Close navigation"
			onclick={() => (open = false)}
		>
			<span class="text-lg leading-none">×</span>
		</button>
	</div>

	<div class="scroll-thin flex-1 overflow-y-auto px-3 py-4">
		<a href="/notes/new" class="btn btn-primary mb-5 w-full !justify-start" onclick={() => (open = false)}>
			<PenLine size={17} />
			Write a note
		</a>

		<nav class="flex flex-col gap-5" aria-label="Main navigation">
			{#each groups as group (group.label)}
				<div class="flex flex-col gap-1">
					<p class="px-2 pb-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-faint">
						{group.label}
					</p>
					{#each group.items as item (item.href)}
						<a
							href={item.href}
							class="nav-link"
							aria-current={active(item.href) ? 'page' : undefined}
							onclick={() => (open = false)}
						>
							<item.icon size={17} strokeWidth={2.1} />
							<span class="flex-1">{item.label}</span>
							{#if item.badge}
								<span
									class="min-w-5 rounded border-[1.5px] border-ink px-1 text-center font-mono text-[0.6rem] font-bold leading-4"
									style="background:{active(item.href) ? '#FFFDF7' : '#FFE680'}"
								>
									{item.badge}
								</span>
							{/if}
						</a>
					{/each}
				</div>
			{/each}
		</nav>

		<div class="mt-6 rounded-xl border-2 border-ink bg-[#F3EDDD] p-3">
			<div class="flex items-center gap-2">
				<GraduationCap size={16} />
				<p class="font-display text-[0.92rem] font-extrabold leading-tight">Community-built curriculum</p>
			</div>
			<p class="mt-1 text-[0.7rem] leading-relaxed text-ink-soft">
				Courses and notes come from students, not the university. Check the label before you rely on it.
			</p>
		</div>
	</div>

	<div class="border-t-2 border-ink p-3">
		<div class="flex items-center gap-2">
			<a
				href="/profile"
				class="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-paper-deep"
				onclick={() => (open = false)}
			>
				<Avatar name={profile.full_name} color={profile.avatar_color} size={34} role={profile.role} />
				<div class="min-w-0">
					<p class="truncate text-[0.8rem] font-bold leading-tight">{firstName(profile.full_name)}</p>
					<p class="truncate text-[0.64rem] capitalize text-ink-soft">
						{profile.role}{#if profile.department} · {profile.department.short_name}{/if}
					</p>
				</div>
			</a>
			<form method="POST" action="/logout">
				<button type="submit" class="btn btn-ghost btn-icon btn-sm" aria-label="Sign out" title="Sign out">
					<LogOut size={16} />
				</button>
			</form>
		</div>
	</div>
</aside>
