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
	let winnerName = '';

	onMount(async () => {
		currentPlayerId = localStorage.getItem('bingo_player_id') || '';
		groupName = localStorage.getItem('bingo_group_name') || 'Partie';
		roomCode = localStorage.getItem('bingo_room_code') || 'XXX XXX';
		roomId = localStorage.getItem('bingo_room_id') || '';

		await loadPlayers();

		subscribeToPlayers();
		subscribeToRoomStatus();
		await checkRoomStatus();
		startPlayersPolling();

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

	function startPlayersPolling() {
		pollingInterval = setInterval(() => {
			loadPlayers();
			checkRoomStatus();
		}, 2000);
	}

	async function checkRoomStatus() {
		if (!roomId) return;

		const { data, error } = await supabase
			.from('rooms')
			.select('status, winner_id')
			.eq('id', roomId)
			.single();

		if (error) {
			console.error('Erreur lors de la vérification du statut:', error);
			return;
		}

		if (data?.status === 'playing') {
			if (pollingInterval) {
				clearInterval(pollingInterval);
				pollingInterval = null;
			}
			winnerName = '';
			goto('/jeu');
		} else if (data?.status === 'waiting' && data?.winner_id) {
			if (data.winner_id) {
				const { data: winnerData } = await supabase
					.from('players')
					.select('name')
					.eq('id', data.winner_id)
					.single();
				if (winnerData) {
					winnerName = winnerData.name;
				}
			}
		}
	}

	function subscribeToRoomStatus() {
		if (!roomId) return;

		const channelName = `room-status-${roomId}`;
		console.log('Connexion au canal room status:', channelName);

		roomSubscription = supabase
			.channel(channelName)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'rooms',
					filter: `id=eq.${roomId}`
				},
				async (payload) => {
					console.log('Changement de statut de la room:', payload);
					if (payload.new.status === 'playing') {
						if (pollingInterval) {
							clearInterval(pollingInterval);
							pollingInterval = null;
						}
						winnerName = '';
						goto('/jeu');
					} else if (payload.new.status === 'waiting' && payload.new.winner_id) {
						if (payload.new.winner_id) {
							const { data: winnerData } = await supabase
								.from('players')
								.select('name')
								.eq('id', payload.new.winner_id)
								.single();
							if (winnerData) {
								winnerName = winnerData.name;
							}
						}
					}
				}
			)
			.subscribe((status, err) => {
				console.log('Statut subscription room:', status);
				if (status === 'SUBSCRIBED') {
					console.log('Abonnement room actif');
				} else if (status === 'CHANNEL_ERROR') {
					console.error('Erreur canal room:', err);
				} else if (status === 'TIMED_OUT') {
					console.warn('Timeout canal room');
				}
			});
	}

	function subscribeToPlayers() {
		if (!roomId) return;

		const channelName = `room-players-${roomId}`;
		console.log('Connexion au canal:', channelName);

		playersSubscription = supabase
			.channel(channelName)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'players',
					filter: `room_id=eq.${roomId}`
				},
				async (payload) => {
					console.log('Changement joueur détecté:', payload);

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
			.subscribe((status, err) => {
				console.log('Statut subscription joueurs:', status);
				if (status === 'SUBSCRIBED') {
					console.log('Abonnement joueurs actif');
				} else if (status === 'CHANNEL_ERROR') {
					console.error('Erreur canal joueurs:', err);
					loadPlayers();
				} else if (status === 'TIMED_OUT') {
					console.warn('Timeout canal joueurs');
					loadPlayers();
				}
			});
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
			const { error } = await supabase
				.from('rooms')
				.update({ status: 'playing', winner_id: null })
				.eq('id', roomId);

			if (error) {
				console.error('Erreur lors du lancement de la partie:', error);
				isStartingGame = false;
				return;
			}

			if (pollingInterval) {
				clearInterval(pollingInterval);
				pollingInterval = null;
			}

			setTimeout(() => {
				goto('/jeu');
			}, 500);
		} catch (error) {
			console.error('Erreur lors du lancement:', error);
			isStartingGame = false;
		}
	}

	async function copyCode() {
		const code = roomCode.replace(' ', '');

		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(code);
			} else {
				const textArea = document.createElement('textarea');
				textArea.value = code;
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				textArea.style.top = '-999999px';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();

				const successful = document.execCommand('copy');
				document.body.removeChild(textArea);

				if (!successful) {
					throw new Error('execCommand copy failed');
				}
			}

			copySuccess = true;
			setTimeout(() => (copySuccess = false), 2000);
		} catch (err) {
			console.error('Erreur lors de la copie:', err);
			alert('Impossible de copier automatiquement. Code: ' + code);
		}
	}
