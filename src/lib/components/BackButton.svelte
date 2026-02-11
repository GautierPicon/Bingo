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
	← Accueil
</button>
