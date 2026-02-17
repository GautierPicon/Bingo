<script>
	import './layout.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { theme } from '$lib/stores/theme';
	import Header from '$lib/components/Header.svelte';
	import { onMount } from 'svelte';

	injectAnalytics();

	let { children } = $props();

	onMount(() => {
		theme.init();
	});
</script>

<Header />
{@render children()}
