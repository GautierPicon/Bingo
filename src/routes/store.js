import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createPersistentStore(key, initialValue, storage = 'localStorage') {
	const store = writable(initialValue);

	if (browser) {
		const storageType = storage === 'sessionStorage' ? sessionStorage : localStorage;
		const storedValue = storageType.getItem(key);

		if (storedValue !== null) {
			try {
				store.set(storedValue === 'true' ? true : storedValue === 'false' ? false : storedValue);
			} catch (e) {
				console.error(`Error loading ${key} from storage:`, e);
			}
		}

		store.subscribe((value) => {
			try {
				storageType.setItem(key, String(value));
			} catch (e) {
				console.error(`Error saving ${key} to storage:`, e);
			}
		});
	}

	return store;
}

export const useStar = createPersistentStore('useStar', false);
export const hasPlayedGridAnimation = createPersistentStore(
	'hasPlayedGridAnimation',
	false,
	'sessionStorage'
);
export const isHost = createPersistentStore('isHost', false);

export const gameCode = writable('');
export const players = writable([]);
