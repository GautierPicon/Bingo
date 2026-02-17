<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import { isHost } from '../store';
	import { supabase } from '$lib/supabase';
	import profilImg from '$lib/assets/profil.png';

	let salonRef = null;
	let playerRefs = [];
	let currentPlayerId = '';
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
	let hasGrid = false;

	onMount(async () => {
		currentPlayerId = localStorage.getItem('bingo_player_id') || '';
		groupName = localStorage.getItem('bingo_group_name') || 'Partie';
		roomCode = localStorage.getItem('bingo_room_code') || 'XXX XXX';
		roomId = localStorage.getItem('bingo_room_id') || '';

		await loadPlayers();
		await checkIfGridExists();

		subscribeToPlayers();
		subscribeToRoomStatus();
		await checkRoomStatus();
		startPlayersPolling();

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

	async function checkIfGridExists() {
		if (!roomId) return;

		const { data, error } = await supabase
			.from('grids')
			.select('id')
			.eq('room_id', roomId)
			.single();

		hasGrid = !error && data;
	}

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

		if (!hasGrid) {
			alert("Veuillez d'abord personnaliser la grille avant de lancer la partie.");
			goto('/grille');
			return;
		}

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

	function editGrid() {
		goto('/grille');
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

<div
	class="relative min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100"
>
	<main class="flex flex-col items-center p-6 pt-20 pb-20">
		<div bind:this={salonRef} class="w-full max-w-2xl">
			<div class="mb-8 text-center">
				<span
					class="inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-bold tracking-widest text-indigo-700 uppercase dark:bg-indigo-900/50 dark:text-indigo-300"
				>
					Salon d'attente
				</span>
				<h1
					class="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-6xl dark:text-slate-100"
				>
					{groupName}<span class="text-indigo-600">.</span>
				</h1>
			</div>

			<div
				class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10 dark:border-slate-700 dark:bg-slate-800"
			>
				<div
					class="mb-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-600 dark:bg-slate-700/50"
				>
					<p class="text-xs font-bold tracking-widest text-slate-400 uppercase">
						Code d'invitation
					</p>
					<button
						onclick={copyCode}
						class="group mt-2 flex cursor-pointer items-center gap-3 transition-transform active:scale-95"
					>
						<span
							class="text-4xl font-black tracking-[0.2em] text-slate-800 md:text-5xl dark:text-slate-100"
						>
							{roomCode}
						</span>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors group-hover:border-indigo-200 group-hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:group-hover:border-indigo-500 dark:group-hover:text-indigo-400"
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
						class="mb-10 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20"
					>
						<span class="text-3xl"
							><svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="size-6 text-amber-900"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0"
								/>
							</svg>
						</span>
						<div>
							<p
								class="text-sm font-black tracking-tight text-amber-900 uppercase dark:text-amber-300"
							>
								Dernière Victoire
							</p>
							<p class="font-medium text-amber-700 dark:text-amber-400">
								{winnerName} a remporté la partie !
							</p>
						</div>
					</div>
				{/if}

				<div class="mb-10">
					<div
						class="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-700"
					>
						<h2 class="text-lg font-bold">Joueurs</h2>
						<span
							class="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-slate-700"
						>
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
									: ''} dark:border-slate-700 dark:bg-slate-700/50 dark:hover:bg-slate-700 dark:hover:shadow-slate-900/50"
							>
								<img
									src={player.photo}
									alt=""
									class="size-10 rounded-full border-2 border-white object-cover shadow-sm dark:border-slate-600"
								/>
								<div class="flex flex-col overflow-hidden">
									<span class="truncate text-sm font-bold text-slate-800 dark:text-slate-200"
										>{player.pseudo}</span
									>
									{#if player.isHost}
										<span class="text-[10px] font-bold tracking-wider text-indigo-500 uppercase"
											>Hôte</span
										>
									{:else if isCurrentPlayer(player)}
										<span
											class="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500"
											>Vous</span
										>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>

				{#if $isHost}
					<div class="space-y-3">
						{#if hasGrid}
							<button
								onclick={editGrid}
								class="w-full rounded-2xl border-2 border-slate-200 bg-white py-4 text-base font-semibold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
							>
								<span class="flex items-center justify-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="2"
										stroke="currentColor"
										class="size-6"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
										/>
									</svg>
									Modifier la grille
								</span>
							</button>
						{/if}
						<button
							onclick={startGame}
							disabled={isStartingGame || players.length < 1 || !hasGrid}
							class="w-full rounded-2xl bg-slate-900 py-5 text-lg font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:bg-slate-700 dark:hover:bg-indigo-600 dark:disabled:bg-slate-600 dark:disabled:text-slate-500"
						>
							{#if !hasGrid}
								Personnaliser la grille d'abord
							{:else if isStartingGame}
								Préparation...
							{:else}
								Lancer la partie
							{/if}
						</button>
					</div>
				{:else}
					<div
						class="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 py-5 text-slate-500 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400"
					>
						<div class="h-2 w-2 animate-pulse rounded-full bg-indigo-500"></div>
						<span class="text-sm font-medium">Attente du lancement par l'hôte...</span>
					</div>
				{/if}
			</div>
		</div>
	</main>
</div>
