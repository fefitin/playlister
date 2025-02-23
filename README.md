# Playlist Generator

This tool can be used to generate playlists in Apple Music using AI.

## Requirements

- Node v20
- pnpm
- Postgres
- [ChromaDB](https://searxng.org/)
- [SearxNg](https://searxng.org/)

This tool was tested on macOS Sequoia with Apple Music 1.5.2.56.

## Installation

Set values for all the environment variables defined in `.env.example`.
You can duplicate it, save it as `.env` and set all the values there.

To install dependencies, run:

```bash
pnpm i
```

To make the command available run:

```bash
npm link
```

### Postgres Setup

This tool uses a single `tracks` table to store your library. You can create the schema with the following SQL code:

```sql
CREATE SEQUENCE IF NOT EXISTS tracks_id_seq;

CREATE TABLE "public"."tracks" (
    "id" int4 NOT NULL DEFAULT nextval('tracks_id_seq'::regclass),
    "platform_track_id" varchar NOT NULL,
    "title" varchar NOT NULL,
    "artist" varchar NOT NULL,
    "album" varchar NOT NULL,
    "total_time" float4,
    "year" int4,
    "genre" varchar,
    "location" varchar,
    "themes" varchar,
    "keywords" varchar,
    "mood" varchar,
    "bpm" varchar,
    "tempo" varchar,
    "style" varchar,
    PRIMARY KEY ("id")
);
```

### Models

This tool was tested with:

- `bge-m3` running locally with Ollama for embeddings.
- `claude-3-5-sonnet` by Anthropic for playlist generation.

It's using Langchain under the hood so you should be able to switch models easily.

## How to use

You can run the tool with the following command:

```bash
playlister
```

### Import library

You must first download your Apple Music library in XML format using File > Library > Export Library.

Run the tool, select the `Import Library` option and enter the path to the XML file.

Your library will be processed and every track with be augmented with additional information retrieved from the Internet (style, tempo, etc.).

All your augmented tracks will be indexed in your Postgres database and embedded in your Chroma DB.

### Generate playlist

You can generate a playlist based on a specific prompt. You can describe a mood, an event or anything else you want.

The tool will go through your library, pick twenty songs and create the playlist in Apple Music.

The process is not deterministic, so you can get different playlists by running the same prompt multiple times.
