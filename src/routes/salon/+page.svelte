<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import BackButton from '$lib/components/BackButton.svelte';
	import { isHost } from '../store';
	import { supabase } from '$lib/supabase';
	import profilImg from '$lib/assets/profil.png';

	let salonRef = null;
	let playerRefs = [];
	let currentPlayerId = '';
	let previousPlayerCount = 0;
	let groupName = '';
	let roomCode = '';
	let roomId = '';
	let players = [];
	let playersSubscription = null;

	onMount(async () => {
		currentPlayerId = localStorage.getItem('bingo_player_id') || '';
		groupName = localStorage.getItem('bingo_group_name') || 'Partie';
		roomCode = localStorage.getItem('bingo_room_code') || 'XXX XXX';
		roomId = localStorage.getItem('bingo_room_id') || '';

		await loadPlayers();

		subscribeToPlayers();

		previousPlayerCount = players.length;

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

	onDestroy(() => {
		if (playersSubscription) {
			playersSubscription.unsubscribe();
		}
	});

	async function loadPlayers() {
		if (!roomId) return;

		const { data, error } = await supabase
			.from('players')
			.select('*')
			.eq('room_id', roomId)
			.order('joined_at', { ascending: true });

		if (error) {
			console.error('Erreur lors du chargement des joueurs:', error);
			return;
		}

		players = data.map((player) => ({
			id: player.id,
			pseudo: player.name,
			photo: profilImg,
			isHost: player.is_host
		}));
	}

	function subscribeToPlayers() {
		if (!roomId) return;

		playersSubscription = supabase
			.channel(`room:${roomId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'players',
					filter: `room_id=eq.${roomId}`
				},
				async (payload) => {
					console.log('Changement détecté:', payload);

					if (payload.eventType === 'INSERT') {
						const newPlayer = {
							id: payload.new.id,
							pseudo: payload.new.name,
							photo: profilImg,
							isHost: payload.new.is_host
						};
						players = [...players, newPlayer];
						animateNewPlayer(players.length - 1);
					} else if (payload.eventType === 'DELETE') {
						players = players.filter((p) => p.id !== payload.old.id);
					} else if (payload.eventType === 'UPDATE') {
						players = players.map((p) =>
							p.id === payload.new.id
								? { ...p, pseudo: payload.new.name, isHost: payload.new.is_host }
								: p
						);
					}
				}
			)
			.subscribe();
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
		return player.id === currentPlayerId;
	}

	function startGame() {
		goto('/jeu');
	}

	function copyCode() {
		navigator.clipboard.writeText(roomCode.replace(' ', ''));
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
				<button
					onclick={copyCode}
					class="group relative w-full cursor-pointer rounded-2xl border-4 border-indigo-300 bg-indigo-50 px-4 py-3 transition-all hover:border-indigo-400 hover:bg-indigo-100"
					title="Cliquer pour copier"
				>
					<p class="text-center text-3xl font-black text-gray-800 md:text-4xl">
						{roomCode}
					</p>
					<span
						class="mt-1 block text-xs text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100 md:text-sm"
					>
						📋 Cliquer pour copier
					</span>
				</button>
			</div>

			<div class="mb-4 md:mb-6">
				<p class="mb-3 text-center text-xl font-bold text-gray-700 md:mb-4 md:text-2xl">
					Joueurs ({players.length})
				</p>
				<div class="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
					{#each players as player, index (player.id)}
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
