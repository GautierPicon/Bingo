![header](.github/readme-header.png)

# Bingo [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/GautierPicon/Bingo/blob/main/LICENSE.md)

Make your events more fun

## Features

- Create a room / Join a room
- Synchronised play between players
- Personalise the bingo squares
- customise your game: free centre square and/or mixed grid for each player
- PWA available: Open the Website > Android: Tap the three-dot menu then "Install App" or "Add to Home Screen" / iOS with safari: Tap the Share icon > "Add to Home Screen" > The app icon will appear on your home screen. Tap it to open the PWA like a native app

## Tech Stack

**Client:**

- Tech: [Sveltekit](https://svelte.dev/docs/kit/) [(Svelte)](https://svelte.dev/)
- Library: [TailwindCSS](https://tailwindcss.com/), [GSAP](https://gsap.com/), [eslint](https://eslint.org/), [prettier](https://prettier.io/)
- Icons: [Heroicons](https://heroicons.com/)

**Server:**

- [Supabase](https://supabase.com/)

## Feedback

Feedback are welcome! Feel free to open an [issue](https://github.com/GautierPicon/Bingo/issues) or a [pull request](https://github.com/GautierPicon/Bingo/pulls) on the GitHub repository.

## Contribute / Run Locally

You will need to have [Bun](https://bun.sh/) installed.

Clone the project

```bash
git clone https://github.com/GautierPicon/Bingo
```

Go to the project directory

```bash
cd bingo
```

Install dependencies

```bash
bun install
```

Start the server

```bash
bun run dev
```

### Supabase setup:

Add a .env.local file based on this template and replace the variables with your own

```bash
  PUBLIC_SUPABASE_URL=https://***.supabase.co
  PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_***
```

In SQL Editor, create this query and run it

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  use_star BOOLEAN DEFAULT false,
  status VARCHAR DEFAULT 'waiting',
  winner_id UUID
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  is_host BOOLEAN DEFAULT false,
  profile_picture VARCHAR,
  joined_at TIMESTAMP DEFAULT NOW()
);

-- Grids table
CREATE TABLE grids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  cells JSONB NOT NULL
);

-- Add winner foreign key
ALTER TABLE rooms ADD CONSTRAINT fk_winner FOREIGN KEY (winner_id) REFERENCES players(id) ON DELETE SET NULL;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE grids;
```
