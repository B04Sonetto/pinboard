<script lang="ts">
	import AppNavbar from '$lib/components/AppNavbar.svelte';
	import type { Activity, Department, Profile } from '$lib/types';

	let {
		data,
		children
	}: {
		data: {
			profile: Profile;
			departments: Department[];
			counts: { saved: number; contributions: number; attempts: number; moderation: number };
			recentActivity: Activity[];
			notifications: Activity[];
			unreadNotifications: number;
		};
		children: import('svelte').Snippet;
	} = $props();
</script>

<a
	href="#main"
	class="sr-only z-[200] rounded-lg border-[2.5px] border-ink bg-marigold px-4 py-2 text-sm font-bold focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
>
	Skip to content
</a>

<div class="flex min-h-dvh flex-col">
	<AppNavbar
		profile={data.profile}
		counts={data.counts}
		activity={data.recentActivity}
		notifications={data.notifications}
		unread={data.unreadNotifications}
	/>

	<main id="main" class="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-14 pt-8 sm:px-6 lg:px-10">
		{@render children()}
	</main>

	<footer class="mx-auto w-full max-w-[1280px] px-4 pb-8 sm:px-6 lg:px-10">
		<p class="max-w-[720px] text-[0.8125rem] leading-relaxed text-ink-soft">
			Pinboard is an independent community platform. Courses, lessons and notes are submitted by students and
			are not official university curriculum.
		</p>
	</footer>
</div>
