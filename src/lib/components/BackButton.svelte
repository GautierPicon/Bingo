<script>
	import { goto } from '$app/navigation';

	function goHome() {
		goto('/');
	}
</script>

<button
	onclick={goHome}
	class="absolute top-4 left-4 flex cursor-pointer items-center gap-2 rounded-2xl border-4 border-white bg-white/20 px-4 py-2 font-bold text-white shadow-lg backdrop-blur-sm hover:bg-white/30"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="3"
		stroke="currentColor"
		class="size-5"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
	</svg>
	<span>Accueil</span>
</button>
