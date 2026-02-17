<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import gsap from 'gsap';
	import { players, isHost } from './store';

	let containerRef = null;
	let titleRef = null;
	let cardsRef = [];
	let isDark = false;

	onMount(() => {
		players.set([]);
		isHost.set(false);

		const updateTheme = () => {
			isDark = document.documentElement.classList.contains('dark');
		};

		updateTheme();

		const observer = new MutationObserver(updateTheme);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

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

		return () => observer.disconnect();
	});

	function createGame() {
		goto(resolve('/creation'));
	}

	function joinGame() {
		goto(resolve('/rejoindre'));
	}
</script>

<div
	bind:this={containerRef}
	class="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100"
>
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-indigo-50/50 blur-3xl dark:bg-indigo-900/20"
		></div>
		<div
			class="absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full bg-orange-50/50 blur-3xl dark:bg-orange-900/20"
		></div>
	</div>

	<div class="relative z-10 w-full max-w-2xl text-center">
		<div bind:this={titleRef} class="mb-16">
			<h1
				class="text-6xl font-black tracking-tighter text-slate-900 md:text-8xl dark:text-slate-100"
			>
				BINGO<span class="text-indigo-600">.</span>
			</h1>
			<p class="mt-4 text-lg font-medium text-slate-500 dark:text-slate-400">
				Faites de vos évènements un jeu grandeur nature
			</p>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<button
				bind:this={cardsRef[0]}
				onclick={createGame}
				class="group flex cursor-pointer flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-100 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500 dark:hover:shadow-indigo-900/50"
			>
				<div
					class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/50 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white"
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
					<p class="text-sm text-slate-500 dark:text-slate-400">
						Devenez l'hôte et gérez la partie
					</p>
				</div>
			</button>

			<button
				bind:this={cardsRef[1]}
				onclick={joinGame}
				class="group flex cursor-pointer flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-100 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500 dark:hover:shadow-indigo-900/50"
			>
				<div
					class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/50 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white"
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
					<p class="text-sm text-slate-500 dark:text-slate-400">Entrez un code et jouez</p>
				</div>
			</button>
		</div>
	</div>

	<a
		href="https://github.com/GautierPicon/Bingo"
		target="_blank"
		rel="noopener noreferrer"
		class="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-600 shadow-md transition-all hover:bg-slate-50 hover:shadow-lg md:right-auto md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:px-4 md:py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
	>
		<svg
			width="20"
			height="20"
			viewBox="0 0 98 96"
			xmlns="http://www.w3.org/2000/svg"
			class="size-5"
		>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
				fill={isDark ? '#94a3b8' : '#24292f'}
			/>
		</svg>
		<span class="hidden md:inline">Open Source</span>
	</a>
</div>
