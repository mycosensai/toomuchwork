import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: "2ad733f9d698170c202b12924868c60e",
    databaseId: "375949ce-7c7d-4822-8235-461446769258",
    token: process.env.CLOUDFLARE_API_TOKEN || "",
  },
});
