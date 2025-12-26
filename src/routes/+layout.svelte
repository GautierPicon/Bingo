<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<nav class="flex justify-center gap-4 border-b border-gray-300 p-4">
	<a href="/" class:font-bold={$page.url.pathname === '/'}>Jeu</a>
	<a href="/parametres" class:font-bold={$page.url.pathname === '/parametres'}>Paramètres</a>
</nav>

{@render children()}
