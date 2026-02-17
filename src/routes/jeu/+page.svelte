<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useStar, hasPlayedGridAnimation } from '../store';
	import gsap from 'gsap';
	import { supabase } from '$lib/supabase';

	let grid = [];
	let cellRefs = Array.from({ length: 25 }, () => null);
	let bingoButtonRef = null;
	let roomSubscription = null;
	let roomId = '';
	let playerId = '';
	let pollingInterval = null;

	onMount(async () => {
		roomId = localStorage.getItem('bingo_room_id') || '';
		playerId = localStorage.getItem('bingo_player_id') || '';

		if (roomId) {
			const { data: room, error } = await supabase
				.from('rooms')
				.select('use_star')
				.eq('id', roomId)
				.single();

			if (!error && room) {
				useStar.set(room.use_star);
			}

			await loadGrid();
		}

		if (!$hasPlayedGridAnimation) {
			gsap.fromTo(
				cellRefs.filter((ref) => ref !== null),
				{
					opacity: 0,
					scale: 0.8
				},
				{
					opacity: 1,
					scale: 1,
					duration: 0.5,
					stagger: 0.03,
					ease: 'back.out(1.2)',
					onComplete: () => {
						hasPlayedGridAnimation.set(true);
					}
				}
			);
		}

		subscribeToRoomStatus();
		await checkRoomStatus();
		startPolling();
	});

	onDestroy(() => {
		if (roomSubscription) {
			roomSubscription.unsubscribe();
		}
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
	});

	async function loadGrid() {
		const { data, error } = await supabase
			.from('grids')
			.select('cells')
			.eq('room_id', roomId)
			.eq('player_id', playerId)
			.single();

		if (!error && data) {
			grid = data.cells.map((cell) => ({
				...cell,
				checked: false
			}));
		} else {
			grid = Array.from({ length: 25 }, (_, i) => ({
				id: i + 1,
				text: String(i + 1),
				checked: false
			}));
		}
	}

	async function checkRoomStatus() {
		if (!roomId) return;

		const { data, error } = await supabase.from('rooms').select('status').eq('id', roomId).single();

		if (error) {
			console.error('Erreur lors de la vérification du statut:', error);
			return;
		}

		if (data?.status === 'waiting') {
			if (pollingInterval) {
				clearInterval(pollingInterval);
				pollingInterval = null;
			}
			goto(resolve('/salon'));
		}
	}

	function startPolling() {
		pollingInterval = setInterval(() => {
			checkRoomStatus();
		}, 2000);
	}

	function subscribeToRoomStatus() {
		if (!roomId) return;

		roomSubscription = supabase
			.channel(`room-game-status:${roomId}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'rooms',
					filter: `id=eq.${roomId}`
				},
				(payload) => {
					console.log('Changement de statut de la room (jeu):', payload);
					if (payload.new.status === 'waiting') {
						if (pollingInterval) {
							clearInterval(pollingInterval);
							pollingInterval = null;
						}
						goto(resolve('/salon'));
					}
				}
			)
			.subscribe();
	}

	function toggleCell(index) {
		grid[index].checked = !grid[index].checked;
		grid = [...grid];

		if (cellRefs[index]) {
			gsap.fromTo(
				cellRefs[index],
				{ scale: 1 },
				{
					scale: 1.15,
					duration: 0.1,
					yoyo: true,
					repeat: 1,
					ease: 'power1.inOut'
				}
			);
		}

		checkWin();
	}

	let winner = false;

	function isCenterCell(index) {
		return index === 12;
	}

	function isCellChecked(cell, index) {
		return cell.checked || ($useStar && isCenterCell(index));
	}

	function checkWin() {
		winner = false;
		const rows = [];
		const cols = [];
		const diag1 = [];
		const diag2 = [];

		for (let i = 0; i < 5; i++) {
			rows.push(
				grid.slice(i * 5, (i + 1) * 5).every((cell, idx) => isCellChecked(cell, i * 5 + idx))
			);
			cols.push(
				[grid[i], grid[i + 5], grid[i + 10], grid[i + 15], grid[i + 20]].every((cell, idx) =>
					isCellChecked(cell, [i, i + 5, i + 10, i + 15, i + 20][idx])
				)
			);
			diag1.push(isCellChecked(grid[i * 6], i * 6));
			diag2.push(isCellChecked(grid[i * 4 + 4], i * 4 + 4));
		}

		if (
			rows.some((r) => r) ||
			cols.some((c) => c) ||
			diag1.every((d) => d) ||
			diag2.every((d) => d)
		) {
			winner = true;
		}
	}

	$: if (winner && bingoButtonRef) {
		gsap.fromTo(
			bingoButtonRef,
			{ opacity: 0, scale: 0.8 },
			{ opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
		);
	}

	function createConfetti() {
		const container = document.createElement('div');
		container.style.cssText =
			'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
		document.body.appendChild(container);

		const colors = [
			'#ff6b6b',
			'#4ecdc4',
			'#45b7d1',
			'#96ceb4',
			'#ffeaa7',
			'#feca57',
			'#ff9ff3',
			'#54a0ff'
		];

		const createParticle = () => {
			const particle = document.createElement('div');
			const size = Math.random() * 8 + 4;
			const color = colors[Math.floor(Math.random() * colors.length)];
			const startX = Math.random() * window.innerWidth;
			const startY = -20;

			particle.style.cssText = `
				position:absolute;
				width:${size}px;
				height:${size}px;
				background:${color};
				border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
				left:${startX}px;
				top:${startY}px;
			`;

			container.appendChild(particle);

			gsap.to(particle, {
				y: '+=110vh',
				x: `+=${(Math.random() - 0.5) * 200}px`,
				rotation: Math.random() * 720 - 360,
				opacity: 0,
				duration: Math.random() * 2 + 2,
				ease: 'power1.out',
				onComplete: () => particle.remove()
			});
		};

		const interval = setInterval(() => {
			for (let i = 0; i < 10; i++) {
				createParticle();
			}
		}, 100);

		setTimeout(() => {
			clearInterval(interval);
			container.remove();
		}, 2000);
	}

	async function reset() {
		createConfetti();

		const roomId = localStorage.getItem('bingo_room_id');
		const playerId = localStorage.getItem('bingo_player_id');

		if (roomId && playerId) {
			const { error } = await supabase
				.from('rooms')
				.update({ status: 'waiting', winner_id: playerId })
				.eq('id', roomId);

			if (error) {
				console.error('Erreur lors de la fin de partie:', error);
			}
		}

		setTimeout(() => {
			goto(resolve('/salon'));
		}, 2000);
	}
</script>

<div
	class="relative min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100"
>
	<main class="flex flex-col items-center p-4 pt-20 pb-20">
		<div class="w-full max-w-md space-y-8">
			<div class="text-center">
				<h2 class="text-xs font-black tracking-[0.3em] text-indigo-600 uppercase">
					Partie en cours
				</h2>
				<div class="mx-auto mt-2 h-1 w-12 rounded-full bg-indigo-600"></div>
			</div>

			<div
				class="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50"
			>
				<div class="grid grid-cols-5 gap-1.5 md:gap-3">
					{#each grid as cell, index (cell.id)}
						{@const isChecked = isCellChecked(cell, index)}
						{@const isCenter = $useStar && isCenterCell(index)}

						<button
							bind:this={cellRefs[index]}
							onclick={() => !isCenter && toggleCell(index)}
							disabled={isCenter}
							class="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border p-1 font-black transition-all
                                {isCenter || isChecked
								? 'scale-[0.98] border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200'
								: 'border-slate-100 bg-slate-50 text-slate-400 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 hover:shadow-md active:scale-95 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:bg-slate-600 dark:hover:text-indigo-400'}
                                {isCenter ? 'cursor-not-allowed opacity-100' : ''}"
						>
							{#if isCenter}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="size-5 md:size-8"
								>
									<path
										fill-rule="evenodd"
										d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
										clip-rule="evenodd"
									/>
								</svg>
							{:else}
								<span
									class="w-full text-center leading-tight wrap-break-word hyphens-auto"
									style="font-size: clamp(0.4rem, 2.5vw, 0.7rem); word-break: break-word; overflow-wrap: anywhere;"
								>
									{cell.text}
								</span>
							{/if}

							{#if isChecked && !isCenter}
								<div class="absolute top-1 right-1 size-1.5 rounded-full bg-white/50"></div>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<div class="relative pt-4">
				<button
					bind:this={bingoButtonRef}
					onclick={reset}
					disabled={!winner}
					class="group relative w-full overflow-hidden rounded-3xl py-6 text-2xl font-black tracking-tighter transition-all active:scale-95
         			{winner
						? 'cursor-pointer bg-yellow-500 text-white shadow-2xl shadow-yellow-200 hover:bg-yellow-400 dark:shadow-yellow-900/50'
						: 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}"
				>
					<span
						class="relative z-10 flex items-center justify-center gap-3
        				{winner ? 'animate-bounce' : ''}"
					>
						BINGO
					</span>

					{#if winner}
						<div
							class="absolute inset-0 bg-[radial-gradient(circle,white_10%,transparent_10%)] bg-size-[10px_10px] opacity-20"
						></div>
					{/if}
				</button>
			</div>
		</div>
	</main>
</div>
