<script lang="ts">
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import AppTopbar from '$lib/components/AppTopbar.svelte';
	import MobileNav from '$lib/components/MobileNav.svelte';
	import type { Activity, Profile } from '$lib/types';

	let {
		data,
		children
	}: {
		data: {
			profile: Profile;
			counts: { saved: number; contributions: number; attempts: number; moderation: number };
			recentActivity: Activity[];
			notifications: Activity[];
			unreadNotifications: number;
		};
		children: import('svelte').Snippet;
	} = $props();

	let mobileOpen = $state(false);
</script>

<div class="flex min-h-dvh">
	<AppSidebar profile={data.profile} counts={data.counts} bind:open={mobileOpen} />

	<div class="flex min-h-dvh min-w-0 flex-1 flex-col">
		<AppTopbar
			profile={data.profile}
			activity={data.recentActivity}
			notifications={data.notifications}
			unread={data.unreadNotifications}
			onMenu={() => (mobileOpen = true)}
		/>

		<main class="mx-auto w-full max-w-[1460px] flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-10">
			{@render children()}
		</main>

		<footer class="mx-auto w-full max-w-[1460px] px-4 pb-24 sm:px-6 lg:px-8 lg:pb-6">
			<div class="flex flex-col gap-2 border-t-2 border-dashed border-ink/20 pt-4 text-[0.68rem] leading-relaxed text-ink-soft sm:flex-row sm:items-center sm:justify-between">
				<p class="max-w-2xl">
					Pinboard is an independent, community-driven academic platform. Courses, lessons and notes are
					submitted by students and are not official university curriculum.
				</p>
				<p class="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-faint">Built by students, for students</p>
			</div>
		</footer>
	</div>

	<MobileNav onMore={() => (mobileOpen = true)} />
</div>
