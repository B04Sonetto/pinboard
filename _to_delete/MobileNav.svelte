<script lang="ts">
	import { page } from '$app/state';
	import { LayoutDashboard, StickyNote, Sparkles, BookMarked, Menu } from '@lucide/svelte';

	let { onMore }: { onMore: () => void } = $props();

	const items = [
		{ href: '/dashboard', label: 'Home', icon: LayoutDashboard },
		{ href: '/notes', label: 'Notes', icon: StickyNote },
		{ href: '/study', label: 'Study', icon: Sparkles },
		{ href: '/collection', label: 'Library', icon: BookMarked }
	];

	function active(href: string) {
		return href === '/dashboard' ? page.url.pathname === href : page.url.pathname.startsWith(href);
	}
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-50 flex items-stretch border-t-2 border-ink bg-paper-card pb-[env(safe-area-inset-bottom)] lg:hidden"
	aria-label="Mobile navigation"
>
	{#each items as item (item.href)}
		<a
			href={item.href}
			class="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6rem] font-bold {active(item.href)
				? 'bg-marigold text-ink'
				: 'text-ink-soft'}"
			aria-current={active(item.href) ? 'page' : undefined}
		>
			<item.icon size={18} strokeWidth={2.2} />
			{item.label}
		</a>
	{/each}
	<button
		type="button"
		class="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6rem] font-bold text-ink-soft"
		onclick={onMore}
	>
		<Menu size={18} strokeWidth={2.2} />
		More
	</button>
</nav>
