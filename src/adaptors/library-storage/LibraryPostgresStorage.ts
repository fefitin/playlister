import pg from "pg";
import { AugmentedLibraryTrack } from "@/types/LibraryTrack";
import { LibraryStorageAdaptor } from "./LibraryStorageAdaptor.interface";

type LibraryPostgresStorageConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export class LibraryPostgresStorage implements LibraryStorageAdaptor {
  private pool: pg.Pool;
  private client: pg.PoolClient | null = null;

  constructor({
    host,
    port,
    user,
    password,
    database,
  }: LibraryPostgresStorageConfig) {
    this.pool = new pg.Pool({
      host,
      port: port || 5432,
      user,
      password,
      database,
    });
  }

  /**
   * Connects to the Postgres database
   * @returns Connected database client
   */
  async connect() {
    if (!this.client) {
      this.client = await this.pool.connect();
    }

    return this.client;
  }

  /**
   * Checks if a track exists in the database
   * @param platformTrackId ID of the track to check
   * @returns True if track exists, false otherwise
   */
  async trackExists(platformTrackId: string) {
    if (!this.client) {
      throw new Error("LibraryPostgresStorage not connected");
    }

    const songQuery = `
      SELECT id
      FROM tracks
      WHERE platform_track_id = $1
      LIMIT 1
    `;
    const songResult = await this.client.query(songQuery, [platformTrackId]);

    return songResult.rows.length > 0;
  }

  /**
   * Stores a track in the database
   * @param track Track to store
   * @throws Error if track can't be stored
   */
  async storeTrack(track: AugmentedLibraryTrack) {
    if (!this.client) {
      throw new Error("LibraryPostgresStorage not connected");
    }

    const insertQuery = `
      INSERT INTO tracks (platform_track_id, title, artist, album, total_time, year, genre, location, themes, keywords, mood, bpm, tempo, style)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;

    const result = await this.client.query(insertQuery, [
      track.platformTrackId,
      track.title,
      track.artist,
      track.album,
      track.totalTime,
      track.year,
      track.genre,
      track.location,
      track.themes,
      track.keywords,
      track.mood,
      track.bpm,
      track.tempo,
      track.style,
    ]);
    if (result.rowCount === 0) {
      throw new Error("Failed to store track");
    }
  }

  /**
   * Retrieves all tracks from the database
   * @returns Array of AugmentedLibraryTrack objects
   * @throws Error if storage is not connected
   */
  async getTracks() {
    if (!this.client) {
      throw new Error("LibraryPostgresStorage not connected");
    }

    const query = `
      SELECT * FROM tracks
    `;
    const result = await this.client.query(query);
    return result.rows.map(this.toAugmentedLibraryTrack);
  }

  /**
   * Retrieves a track from the database by platform ID
   * @param platformTrackId ID of the track to retrieve
   * @returns AugmentedLibraryTrack object
   * @throws Error if storage is not connected
   */
  async getTrackByPlatformId(platformTrackId: string) {
    if (!this.client) {
      throw new Error("LibraryPostgresStorage not connected");
    }

    const query = `
      SELECT * FROM tracks
      WHERE platform_track_id = $1
      LIMIT 1
    `;

    const result = await this.client.query(query, [platformTrackId]);
    return result.rows.length > 0
      ? this.toAugmentedLibraryTrack(result.rows[0])
      : null;
  }

  /**
   * Converts a database row to an AugmentedLibraryTrack object
   * @param row Database row to convert
   * @returns AugmentedLibraryTrack object
   */
  private toAugmentedLibraryTrack(
    row: Record<string, any>
  ): AugmentedLibraryTrack {
    return {
      platformTrackId: row.platform_track_id,
      title: row.title,
      artist: row.artist,
      album: row.album,
      totalTime: row.total_time,
      year: row.year,
      genre: row.genre,
      location: row.location,
      themes: row.themes,
      keywords: row.keywords,
      mood: row.mood,
      bpm: row.bpm,
      tempo: row.tempo,
      style: row.style,
    };
  }
}
