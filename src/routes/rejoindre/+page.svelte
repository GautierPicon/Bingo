<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import BackButton from '$lib/components/BackButton.svelte';
	import { useStar, players, isHost } from '../store';
	import { supabase } from '$lib/supabase';
	import profilImg from '$lib/assets/profil.png';

	let formRef = null;
	let codeInput = '';
	let playerName = '';
	let isJoining = false;
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

	function formatCode(value) {
		const cleaned = value.replace(/\s/g, '').toUpperCase();
		if (cleaned.length <= 3) {
			return cleaned;
		}
		return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
	}

	function handleCodeInput(e) {
		codeInput = formatCode(e.target.value);
	}

	async function joinGame() {
		if (!codeInput.trim() || !playerName.trim()) return;

		isJoining = true;
		errorMessage = '';

		try {
			const cleanCode = codeInput.replace(/\s/g, '');
			const { data: room, error: roomError } = await supabase
				.from('rooms')
				.select('*')
				.eq('code', cleanCode)
				.single();

			if (roomError || !room) {
				errorMessage = "Ce code de salon n'existe pas. Vérifiez le code et réessayez.";
				isJoining = false;
				return;
			}

			if (room.status === 'finished') {
				errorMessage = 'Cette partie est terminée. Vous ne pouvez plus la rejoindre.';
				isJoining = false;
				return;
			}

			const { data: existingPlayer } = await supabase
				.from('players')
				.select('*')
				.eq('room_id', room.id)
				.eq('name', playerName.trim())
				.single();

			if (existingPlayer) {
				errorMessage = 'Un joueur avec ce pseudonyme existe déjà dans ce salon.';
				isJoining = false;
				return;
			}

			const { data: player, error: playerError } = await supabase
				.from('players')
				.insert([
					{
						room_id: room.id,
						name: playerName.trim(),
						is_host: false
					}
				])
				.select()
				.single();

			if (playerError) throw playerError;

			localStorage.setItem('bingo_room_id', room.id);
			localStorage.setItem('bingo_room_code', codeInput);
			localStorage.setItem('bingo_group_name', room.name);
			localStorage.setItem('bingo_player_id', player.id);
			localStorage.setItem('bingo_player_name', playerName.trim());

			const newPlayer = {
				id: player.id,
				pseudo: playerName.trim(),
				photo: profilImg,
				isHost: false
			};

			players.set([newPlayer]);
			isHost.set(false);

			// Récupérer la configuration étoile du salon et l'appliquer au store
			useStar.set(room.use_star);

			goto('/salon');
		} catch (error) {
			console.error('Erreur lors de la connexion au salon:', error);
			errorMessage = 'Une erreur est survenue. Réessayez.';
		} finally {
			isJoining = false;
		}
	}

	$: isFormValid = codeInput.trim() && playerName.trim();
</script>

<div
	class="flex min-h-screen flex-col items-center overflow-y-auto bg-linear-to-br from-blue-400 via-purple-500 to-pink-500 p-4 pt-20"
>
	<BackButton />

	<div bind:this={formRef} class="flex w-full max-w-md flex-1 flex-col justify-center py-8">
		<div class="rounded-3xl border-4 border-white bg-white/90 p-8 shadow-2xl backdrop-blur-sm">
			<h1
				class="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text pb-7 text-center text-5xl font-black text-transparent"
			>
				Rejoindre
			</h1>

			{#if errorMessage}
				<div class="mb-4 rounded-xl border-2 border-red-400 bg-red-100 p-3 text-sm text-red-700">
					{errorMessage}
				</div>
			{/if}

			<div class="mb-6">
				<label for="gameCode" class="mb-2 block text-xl font-bold text-gray-700">
					Code du salon
				</label>
				<input
					id="gameCode"
					type="text"
					value={codeInput}
					oninput={handleCodeInput}
					placeholder="XXX XXX"
					maxlength="7"
					disabled={isJoining}
					class="w-full rounded-2xl border-4 border-gray-200 bg-white px-4 py-4 text-center text-2xl font-bold text-gray-800 uppercase transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none disabled:opacity-50"
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
					disabled={isJoining}
					class="w-full rounded-2xl border-4 border-gray-200 bg-white px-4 py-4 text-center text-2xl font-bold text-gray-800 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none disabled:opacity-50"
					onkeypress={(e) => e.key === 'Enter' && joinGame()}
				/>
			</div>

			<button
				onclick={joinGame}
				disabled={!isFormValid || isJoining}
				class="w-full transform cursor-pointer rounded-2xl border-4 border-white bg-linear-to-r from-blue-400 to-purple-500 px-8 py-4 text-2xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.3)] transition-all disabled:cursor-not-allowed disabled:opacity-50 {isFormValid &&
				!isJoining
					? 'hover:scale-105 hover:shadow-[0_12px_0_rgba(0,0,0,0.3)] active:scale-95 active:shadow-none'
					: ''}"
			>
				{isJoining ? 'CONNEXION...' : 'REJOINDRE LE SALON'}
			</button>
		</div>
	</div>
</div>
