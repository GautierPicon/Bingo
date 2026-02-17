<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import gsap from 'gsap';
	import { useStar } from '../store';
	import { supabase } from '$lib/supabase';
	import ideas from '$lib/data/ideas.json';

	let formRef = null;
	let cells = Array.from({ length: 25 }, (_, i) => ({
		id: i + 1,
		text: ''
	}));
	let isSaving = false;
	let errorMessage = '';
	let roomId = '';
	let playerId = '';

	onMount(() => {
		roomId = localStorage.getItem('bingo_room_id') || '';
		playerId = localStorage.getItem('bingo_player_id') || '';

		if (!roomId || !playerId) {
			goto(resolve('/'));
			return;
		}

		loadExistingGrid();

		gsap.fromTo(
			formRef,
			{ opacity: 0, y: 20 },
			{ opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
		);
	});

	async function loadExistingGrid() {
		const { data, error } = await supabase
			.from('grids')
			.select('cells')
			.eq('room_id', roomId)
			.single();

		if (!error && data) {
			cells = data.cells;
		}
	}

	function isCenterCell(index) {
		return index === 12;
	}

	async function saveGrid() {
		const emptyCells = cells.filter((cell, index) => {
			if ($useStar && isCenterCell(index)) return false;
			return !cell.text.trim();
		});

		if (emptyCells.length > 0) {
			errorMessage = 'Veuillez remplir toutes les cases avant de continuer.';
			return;
		}

		isSaving = true;
		errorMessage = '';

		try {
			const { data: existingGrid } = await supabase
				.from('grids')
				.select('id')
				.eq('room_id', roomId)
				.single();

			if (existingGrid) {
				const { error } = await supabase
					.from('grids')
					.update({ cells: cells })
					.eq('room_id', roomId);

				if (error) throw error;
			} else {
				const { error } = await supabase.from('grids').insert([
					{
						room_id: roomId,
						player_id: playerId,
						cells: cells
					}
				]);

				if (error) throw error;
			}

			goto(resolve('/salon'));
		} catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
			errorMessage = 'Une erreur est survenue lors de la sauvegarde.';
		} finally {
			isSaving = false;
		}
	}

	function generateRandomIdeas() {
		const shuffled = [...ideas].sort(() => Math.random() - 0.5);
		cells = cells.map((cell, index) => {
			if ($useStar && isCenterCell(index)) {
				return { ...cell, text: '' };
			}
			return { ...cell, text: shuffled[index] || '' };
		});
	}

	$: isFormValid = cells.every((cell, index) => {
		if ($useStar && isCenterCell(index)) return true;
		return cell.text.trim();
	});
</script>

<div
	class="relative min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100"
>
	<main class="flex flex-col items-center justify-center p-6 pt-20 pb-20">
		<div bind:this={formRef} class="w-full max-w-4xl">
			<div class="mb-8 text-center">
				<h1
					class="text-4xl font-black tracking-tight text-slate-900 md:text-5xl dark:text-slate-100"
				>
					Personnaliser la grille<span class="text-indigo-600">.</span>
				</h1>
				<p class="mt-2 text-slate-500 dark:text-slate-400">Définissez le contenu de chaque case.</p>
			</div>

			<div
				class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-slate-700 dark:bg-slate-800"
			>
				{#if errorMessage}
					<div
						class="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
					>
						{errorMessage}
					</div>
				{/if}

				<div class="mb-6 flex justify-end">
					<button
						type="button"
						onclick={generateRandomIdeas}
						class="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
					>
						<span class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="size-4"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
								/>
							</svg>
							Générer des idées
						</span>
					</button>
				</div>

				<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
					{#each cells as cell, index (cell.id)}
						{@const isCenter = $useStar && isCenterCell(index)}
						<div class="space-y-1">
							<label for="cell-{cell.id}" class="block text-xs font-bold text-slate-400">
								Case {cell.id}
							</label>
							{#if isCenter}
								<div
									class="flex h-20 items-center justify-center rounded-xl border-2 border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="currentColor"
										class="size-8 text-indigo-600"
									>
										<path
											fill-rule="evenodd"
											d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
							{:else}
								<input
									id="cell-{cell.id}"
									type="text"
									bind:value={cell.text}
									placeholder="case {cell.id}"
									disabled={isSaving}
									maxlength="50"
									class="h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-medium transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-600"
								/>
							{/if}
						</div>
					{/each}
				</div>

				<button
					onclick={saveGrid}
					disabled={!isFormValid || isSaving}
					class="w-full cursor-pointer rounded-2xl bg-slate-900 py-5 text-lg font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:bg-slate-700 dark:hover:bg-indigo-600 dark:disabled:bg-slate-600 dark:disabled:text-slate-500"
				>
					<span class="flex items-center justify-center gap-2">
						{#if isSaving}
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
							Sauvegarde...
						{:else}
							Valider et continuer
						{/if}
					</span>
				</button>
			</div>
		</div>
	</main>
</div>
