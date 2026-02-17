<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import { useStar, players, isHost } from '../store';
	import { supabase } from '$lib/supabase';
	import { getRandomProfilePictureName, getProfilePictureByName } from '$lib/utils/profilePictures';

	let formRef = null;
	let playerName = '';
	let isCreating = false;
	let errorMessage = '';

	onMount(() => {
		players.set([]);
		isHost.set(false);

		gsap.fromTo(
			formRef,
			{ opacity: 0, y: 20 },
			{ opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
		);
	});

	function generateRoomCode() {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let code = '';
		for (let i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return code.slice(0, 3) + ' ' + code.slice(3);
	}

	async function createGame() {
		if (!playerName.trim()) return;
		isCreating = true;
		errorMessage = '';
		try {
			const roomCode = generateRoomCode();
			const { data: room, error: roomError } = await supabase
				.from('rooms')
				.insert([
					{
						code: roomCode.replace(' ', ''),
						use_star: $useStar,
						status: 'waiting'
					}
				])
				.select()
				.single();

			if (roomError) throw roomError;

			const profilePictureName = getRandomProfilePictureName();

			const { data: player, error: playerError } = await supabase
				.from('players')
				.insert([
					{
						room_id: room.id,
						name: playerName.trim(),
						is_host: true,
						profile_picture: profilePictureName
					}
				])
				.select()
				.single();

			if (playerError) throw playerError;

			localStorage.setItem('bingo_room_id', room.id);
			localStorage.setItem('bingo_room_code', roomCode);
			localStorage.setItem('bingo_player_id', player.id);
			localStorage.setItem('bingo_player_name', playerName.trim());

			players.set([
				{
					id: player.id,
					pseudo: playerName.trim(),
					photo: getProfilePictureByName(profilePictureName),
					isHost: true
				}
			]);
			isHost.set(true);
			goto('/grille');
		} catch {
			errorMessage = 'Une erreur est survenue lors de la création.';
		} finally {
			isCreating = false;
		}
	}

	$: isFormValid = playerName.trim();
</script>

<div
	class="relative min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100"
>
	<main class="flex flex-col items-center justify-center p-6 pt-20 pb-20">
		<div bind:this={formRef} class="w-full max-w-lg">
			<div class="mb-10 text-center">
				<h1
					class="text-4xl font-black tracking-tight text-slate-900 md:text-5xl dark:text-slate-100"
				>
					Créer un salon<span class="text-indigo-600">.</span>
				</h1>
				<p class="mt-2 text-slate-500 dark:text-slate-400">
					Configurez votre partie en quelques secondes.
				</p>
			</div>

			<div
				class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800"
			>
				{#if errorMessage}
					<div
						class="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
					>
						{errorMessage}
					</div>
				{/if}

				<div class="space-y-6">
					<div class="space-y-2">
						<label
							for="playerName"
							class="text-xs font-bold tracking-wider text-slate-400 uppercase"
						>
							Votre pseudonyme
						</label>
						<input
							id="playerName"
							type="text"
							bind:value={playerName}
							placeholder="Ex: Marie"
							disabled={isCreating}
							class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-lg font-semibold transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-600"
						/>
					</div>

					<button
						type="button"
						onclick={() => useStar.set(!$useStar)}
						class="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50 dark:hover:bg-slate-700"
					>
						<div class="flex flex-col items-start text-left">
							<span class="font-bold text-slate-700 dark:text-slate-200">Case étoile centrale</span>
							<span class="text-xs text-slate-500 dark:text-slate-400"
								>La case du milieu est offerte au départ.</span
							>
						</div>
						<div
							class="relative h-6 w-11 rounded-full transition-colors {$useStar
								? 'bg-indigo-600'
								: 'bg-slate-300'}"
						>
							<div
								class="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform {$useStar
									? 'translate-x-5'
									: 'translate-x-0'}"
							></div>
						</div>
					</button>

					<button
						onclick={createGame}
						disabled={!isFormValid || isCreating}
						class="group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-900 py-5 text-lg font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
					>
						<span class="relative z-10 flex items-center justify-center gap-2">
							{#if isCreating}
								<svg
									class="h-5 w-5 animate-spin text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Création...
							{:else}
								Créer le salon
							{/if}
						</span>
					</button>
				</div>
			</div>
		</div>
	</main>
</div>
