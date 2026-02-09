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
	let roomSubscription = null;
	let copySuccess = false;
	let isStartingGame = false;
	let pollingInterval = null;

	onMount(async () => {
		currentPlayerId = localStorage.getItem('bingo_player_id') || '';
		groupName = localStorage.getItem('bingo_group_name') || 'Partie';
		roomCode = localStorage.getItem('bingo_room_code') || 'XXX XXX';
		roomId = localStorage.getItem('bingo_room_id') || '';

		await loadPlayers();

		subscribeToPlayers();
		subscribeToRoomStatus();
		await checkRoomStatus();
		startPolling();

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
		if (roomSubscription) {
			roomSubscription.unsubscribe();
		}
		if (pollingInterval) {
			clearInterval(pollingInterval);
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

	async function checkRoomStatus() {
		if (!roomId) return;

		const { data, error } = await supabase.from('rooms').select('status').eq('id', roomId).single();

		if (error) {
			console.error('Erreur lors de la vérification du statut:', error);
			return;
		}

		if (data?.status === 'playing') {
			// Arrêter le polling avant de rediriger
			if (pollingInterval) {
				clearInterval(pollingInterval);
				pollingInterval = null;
			}
			goto('/jeu');
		}
	}

	function startPolling() {
		// Vérifier toutes les 2 secondes
		pollingInterval = setInterval(() => {
			checkRoomStatus();
		}, 2000);
	}

	function subscribeToRoomStatus() {
		if (!roomId) return;

		roomSubscription = supabase
			.channel(`room-status:${roomId}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'rooms',
					filter: `id=eq.${roomId}`
				},
				(payload) => {
					console.log('Changement de statut de la room:', payload);
					if (payload.new.status === 'playing') {
						// Arrêter le polling avant de rediriger
						if (pollingInterval) {
							clearInterval(pollingInterval);
							pollingInterval = null;
						}
						goto('/jeu');
					}
				}
			)
			.subscribe();
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

	async function startGame() {
		if (!roomId || isStartingGame) return;

		isStartingGame = true;

		try {
			const { error } = await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId);

			if (error) {
				console.error('Erreur lors du lancement de la partie:', error);
				isStartingGame = false;
				return;
			}

			// Arrêter le polling avant de rediriger
			if (pollingInterval) {
				clearInterval(pollingInterval);
				pollingInterval = null;
			}

			// Attendre un peu pour laisser le temps à Realtime de notifier
			// Si Realtime ne fonctionne pas, on redirige quand même l'hôte après 500ms
			setTimeout(() => {
				goto('/jeu');
			}, 500);
		} catch (error) {
			console.error('Erreur lors du lancement:', error);
			isStartingGame = false;
		}
	}

	async function copyCode() {
		await navigator.clipboard.writeText(roomCode.replace(' ', ''));
		copySuccess = true;
		setTimeout(() => (copySuccess = false), 2000);
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

			<div class="mb-4 flex flex-col items-center md:mb-6">
				<p class="text-center text-lg font-bold text-black md:text-xl">Code de la partie:</p>
				<button
					onclick={copyCode}
					class="group flex cursor-pointer items-center gap-2 rounded-lg bg-transparent px-4 py-2"
					title="Copier le code"
				>
					{#if copySuccess}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="size-7 transition-transform duration-200 group-hover:scale-115 active:scale-95"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75"
							/>
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="size-7 transition-transform duration-200 group-hover:scale-115 active:scale-95"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
							/>
						</svg>
					{/if}
					<span class="text-3xl font-black text-gray-800 md:text-4xl">
						{roomCode}
					</span>
				</button>
			</div>

			<div class="mb-4 md:mb-6">
				<p class="mb-3 text-center text-xl font-bold text-black md:mb-4 md:text-2xl">
					{players.length} joueur{players.length > 1 ? 's' : ''}:
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
					disabled={isStartingGame}
					class="w-full transform cursor-pointer rounded-2xl border-4 border-white bg-linear-to-r from-green-400 to-green-600 px-6 py-3 text-lg font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.3)] transition-all hover:scale-105 hover:shadow-[0_12px_0_rgba(0,0,0,0.3)] active:scale-95 active:shadow-none disabled:cursor-not-allowed disabled:opacity-70 md:px-8 md:py-4 md:text-2xl"
				>
					{isStartingGame ? 'LANCEMENT...' : 'LANCER LA PARTIE'}
				</button>
			{/if}
		</div>
	</div>
</div>
