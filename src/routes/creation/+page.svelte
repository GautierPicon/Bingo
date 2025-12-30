<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import BackButton from '$lib/components/BackButton.svelte';
	import { useStar, players, isHost } from '../store';
	import { supabase } from '$lib/supabase';
	import profilImg from '$lib/assets/profil.png';

	let formRef = null;
	let groupName = '';
	let playerName = '';
	let isCreating = false;
	let errorMessage = '';

	onMount(() => {
		players.set([]);
		isHost.set(false);

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

	// Génère un code unique à 6 caractères
	function generateRoomCode() {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans caractères ambigus
		let code = '';
		for (let i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		// Formate le code: XXX XXX
		return code.slice(0, 3) + ' ' + code.slice(3);
	}

	async function createGame() {
		if (!groupName.trim() || !playerName.trim()) return;

		isCreating = true;
		errorMessage = '';

		try {
			// 1. Créer le salon dans Supabase
			const roomCode = generateRoomCode();
			const { data: room, error: roomError } = await supabase
				.from('rooms')
				.insert([
					{
						code: roomCode.replace(' ', ''), // Stocke sans espace
						name: groupName.trim(),
						use_star: $useStar,
						status: 'waiting'
					}
				])
				.select()
				.single();

			if (roomError) throw roomError;

			// 2. Ajouter l'hôte comme joueur
			const { data: player, error: playerError } = await supabase
				.from('players')
				.insert([
					{
						room_id: room.id,
						name: playerName.trim(),
						is_host: true
					}
				])
				.select()
				.single();

			if (playerError) throw playerError;

			// 3. Stocker localement
			localStorage.setItem('bingo_room_id', room.id);
			localStorage.setItem('bingo_room_code', roomCode);
			localStorage.setItem('bingo_group_name', groupName.trim());
			localStorage.setItem('bingo_player_id', player.id);
			localStorage.setItem('bingo_player_name', playerName.trim());

			// 4. Mettre à jour les stores
			const host = {
				id: player.id,
				pseudo: playerName.trim(),
				photo: profilImg,
				isHost: true
			};

			players.set([host]);
			isHost.set(true);

			// 5. Rediriger vers le salon
			goto('/salon');
		} catch (error) {
			console.error('Erreur lors de la création du salon:', error);
			errorMessage = 'Une erreur est survenue lors de la création du salon. Réessayez.';
		} finally {
			isCreating = false;
		}
	}

	$: isFormValid = groupName.trim() && playerName.trim();
</script>

<div
	class="flex min-h-screen flex-col items-center overflow-y-auto bg-linear-to-br from-green-400 via-teal-500 to-blue-500 p-4 pt-20"
>
	<BackButton />

	<div bind:this={formRef} class="flex w-full max-w-md flex-1 flex-col justify-center py-8">
		<div class="rounded-3xl border-4 border-white bg-white/90 p-8 shadow-2xl backdrop-blur-sm">
			<h1
				class="bg-linear-to-r from-green-600 to-teal-600 bg-clip-text pb-6 text-center text-5xl font-black text-transparent"
			>
				Créer
			</h1>

			{#if errorMessage}
				<div class="mb-4 rounded-xl border-2 border-red-400 bg-red-100 p-3 text-sm text-red-700">
					{errorMessage}
				</div>
			{/if}

			<div class="mb-6">
				<label for="groupName" class="mb-2 block text-xl font-bold text-gray-700">
					Nom du salon
				</label>
				<input
					id="groupName"
					type="text"
					bind:value={groupName}
					placeholder="Ex: Soirée 🥂"
					disabled={isCreating}
					class="w-full rounded-2xl border-4 border-gray-200 bg-white px-4 py-4 text-center text-2xl font-bold text-gray-800 transition-all focus:border-green-500 focus:ring-4 focus:ring-green-200 focus:outline-none disabled:opacity-50"
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
					disabled={isCreating}
					class="w-full rounded-2xl border-4 border-gray-200 bg-white px-4 py-4 text-center text-2xl font-bold text-gray-800 transition-all focus:border-green-500 focus:ring-4 focus:ring-green-200 focus:outline-none disabled:opacity-50"
					onkeypress={(e) => e.key === 'Enter' && createGame()}
				/>
			</div>

			<label
				class="mb-6 flex cursor-pointer items-start gap-4 rounded-2xl border-4 border-gray-200 bg-white p-6 transition-all hover:border-green-400 hover:shadow-lg"
			>
				<div class="relative flex h-8 w-8 shrink-0 items-center justify-center">
					<input
						type="checkbox"
						bind:checked={$useStar}
						disabled={isCreating}
						class="peer h-8 w-8 cursor-pointer appearance-none rounded-lg border-4 border-gray-300 bg-white transition-all checked:border-green-500 checked:bg-green-500 disabled:opacity-50"
					/>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="pointer-events-none absolute size-5 text-white opacity-0 peer-checked:opacity-100"
					>
						<path
							fill-rule="evenodd"
							d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="flex flex-col">
					<span class="text-xl font-bold text-gray-800">Activer la case étoile au centre</span>
					<span class="mt-2 text-base text-gray-600">
						La case étoile au centre de la grille compte comme une case déjà cochée.
					</span>
				</div>
			</label>

			<button
				onclick={createGame}
				disabled={!isFormValid || isCreating}
				class="w-full transform cursor-pointer rounded-2xl border-4 border-white bg-linear-to-r from-green-400 to-teal-500 px-8 py-4 text-2xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.3)] transition-all disabled:cursor-not-allowed disabled:opacity-50 {isFormValid &&
				!isCreating
					? 'hover:scale-105 hover:shadow-[0_12px_0_rgba(0,0,0,0.3)] active:scale-95 active:shadow-none'
					: ''}"
			>
				{isCreating ? 'CRÉATION...' : 'CRÉER LE SALON'}
			</button>
		</div>
	</div>
</div>
