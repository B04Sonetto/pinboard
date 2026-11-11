<script lang="ts">
	import { renderMarkdown } from '$lib/markdown';

	let { content, class: className = '' }: { content: string | null | undefined; class?: string } = $props();
</script>

<div class="prose-pinboard {className}">
	{@html renderMarkdown(content)}
</div>

<style>
	:global(.prose-pinboard .task-list) {
		list-style: none;
		padding-left: 0;
	}
	:global(.prose-pinboard .task) {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}
	:global(.prose-pinboard .task-box) {
		display: inline-flex;
		flex: 0 0 18px;
		width: 18px;
		height: 18px;
		margin-top: 0.3rem;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--color-ink);
		border-radius: 3px;
		background: #fff;
		font-size: 0.7rem;
		font-weight: 700;
	}
	:global(.prose-pinboard .task.is-done .task-box) {
		background: var(--color-marigold);
	}
	:global(.prose-pinboard pre::before) {
		content: attr(data-lang);
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #c9c3da;
	}
</style>
