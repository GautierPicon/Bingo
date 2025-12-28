<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import gsap from 'gsap';
	import BackButton from '$lib/components/BackButton.svelte';
	import { players, isHost } from '../store';
	import { get } from 'svelte/store';
	import profilImg from '$lib/assets/profil.png';

	let salonRef = null;
	let playerRefs = [];
	let currentPlayerName = '';
	let previousPlayerCount = 0;
	let groupName = '';

	onMount(() => {
		if (!browser) return;

		currentPlayerName = localStorage.getItem('bingo_player_name') || '';
		groupName = localStorage.getItem('bingo_group_name') || 'Partie';

		const playerName = currentPlayerName || 'joueur';
		const currentPlayers = get(players);
		const existingPlayer = currentPlayers.find((p) => p.pseudo === playerName);

		if (!existingPlayer) {
			const newPlayer = {
				id: Date.now(),
				pseudo: playerName,
				photo: profilImg,
				isHost: get(isHost) || currentPlayers.length === 0
			};
			players.set([newPlayer]);
		}

		previousPlayerCount = $players.length;

		gsap.fromTo(
			salonRef,
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

		setTimeout(() => {
			const refs = playerRefs.filter((ref) => ref !== null);
			gsap.fromTo(
				refs,
				{
					opacity: 0,
					scale: 0.5
				},
				{
					opacity: 1,
					scale: 1,
					duration: 0.5,
					stagger: 0.1,
					ease: 'back.out(1.7)'
				}
			);
		}, 300);
	});

	$: if ($players.length > previousPlayerCount) {
		animateNewPlayer($players.length - 1);
		previousPlayerCount = $players.length;
	}

	function animateNewPlayer(index) {
		setTimeout(() => {
			if (playerRefs[index]) {
				gsap.fromTo(
					playerRefs[index],
					{
						opacity: 0,
						scale: 0.5
					},
					{
						opacity: 1,
						scale: 1,
						duration: 0.5,
						ease: 'back.out(1.7)'
					}
				);
			}
		}, 50);
	}

	function isCurrentPlayer(player) {
		return player.pseudo === currentPlayerName;
	}

	function addFakePlayer() {
		const fakePlayer = {
			id: Date.now(),
			pseudo: 'joueur',
			photo: profilImg,
			isHost: false
		};

		players.update((currentPlayers) => [...currentPlayers, fakePlayer]);
	}

	function startGame() {
		if (!browser) return;
		window.location.href = '/jeu';
	}
</script>

<div
	class="flex min-h-screen flex-col items-center overflow-y-auto bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 pt-20"
>
	<BackButton />

	<div bind:this={salonRef} class="flex w-full max-w-2xl flex-1 flex-col gap-8 py-4 md:py-8">
		<div
			class="rounded-3xl border-4 border-white bg-white/90 p-4 shadow-2xl backdrop-blur-sm md:p-8"
		>
			<h1
				class="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text pb-4 text-center text-4xl font-black text-transparent md:pb-6 md:text-5xl"
			>
				{groupName}
			</h1>

			<div class="mb-4 md:mb-6">
				<p class="mb-2 text-center text-lg font-bold text-gray-700 md:mb-4 md:text-xl">
					Code de la partie
				</p>
				<p class="text-center text-3xl font-black text-gray-800 md:text-4xl">XXX XXX</p>
			</div>

			<div class="mb-4 md:mb-6">
				<p class="mb-3 text-center text-xl font-bold text-gray-700 md:mb-4 md:text-2xl">
					Joueurs ({$players.length})
				</p>
				<div class="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
					{#each $players as player, index (player.id)}
						<div
							bind:this={playerRefs[index]}
							class="flex h-full flex-col items-center rounded-2xl border-4 p-3 shadow-lg transition-all hover:scale-105 hover:shadow-xl {isCurrentPlayer(
								player
							)
								? 'border-green-400 bg-green-50'
								: 'border-gray-200 bg-white'} md:p-4"
						>
							<div
								class="mb-2 overflow-hidden rounded-full border-4 border-indigo-500 shadow-md md:mb-3"
							>
								<img
									src={player.photo}
									alt={player.pseudo}
									class="size-12 object-cover md:size-16"
								/>
							</div>
							<p class="text-center text-xs font-bold text-gray-800 md:text-sm">
								{player.pseudo}
							</p>
							{#if player.isHost}
								<span class="mt-1 text-[10px] font-bold text-indigo-600 md:text-xs">Hôte</span>
							{/if}
							{#if isCurrentPlayer(player)}
								<span class="mt-1 text-[10px] font-bold text-green-600 md:text-xs">Vous</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<button
				onclick={addFakePlayer}
				class="mb-3 cursor-pointer text-xs text-gray-600 hover:underline md:mb-4 md:text-sm"
			>
				DEBUG: Ajouter un joueur
			</button>

			{#if $isHost}
				<button
					onclick={startGame}
					class="w-full transform cursor-pointer rounded-2xl border-4 border-white bg-linear-to-r from-green-400 to-green-600 px-6 py-3 text-lg font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.3)] transition-all hover:scale-105 hover:shadow-[0_12px_0_rgba(0,0,0,0.3)] active:scale-95 active:shadow-none md:px-8 md:py-4 md:text-2xl"
				>
					LANCER LA PARTIE
				</button>
			{/if}
		</div>
	</div>
</div>
