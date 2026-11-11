import type { Action } from 'svelte/action';

/**
 * Makes a <details> dropdown behave like a real menu: it closes when you click
 * outside it, press Escape (focus returns to the summary), or follow a link
 * inside it.
 */
export const dismissable: Action<HTMLDetailsElement> = (node) => {
	function onPointerDown(event: PointerEvent) {
		if (node.open && !node.contains(event.target as Node)) node.open = false;
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && node.open) {
			node.open = false;
			node.querySelector('summary')?.focus();
		}
	}

	function onClick(event: MouseEvent) {
		if ((event.target as HTMLElement | null)?.closest('a[href]')) node.open = false;
	}

	document.addEventListener('pointerdown', onPointerDown);
	document.addEventListener('keydown', onKeyDown);
	node.addEventListener('click', onClick);

	return {
		destroy() {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
			node.removeEventListener('click', onClick);
		}
	};
};
