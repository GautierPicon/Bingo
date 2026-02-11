<script>
	import { goto } from '$app/navigation';

	function goHome() {
		goto('/');
	}
</script>

<button
	onclick={goHome}
	class="group absolute top-6 left-6 flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md active:scale-95"
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
