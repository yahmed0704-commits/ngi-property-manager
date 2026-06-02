/**
 * Google Sheets Integration — PLACEHOLDER (V2 backend)
 *
 * This folder is intentionally empty until the secure API server is ready.
 *
 * HOW IT WILL WORK (do NOT implement this inside the Expo/mobile app):
 *
 *   1. The NGI API server (Node.js / Express) holds the Google service account
 *      JSON key as a server-side environment variable — never in this repo.
 *
 *   2. The mobile app sends authenticated API requests to:
 *        POST /api/properties       → writes a row to the "Properties" sheet
 *        POST /api/expenses         → writes a row to the "Expenses" sheet
 *        GET  /api/properties       → reads all rows from the "Properties" sheet
 *        etc.
 *
 *   3. The API server:
 *        - Validates the user's JWT / role before any write
 *        - Uses googleapis / google-auth-library to talk to Sheets
 *        - Returns clean JSON to the mobile app
 *
 *   4. Receipt / photo uploads:
 *        - Mobile app uploads to POST /api/uploads
 *        - API server stores to Replit Object Storage (or S3)
 *        - URL is then written into the Sheets row
 *
 * SECURITY RULES:
 *   - Google service account key → server env var only
 *   - Spreadsheet ID           → server env var only
 *   - Mobile app never touches the Sheets API directly
 *   - All writes validated by role (Admin/Partner can write; Viewer/Contractor read-only)
 *
 * FILES TO CREATE WHEN READY:
 *   artifacts/api-server/src/services/sheetsClient.ts  — googleapis wrapper
 *   artifacts/api-server/src/routes/properties.ts       — CRUD routes
 *   artifacts/api-server/src/middleware/auth.ts          — JWT validation
 */

export {};
