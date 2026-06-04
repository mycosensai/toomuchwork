/**
 * Vercel Serverless Function Entry Point
 * Imports the Hono app from src/server and exports it as the handler
 */

import app from "../src/server/boot";

// Hono's fetch handler works directly as a Vercel serverless function
export default app;
