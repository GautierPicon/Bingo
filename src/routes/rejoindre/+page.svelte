<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import { useStar, players, isHost } from '../store';
	import { supabase } from '$lib/supabase';
	import { getRandomProfilePictureName, getProfilePictureByName } from '$lib/utils/profilePictures';

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
			{ opacity: 0, y: 20 },
			{ opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
		);
	});

	function formatCode(value) {
		const cleaned = value.replace(/\s/g, '').toUpperCase();
		if (cleaned.length <= 3) return cleaned;
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
				errorMessage = "Ce code de salon n'existe pas.";
				isJoining = false;
				return;
			}

			if (room.status === 'finished') {
				errorMessage = 'Cette partie est déjà terminée.';
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
				errorMessage = 'Ce pseudo est déjà pris dans ce salon.';
				isJoining = false;
				return;
			}

			const profilePictureName = getRandomProfilePictureName();

			const { data: player, error: playerError } = await supabase
				.from('players')
				.insert([
					{
						room_id: room.id,
						name: playerName.trim(),
						is_host: false,
						profile_picture: profilePictureName
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

			players.set([
				{
					id: player.id,
					pseudo: playerName.trim(),
					photo: getProfilePictureByName(profilePictureName),
					isHost: false
				}
			]);
			isHost.set(false);
			useStar.set(room.use_star);
			goto('/salon');
		} catch {
			errorMessage = 'Une erreur est survenue.';
		} finally {
			isJoining = false;
		}
	}

	$: isFormValid = codeInput.trim().length >= 7 && playerName.trim();
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
					Rejoindre<span class="text-indigo-600">.</span>
				</h1>
				<p class="mt-2 text-slate-500 dark:text-slate-400">
					Saisissez le code pour entrer dans la partie.
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
						<label for="gameCode" class="text-xs font-bold tracking-wider text-slate-400 uppercase">
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
							class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center text-3xl font-black tracking-widest uppercase transition-all outline-none placeholder:text-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:focus:bg-slate-600"
						/>
					</div>

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
							disabled={isJoining}
							class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-lg font-semibold transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-600"
						/>
					</div>

					<div class="pt-2">
						<button
							onclick={joinGame}
							disabled={!isFormValid || isJoining}
							class="group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-900 py-5 text-lg font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:bg-slate-700 dark:hover:bg-indigo-600 dark:disabled:bg-slate-600 dark:disabled:text-slate-500"
						>
							<span class="relative z-10 flex items-center justify-center gap-2">
								{#if isJoining}
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
									Connexion...
								{:else}
									Rejoindre le salon
								{/if}
							</span>
						</button>
					</div>
				</div>
			</div>

			<p class="mt-8 text-center text-xs text-slate-400 md:text-sm dark:text-slate-500">
				Pas de code ? Demandez à l'hôte de la partie de vous le partager.
			</p>
		</div>
	</main>
</div>
