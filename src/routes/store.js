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

function safeSessionStorage() {
	if (typeof window === 'undefined') {
		return {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {}
		};
	}
	return window.sessionStorage;
}

function createLocalStore(key, initialValue) {
	const storage = safeLocalStorage();
	const storedValue = storage.getItem(key);

	const store = writable(storedValue ? JSON.parse(storedValue) : initialValue);

	store.subscribe((value) => {
		storage.setItem(key, JSON.stringify(value));
	});

	return store;
}

function createSessionStore(key, initialValue) {
	const storage = safeSessionStorage();
	const storedValue = storage.getItem(key);

	const store = writable(storedValue ? JSON.parse(storedValue) : initialValue);

	store.subscribe((value) => {
		storage.setItem(key, JSON.stringify(value));
	});

	return store;
}

export const useStar = createLocalStore('useStar', false);
export const hasPlayedGridAnimation = createSessionStore('hasPlayedGridAnimation', false);
export const isHost = createLocalStore('isHost', false);
export const gameCode = writable('');
export const players = writable([]);
