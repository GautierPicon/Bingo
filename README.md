# Bingo [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/Gautierpicon/Bingo/blob/main/LICENSE.md)

Make your events more fun

## Features

- Create a room / Join a room
- Synchronised play between players
- Personalise the bingo squares
- customise your game: free centre square and/or mixed grid for each player
- PWA available

## Tech Stack

**Client:** sveltekit (svelte), TailwindCSS, GSAP, eslint, prettier

**Server:** Supabase

## Feedback

Feedback are welcome! Feel free to open an [issue](https://github.com/Gautierpicon/Bingo/issues) or a [pull request](https://github.com/Gautierpicon/Bingo/pulls) on the GitHub repository.

## Contribute / Run Locally

You will need to have [Bun](https://bun.sh/) installed.

Clone the project

```bash
  git clone https://github.com/Gautierpicon/Bingo
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

```SQl
-- TABLE: rooms
create table rooms (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  name text not null,
  use_star boolean default false,
  host_id uuid,

  -- Ajouter le champ winner_id
  winner_id uuid references players(id),

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'waiting'
    check (status in ('waiting', 'playing'))
);

-- TABLE: players
create table players (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade,
  name text not null,
  is_host boolean default false,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLE: grids
create table grids (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references players(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  cells jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INDEXES
create index idx_players_room_id on players(room_id);
create index idx_grids_player_id on grids(player_id);
create index idx_grids_room_id on grids(room_id);
create index idx_rooms_code on rooms(code);

-- REALTIME (Supabase)
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table grids;
```
