<script>
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import BackButton from '$lib/components/BackButton.svelte';

	let formRef = null;
	let gameCode = '';
	let playerName = '';

	onMount(() => {
		gsap.fromTo(
			formRef,
			{
				opacity: 0,
				y: 50,
				scale: 0.95
			},
			{
				opacity: 1,
				y: 0,
				scale: 1,
				duration: 0.8,
				ease: 'elastic.out(1, 0.5)'
			}
		);
	});

	function joinGame() {
		if (gameCode.trim() && playerName.trim()) {
			localStorage.setItem('bingo_group_name', gameCode.trim());
			localStorage.setItem('bingo_player_name', playerName.trim());
			window.location.href = '/jeu';
		}
	}

	$: isFormValid = gameCode.trim() && playerName.trim();
</script>

<div
	class="flex min-h-screen flex-col items-center overflow-y-auto bg-linear-to-br from-blue-400 via-purple-500 to-pink-500 p-4 pt-20"
>
	<BackButton />

	<div bind:this={formRef} class="flex w-full max-w-md flex-1 flex-col justify-center py-8">
		<div class="rounded-3xl border-4 border-white bg-white/90 p-8 shadow-2xl backdrop-blur-sm">
			<h1
				class="mb-7 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-center text-5xl font-black text-transparent"
			>
				Rejoindre
			</h1>

			<div class="mb-6">
				<label for="gameCode" class="mb-2 block text-xl font-bold text-gray-700">
					Code de la partie
				</label>
				<input
					id="gameCode"
					type="text"
					bind:value={gameCode}
					placeholder="Ex: ABC123"
					class="w-full rounded-2xl border-4 border-gray-200 bg-white px-4 py-4 text-center text-2xl font-bold text-gray-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none"
					onkeypress={(e) => e.key === 'Enter' && document.getElementById('playerName')?.focus()}
				/>
			</div>

			<div class="mb-6">
				<label for="playerName" class="mb-2 block text-xl font-bold text-gray-700">
					Votre pseudonyme
				</label>
				<input
					id="playerName"
					type="text"
					bind:value={playerName}
					placeholder="Ex: Marie"
					class="w-full rounded-2xl border-4 border-gray-200 bg-white px-4 py-4 text-center text-2xl font-bold text-gray-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none"
					onkeypress={(e) => e.key === 'Enter' && joinGame()}
				/>
			</div>

			<button
				onclick={joinGame}
				disabled={!isFormValid}
				class="w-full transform rounded-2xl border-4 border-white bg-linear-to-r from-blue-400 to-purple-500 px-8 py-4 text-2xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.3)] transition-all disabled:cursor-not-allowed disabled:opacity-50 {isFormValid
					? 'hover:scale-105 hover:shadow-[0_12px_0_rgba(0,0,0,0.3)] active:scale-95 active:shadow-none'
					: ''}"
			>
				JOINDRE LA PARTIE
			</button>
		</div>
	</div>
</div>
