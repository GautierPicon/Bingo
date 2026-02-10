<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import { players, isHost } from './store';
	import githubImg from '$lib/assets/github.png';

	let titleRef = null;
	let buttonsRef = [];

	onMount(() => {
		players.set([]);
		isHost.set(false);

		gsap.fromTo(
			[titleRef, ...buttonsRef.filter(Boolean)],
			{
				opacity: 0,
				y: 50,
				scale: 0.9
			},
			{
				opacity: 1,
				y: 0,
				scale: 1,
				duration: 0.8,
				stagger: 0.2,
				ease: 'elastic.out(1, 0.5)'
			}
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
	class="relative flex min-h-screen flex-col items-center justify-center gap-12 bg-linear-to-br from-purple-500 via-pink-500 to-orange-400 p-4"
>
	<h1
		bind:this={titleRef}
		class="mb-4 text-center text-8xl font-black text-white drop-shadow-lg md:text-9xl"
	>
		BINGO
	</h1>

	<div class="flex w-full max-w-lg flex-col gap-6 md:flex-row">
		<button
			bind:this={buttonsRef[0]}
			onclick={createGame}
			class="group relative transform cursor-pointer rounded-3xl border-4 border-white bg-linear-to-br from-green-400 to-green-600 px-8 py-6 text-xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.3)] transition-all hover:scale-105 hover:shadow-[0_12px_0_rgba(0,0,0,0.3)] active:scale-95 active:shadow-none md:text-2xl"
		>
			<span class="relative z-10 flex items-center justify-center gap-3">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="size-7 md:size-12"
				>
					<path
						fill-rule="evenodd"
						d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
						clip-rule="evenodd"
					/>
				</svg>
				Créer un salon
			</span>
		</button>

		<button
			bind:this={buttonsRef[1]}
			onclick={joinGame}
			class="group relative transform cursor-pointer rounded-3xl border-4 border-white bg-linear-to-br from-blue-400 to-blue-600 px-8 py-6 text-xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.3)] transition-all hover:scale-105 hover:shadow-[0_12px_0_rgba(0,0,0,0.3)] active:scale-95 active:shadow-none md:text-2xl"
		>
			<span class="relative z-10 flex items-center justify-center gap-3">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="size-7 md:size-12"
				>
					<path
						d="M12 1.5a.75.75 0 0 1 .75.75V7.5h-1.5V2.25A.75.75 0 0 1 12 1.5ZM11.25 7.5v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V7.5h3.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h3.75Z"
					/>
				</svg>
				Rejoindre un salon
			</span>
		</button>
	</div>

	<a
		href="https://github.com/Gautierpicon/Bingo"
		target="_blank"
		rel="noopener noreferrer"
		class="fixed right-4 bottom-4 rounded-full bg-white/10 p-2 shadow-md backdrop-blur-sm transition-all hover:scale-110"
		aria-label="GitHub Repository"
	>
		<img src={githubImg} alt="GitHub" class="size-7 md:size-8" />
	</a>
</div>
