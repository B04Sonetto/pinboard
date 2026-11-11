export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
	id: number;
	message: string;
	tone: ToastTone;
}

class ToastStore {
	items = $state<ToastItem[]>([]);
	#next = 1;

	push(message: string, tone: ToastTone = 'info', timeout = 4200) {
		if (typeof document === 'undefined') return;
		const id = this.#next++;
		this.items = [...this.items, { id, message, tone }];
		setTimeout(() => this.dismiss(id), timeout);
	}

	success(message: string) {
		this.push(message, 'success');
	}

	error(message: string) {
		this.push(message, 'error', 6000);
	}

	info(message: string) {
		this.push(message, 'info');
	}

	dismiss(id: number) {
		this.items = this.items.filter((item) => item.id !== id);
	}
}

export const toast = new ToastStore();
