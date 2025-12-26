<script>
	import { useStar } from '../store';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
	<h1 class="text-3xl font-bold">Paramètres</h1>

	<label class="flex cursor-pointer items-center gap-4">
		<input type="checkbox" bind:checked={$useStar} class="h-6 w-6" />
		<span class="text-xl">Activer la case étoile au centre</span>
	</label>

	<p class="max-w-md text-center text-gray-600">
		La case étoile au centre de la grille compte comme une case déjà cochée.
	</p>
</div>