</script>

<div class="relative min-h-screen bg-slate-50 font-sans text-slate-900">
	<header class="flex h-20 items-center px-6">
		<BackButton />
	</header>

	<main class="flex flex-col items-center p-6 pb-20">
		<div bind:this={salonRef} class="w-full max-w-2xl">
			<div class="mb-8 text-center">
				<span
					class="inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-bold tracking-widest text-indigo-700 uppercase"
				>
					Salon d'attente
				</span>
				<h1 class="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
					{groupName}<span class="text-indigo-600">.</span>
				</h1>
			</div>

			<div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
				<div
					class="mb-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6"
				>
					<p class="text-xs font-bold tracking-widest text-slate-400 uppercase">
						Code d'invitation
					</p>
					<button
						onclick={copyCode}
						class="group mt-2 flex cursor-pointer items-center gap-3 transition-transform active:scale-95"
					>
						<span class="text-4xl font-black tracking-[0.2em] text-slate-800 md:text-5xl">
							{roomCode}
						</span>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors group-hover:border-indigo-200 group-hover:text-indigo-600"
						>
							{#if copySuccess}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="size-5 text-green-500"
								>
									<path
										fill-rule="evenodd"
										d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z"
										clip-rule="evenodd"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="2"
									stroke="currentColor"
									class="size-5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
									/>
								</svg>
							{/if}
						</div>
					</button>
				</div>

				{#if winnerName}
					<div
						class="mb-10 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
					>
						<span class="text-3xl">🏆</span>
						<div>
							<p class="text-sm font-black tracking-tight text-amber-900 uppercase">
								Dernière Victoire
							</p>
							<p class="font-medium text-amber-700">{winnerName} a remporté la partie !</p>
						</div>
					</div>
				{/if}

				<div class="mb-10">
					<div class="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
						<h2 class="text-lg font-bold">Joueurs</h2>
						<span class="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
							{players.length} connecté{players.length > 1 ? 's' : ''}
						</span>
					</div>

					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
						{#each players as player (player.id)}
							<div
								class="relative flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 transition-all hover:bg-white hover:shadow-md {isCurrentPlayer(
									player
								)
									? 'border-indigo-200 ring-2 ring-indigo-500/20'
									: ''}"
							>
								<img
									src={player.photo}
									alt=""
									class="size-10 rounded-full border-2 border-white object-cover shadow-sm"
								/>
								<div class="flex flex-col overflow-hidden">
									<span class="truncate text-sm font-bold text-slate-800">{player.pseudo}</span>
									{#if player.isHost}
										<span class="text-[10px] font-bold tracking-wider text-indigo-500 uppercase"
											>Hôte</span
										>
									{:else if isCurrentPlayer(player)}
										<span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
											>Vous</span
										>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>

				{#if $isHost}
					<button
						onclick={startGame}
						disabled={isStartingGame || players.length < 1}
						class="w-full rounded-2xl bg-slate-900 py-5 text-lg font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
					>
						{isStartingGame ? 'Préparation...' : 'Lancer la partie'}
					</button>
				{:else}
					<div
						class="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 py-5 text-slate-500"
					>
						<div class="h-2 w-2 animate-pulse rounded-full bg-indigo-500"></div>
						<span class="text-sm font-medium">Attente du lancement par l'hôte...</span>
					</div>
				{/if}
			</div>
		</div>
	</main>
</div>
