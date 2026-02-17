import { writable } from 'svelte/store';

function safeLocalStorage() {
	if (typeof window === 'undefined') {
		return {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {}
		};
	}
	return window.localStorage;
}

function createThemeStore() {
	const storage = safeLocalStorage();
	const storedTheme = storage.getItem('theme');
	const store = writable(storedTheme || 'system');

	function getSystemTheme() {
		if (typeof window === 'undefined') return 'light';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	function applyTheme(theme) {
		const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
		if (typeof document !== 'undefined') {
			document.documentElement.classList.remove('light', 'dark');
			document.documentElement.classList.add(effectiveTheme);
		}
	}

	function setTheme(theme) {
		store.set(theme);
		storage.setItem('theme', theme);
		applyTheme(theme);
	}

	function cycleTheme() {
		store.update((current) => {
			let next;
			if (current === 'light') next = 'dark';
			else if (current === 'dark') next = 'system';
			else next = 'light';
			setTheme(next);
			return next;
		});
	}

	function init() {
		store.subscribe((theme) => {
			applyTheme(theme);
		});

		if (typeof window !== 'undefined') {
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
				store.subscribe((theme) => {
					if (theme === 'system') {
						applyTheme('system');
					}
				})();
			});
		}
	}

	return {
		subscribe: store.subscribe,
		setTheme,
		cycleTheme,
		init
	};
}

export const theme = createThemeStore();
