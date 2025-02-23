import { LibraryPostgresStorage } from "@/adaptors/library-storage/LibraryPostgresStorage";

export const storage = new LibraryPostgresStorage({
  host: String(process.env.DB_HOST),
  port: Number(process.env.DB_PORT),
  user: String(process.env.DB_USER),
  password: String(process.env.DB_PASSWORD),
  database: String(process.env.DB_NAME),
});
