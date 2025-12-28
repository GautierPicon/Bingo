<script>
	import { onMount } from 'svelte';
	import { useStar, hasPlayedGridAnimation } from '../store';
	import gsap from 'gsap';
	import BackButton from '$lib/components/BackButton.svelte';

	let grid = Array.from({ length: 25 }, (_, i) => ({
		id: i + 1,
		checked: false
	}));

	let cellRefs = Array.from({ length: 25 }, () => null);
	let bingoButtonRef = null;
	let groupName = '';

	onMount(() => {
		groupName = localStorage.getItem('bingo_group_name') || 'Partie';

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
	});

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

		const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
		const particles = 50;

		for (let i = 0; i < particles; i++) {
			const particle = document.createElement('div');
			const size = Math.random() * 8 + 4;
			const color = colors[Math.floor(Math.random() * colors.length)];
			const startX = Math.random() * window.innerWidth;
			const startY = Math.random() * window.innerHeight * 0.5;

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
				y: '+=100vh',
				x: `+=${(Math.random() - 0.5) * 200}px`,
				rotation: Math.random() * 720 - 360,
				opacity: 0,
				duration: Math.random() * 2 + 2,
				ease: 'power1.out',
				onComplete: () => particle.remove()
			});
		}

		setTimeout(() => container.remove(), 4000);
	}

	function reset() {
		createConfetti();
		grid = grid.map((cell) => ({ ...cell, checked: false }));
		winner = false;

		gsap.fromTo(
			cellRefs.filter((ref) => ref !== null),
			{ scale: 1 },
			{ scale: 0.95, duration: 0.2, yoyo: true, repeat: 1, ease: 'power1.inOut' }
		);
	}
</script>

<div
	class="flex min-h-screen flex-col items-center overflow-y-auto bg-linear-to-br from-purple-500 via-pink-500 to-orange-400 p-4 pt-20"
>
	<BackButton />

	<div class="flex w-full max-w-md flex-col justify-center gap-6 py-6">
		<div class="text-center">
			<p class="text-lg font-medium text-white opacity-90">{groupName}</p>
		</div>

		<div class="grid w-full grid-cols-5 border-4 border-white bg-white/90 shadow-2xl">
			{#each grid as cell, index (cell.id)}
				<button
					bind:this={cellRefs[index]}
					onclick={() => !($useStar && isCenterCell(index)) && toggleCell(index)}
					disabled={$useStar && isCenterCell(index)}
					class="flex aspect-square cursor-pointer items-center justify-center border-2 border-gray-300 text-xl font-bold transition-all md:text-2xl
          {isCellChecked(cell, index)
						? 'bg-green-500 text-white shadow-lg'
						: 'bg-white text-gray-800 hover:bg-gray-100'}
          {$useStar && isCenterCell(index) ? 'cursor-not-allowed' : ''}"
				>
					{#if $useStar && isCenterCell(index)}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class="size-6 text-black"
						>
							<path
								fill-rule="evenodd"
								d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else}
						{cell.id}
					{/if}
				</button>
			{/each}
		</div>

		<button
			bind:this={bingoButtonRef}
			onclick={reset}
			disabled={!winner}
			class="w-full max-w-md transform rounded-3xl border-4 border-white px-8 py-4 text-2xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.3)] transition-all
      {winner
				? 'animate-bounce cursor-pointer bg-linear-to-r from-green-400 to-green-600 hover:scale-110 hover:shadow-[0_16px_0_rgba(0,0,0,0.5)]'
				: 'cursor-not-allowed bg-gray-400'}"
		>
			BINGO ! 🎉
		</button>
	</div>
</div>
