<script>
	import { useStar } from './store';

	let grid = Array.from({ length: 25 }, (_, i) => ({
		id: i + 1,
		checked: false
	}));

	function toggleCell(index) {
		grid[index].checked = !grid[index].checked;
		grid = [...grid];
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

	function reset() {
		grid = grid.map((cell) => ({ ...cell, checked: false }));
		winner = false;
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
	<div class="grid w-full max-w-md grid-cols-5 border-2 border-gray-400">
		{#each grid as cell, index}
			<button
				onclick={() => !($useStar && isCenterCell(index)) && toggleCell(index)}
				disabled={$useStar && isCenterCell(index)}
				class="aspect-square border border-gray-300 text-xl font-bold transition-all md:text-2xl
          {isCellChecked(cell, index)
					? 'bg-green-500 text-white'
					: 'bg-white text-gray-800 hover:bg-gray-100'}
          {$useStar && isCenterCell(index) ? 'cursor-not-allowed' : ''}"
			>
				{#if $useStar && isCenterCell(index)}
					⭐
				{:else}
					{cell.id}
				{/if}
			</button>
		{/each}
	</div>

	<button
		onclick={reset}
		disabled={!winner}
		class="w-full max-w-md px-8 py-3 text-white transition-all
      {winner
			? 'cursor-pointer bg-green-500 hover:bg-green-600'
			: 'cursor-not-allowed bg-gray-300'}"
	>
		Bingo
	</button>
</div>
