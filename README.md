# SLV Press - AI-Powered News (Lovable removed)

This project has been cleaned of Lovable.dev dependencies and prepared for local development.

## Changes made
- Removed references to `lovable-tagger` from `vite.config.ts`.
- Replaced `index.html` with SLV Press branding.
- Added a Supabase Edge Function scaffold at `supabase/functions/bert_search/index.ts`.
- Added `scripts/compute_embeddings.py` to generate and upsert BERT embeddings to Supabase.
- SearchBar now calls backend BERT search endpoint via `VITE_BERT_SEARCH_URL` env var.

## Local dev
1. Use Node 18+
2. Install frontend deps:
   ```bash
   npm install
   npm run dev
   ```
3. To enable BERT-based search:
   - Deploy the Supabase function `supabase/functions/bert_search` or replace with your own endpoint.
   - Precompute article embeddings using `scripts/compute_embeddings.py` and upload to Supabase.

