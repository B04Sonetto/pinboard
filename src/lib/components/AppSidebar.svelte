<script lang="ts">
	import type { Component } from 'svelte';
	import { page } from '$app/state';
	import {
		BookMarked,
		BookOpen,
		Building2,
		Compass,
		GraduationCap,
		LayoutDashboard,
		Lightbulb,
		LogOut,
		PenLine,
		Plus,
		Search,
		ShieldCheck,
		Sparkles,
		StickyNote,
		UserRound,
		X
	} from '@lucide/svelte';
	import Logo from './Logo.svelte';
	import Avatar from './Avatar.svelte';
	import type { Department, Profile } from '$lib/types';
	import { firstName } from '$lib/utils';

	let {
		profile,
		departments = [],
		counts = { saved: 0, contributions: 0, moderation: 0 },
		open = $bindable(false)
	}: {
		profile: Profile;
		departments?: Department[];
		counts?: { saved: number; contributions: number; moderation: number };
		open?: boolean;
	} = $props();

	let showDeptModal = $state(false);
	let deptSearch = $state('');
	let pinnedDeptIds = $state<string[]>([]);

	// Load pinned departments from localStorage on mount
	$effect(() => {
		try {
			const saved = localStorage.getItem('pinboard_pinned_depts');
			if (saved) {
				const parsed: unknown = JSON.parse(saved);
				if (Array.isArray(parsed)) {
					pinnedDeptIds = parsed.filter((id): id is string => typeof id === 'string');
				}
			}
		} catch {
			// ignore storage errors
		}
	});

	function togglePinDept(deptId: string, event?: Event) {
		event?.stopPropagation();
		event?.preventDefault();
		if (pinnedDeptIds.includes(deptId)) {
			pinnedDeptIds = pinnedDeptIds.filter((id) => id !== deptId);
		} else {
			pinnedDeptIds = [...pinnedDeptIds, deptId];
		}
		try {
			localStorage.setItem('pinboard_pinned_depts', JSON.stringify(pinnedDeptIds));
		} catch {
			// ignore
		}
	}

	const pinnedDepartments = $derived(
		departments.filter(
			(d) => pinnedDeptIds.includes(d.id) && d.id !== profile.department_id
		)
	);

	const modalFilteredDepts = $derived(
		departments.filter((d) => {
			if (!deptSearch.trim()) return true;
			const q = deptSearch.toLowerCase();
			return (
				d.name.toLowerCase().includes(q) ||
				d.short_name.toLowerCase().includes(q) ||
				(d.description?.toLowerCase().includes(q) ?? false)
			);
		})
	);

	interface NavItem {
		href: string;
		label: string;
		icon: Component;
		badge?: number;
		chip?: string;
	}
	interface NavGroup {
		label: string;
		items: NavItem[];
	}

	const academicGroups = $derived.by<NavGroup[]>(() => {
		const groups: NavGroup[] = [
			{
				label: 'Academics',
				items: [
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

	function isCommunityNotesActive(): boolean {
		if (page.url.pathname !== '/notes') return false;
		const dept = page.url.searchParams.get('department');
		return !dept;
	}

	function isDeptNotesActive(deptId: string): boolean {
		if (page.url.pathname !== '/notes') return false;
		return page.url.searchParams.get('department') === deptId;
	}

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
			<!-- Main overview & Community -->
			<div class="flex flex-col gap-1">
				<p class="px-2 pb-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-faint">
					Study
				</p>
				<a
					href="/dashboard"
					class="nav-link"
					aria-current={active('/dashboard') ? 'page' : undefined}
					onclick={() => (open = false)}
				>
					<LayoutDashboard size={17} strokeWidth={2.1} />
					<span class="flex-1">Dashboard</span>
				</a>

				<a
					href="/notes"
					class="nav-link"
					aria-current={isCommunityNotesActive() ? 'page' : undefined}
					onclick={() => (open = false)}
				>
					<StickyNote size={17} strokeWidth={2.1} />
					<span class="flex-1">Community Notes</span>
					<span class="chip chip-soft !min-h-5 !px-1.5 !text-[0.58rem]">All</span>
				</a>
			</div>

			<!-- Department Navigation (Based on Enrollment + Option to view other depts with + button) -->
			<div class="flex flex-col gap-1">
				<div class="flex items-center justify-between px-2 pb-1">
					<p class="font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-faint">
						Department
					</p>
					<button
						type="button"
						class="btn btn-ghost btn-icon !h-5 !w-5 rounded text-ink-soft hover:bg-paper-deep hover:text-ink"
						title="Browse other departments (+ sign button)"
						aria-label="Add or view other department notes"
						onclick={() => (showDeptModal = true)}
					>
						<Plus size={13} strokeWidth={2.6} />
					</button>
				</div>

				{#if profile.department}
					<a
						href="/notes?department={profile.department.id}"
						class="nav-link group relative"
						aria-current={isDeptNotesActive(profile.department.id) ? 'page' : undefined}
						onclick={() => (open = false)}
						title="Your enrolled department: {profile.department.name}"
					>
						<span
							class="h-2.5 w-2.5 shrink-0 rounded-full border border-ink"
							style="background: {profile.department.color || '#FFD34D'}"
						></span>
						<span class="flex-1 truncate font-bold">{profile.department.short_name} Notes</span>
						<span
							class="rounded border border-ink/40 bg-marigold-soft px-1 font-mono text-[0.55rem] font-bold uppercase tracking-tight text-ink"
						>
							Enrolled
						</span>
					</a>
				{:else}
					<a
						href="/profile"
						class="flex items-center gap-2 rounded-lg border border-dashed border-ink/40 bg-paper-deep/60 px-2.5 py-2 text-[0.72rem] text-ink-soft transition hover:border-ink hover:text-ink"
						onclick={() => (open = false)}
					>
						<GraduationCap size={15} class="shrink-0 text-ink" />
						<span class="flex-1 font-semibold leading-tight">Enroll in your department</span>
						<span class="text-ink font-bold">→</span>
					</a>
				{/if}

				<!-- Pinned Other Departments (User Optional) -->
				{#each pinnedDepartments as dept (dept.id)}
					<div class="group relative flex items-center">
						<a
							href="/notes?department={dept.id}"
							class="nav-link flex-1 !pr-7"
							aria-current={isDeptNotesActive(dept.id) ? 'page' : undefined}
							onclick={() => (open = false)}
							title="Other department: {dept.name}"
						>
							<span
								class="h-2 w-2 shrink-0 rounded-full border border-ink"
								style="background: {dept.color || '#FFD34D'}"
							></span>
							<span class="truncate text-[0.76rem]">{dept.short_name} Notes</span>
						</a>
						<button
							type="button"
							class="btn btn-ghost btn-icon absolute right-1 !h-6 !w-6 text-ink-soft opacity-0 transition group-hover:opacity-100 hover:text-ink"
							title="Unpin {dept.short_name} from sidebar"
							aria-label="Unpin {dept.short_name}"
							onclick={(e) => togglePinDept(dept.id, e)}
						>
							<X size={12} />
						</button>
					</div>
				{/each}

				<!-- Optional Quick Action: View other department notes -->
				<button
					type="button"
					class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[0.72rem] font-semibold text-ink-soft transition hover:bg-paper-deep hover:text-ink"
					onclick={() => (showDeptModal = true)}
				>
					<span class="flex h-4 w-4 items-center justify-center rounded border border-ink/30 bg-paper text-ink">
						<Plus size={11} strokeWidth={2.5} />
					</span>
					<span>View other departments…</span>
				</button>
			</div>

			<!-- Academics & Library Groups -->
			{#each academicGroups as group (group.label)}
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
				<p class="font-display text-[0.92rem] font-extrabold leading-tight">Community curriculum</p>
			</div>
			<p class="mt-1 text-[0.7rem] leading-relaxed text-ink-soft">
				Maintained by students. Check whether notes are community submitted or verified before using.
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

<!-- Modal: Browse & Pin Other Departments (User Optional) -->
{#if showDeptModal}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		aria-labelledby="dept-modal-title"
	>
		<div class="card max-h-[85vh] w-full max-w-lg overflow-hidden bg-paper-card shadow-2xl flex flex-col">
			<div class="flex items-center justify-between border-b-2 border-ink bg-paper p-4">
				<div class="flex items-center gap-2">
					<Building2 size={18} class="text-ink" />
					<h3 id="dept-modal-title" class="font-display text-base font-extrabold">Browse University Departments</h3>
				</div>
				<button
					type="button"
					class="btn btn-ghost btn-icon btn-sm"
					aria-label="Close dialog"
					onclick={() => (showDeptModal = false)}
				>
					<X size={16} />
				</button>
			</div>

			<div class="border-b-2 border-ink bg-paper-card p-3">
				<label class="relative flex items-center">
					<Search size={15} class="absolute left-3 text-ink-soft" />
					<input
						type="search"
						bind:value={deptSearch}
						placeholder="Search departments (e.g. Computer Studies, Engineering, Nursing)…"
						class="input !pl-9 !text-xs w-full"
					/>
				</label>
			</div>

			<div class="scroll-thin flex-1 overflow-y-auto p-3 flex flex-col gap-2">
				{#if modalFilteredDepts.length === 0}
					<p class="p-4 text-center text-xs text-ink-soft">No departments match your search.</p>
				{:else}
					{#each modalFilteredDepts as dept (dept.id)}
						{@const isEnrolled = dept.id === profile.department_id}
						{@const isPinned = pinnedDeptIds.includes(dept.id)}
						<div
							class="flex items-center justify-between gap-3 rounded-xl border-2 border-ink p-3 transition hover:bg-paper-deep/60"
							style="border-left-width: 6px; border-left-color: {dept.color || '#FFD34D'}"
						>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<h4 class="font-display text-sm font-bold truncate">{dept.name}</h4>
									<span class="chip chip-soft !min-h-5 !text-[0.62rem]">{dept.short_name}</span>
									{#if isEnrolled}
										<span class="rounded bg-marigold-soft px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-tight text-ink border border-ink/40">
											Your Department
										</span>
									{/if}
								</div>
								{#if dept.description}
									<p class="mt-0.5 line-clamp-1 text-[0.7rem] text-ink-soft">{dept.description}</p>
								{/if}
							</div>

							<div class="flex items-center gap-1.5 shrink-0">
								{#if !isEnrolled}
									<button
										type="button"
										class="btn btn-secondary btn-sm !px-2.5 !py-1 !text-xs"
										title={isPinned ? 'Remove from sidebar' : 'Pin to sidebar for quick access'}
										onclick={() => togglePinDept(dept.id)}
									>
										{isPinned ? '★ Pinned' : '☆ Pin'}
									</button>
								{/if}
								<a
									href="/notes?department={dept.id}"
									class="btn btn-ink btn-sm !px-2.5 !py-1 !text-xs"
									onclick={() => {
										showDeptModal = false;
										open = false;
									}}
								>
									View Notes →
								</a>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="flex items-center justify-between border-t-2 border-ink bg-paper p-3 text-[0.7rem] text-ink-soft">
				<span>Students can browse any department's community-shared notes.</span>
				<button type="button" class="btn btn-secondary btn-sm" onclick={() => (showDeptModal = false)}>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
