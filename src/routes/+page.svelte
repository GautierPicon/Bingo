<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import { players, isHost } from './store';
	import githubImg from '$lib/assets/github.png';

	let containerRef = null;
	let titleRef = null;
	let cardsRef = [];

	onMount(() => {
		players.set([]);
		isHost.set(false);

		const tl = gsap.timeline();

		tl.fromTo(
			titleRef,
			{ opacity: 0, y: -20 },
			{ opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
		);

		tl.fromTo(
			cardsRef.filter(Boolean),
			{ opacity: 0, y: 30 },
			{
				opacity: 1,
				y: 0,
				duration: 0.5,
				stagger: 0.1,
				ease: 'power2.out'
			},
			'-=0.3'
		);
	});

	function createGame() {
		goto('/creation');
	}

	function joinGame() {
		goto('/rejoindre');
	}
</script>

<div
	bind:this={containerRef}
	class="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 font-sans text-slate-900"
>
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-indigo-50/50 blur-3xl"
		></div>
		<div
			class="absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full bg-orange-50/50 blur-3xl"
		></div>
	</div>

	<div class="relative z-10 w-full max-w-2xl text-center">
		<div bind:this={titleRef} class="mb-16">
			<h1 class="text-6xl font-black tracking-tighter text-slate-900 md:text-8xl">
				BINGO<span class="text-indigo-600">.</span>
			</h1>
			<p class="mt-4 text-lg font-medium text-slate-500">
				Faites de vos évènements un jeu grandeur nature
			</p>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<button
				bind:this={cardsRef[0]}
				onclick={createGame}
				class="group flex cursor-pointer flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-100 active:scale-[0.98]"
			>
				<div
					class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2.5"
						stroke="currentColor"
						class="size-8"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
				</div>
				<div class="text-center">
					<h2 class="text-xl font-bold">Créer un salon</h2>
					<p class="text-sm text-slate-500">Devenez l'hôte et gérez la partie</p>
				</div>
			</button>

			<button
				bind:this={cardsRef[1]}
				onclick={joinGame}
				class="group flex cursor-pointer flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-100 active:scale-[0.98]"
			>
				<div
					class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="size-8"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
						/>
					</svg>
				</div>
				<div class="text-center">
					<h2 class="text-xl font-bold">Rejoindre</h2>
					<p class="text-sm text-slate-500">Entrez un code et jouez</p>
				</div>
			</button>
		</div>
	</div>

	<a
		href="https://github.com/GautierPicon/Bingo"
		target="_blank"
		rel="noopener noreferrer"
		class="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-600 shadow-md transition-all hover:bg-slate-50 hover:shadow-lg md:right-auto md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:px-4 md:py-2"
	>
		<img src={githubImg} alt="GitHub" class="size-5" />
		<span class="hidden md:inline">Open Source</span>
	</a>
</div>
