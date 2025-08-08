
/**
 * supabase/functions/bert_search/index.ts
 *
 * Fully implemented Deno Edge Function for semantic search using embeddings.
 * - Generates embeddings for the user's query via OpenAI Embeddings API (configurable).
 * - Uses a Supabase RPC 'match_news' (pgvector) for efficient vector search if available.
 * - Falls back to in-memory cosine similarity if RPC isn't present or fails.
 *
 * Required environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (server-side key with SQL privileges)
 * - OPENAI_API_KEY (or set EMBEDDING_API and EMBEDDING_MODEL to use other providers)
 *
 * Important setup (run once in your Supabase SQL editor):
 *
 * -- Enable pgvector on your database (if not already)
 * create extension if not exists vector;
 *
 * -- Ensure news_articles has an embedding column
 * alter table if exists news_articles
 *   add column if not exists embedding vector(1536); -- adjust dimensionality to your embedding model
 *
 * -- Create an RPC function for vector search (uses pgvector '<=>' distance)
 * create or replace function match_news(query_embedding vector, match_count int)
 * returns table(id uuid, title text, url text, category text, source text, published_at timestamptz, similarity float)
 * language sql as $$
 *   select id, title, url, category, source, published_at, 1 - (embedding <=> query_embedding) as similarity
 *   from news_articles
 *   order by embedding <=> query_embedding
 *   limit match_count;
 * $$;
 *
 * Adjust vector dimensionality, table/column names to match your schema.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cosineSimilarity } from 'https://esm.sh/simple-statistics@7.8.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}

interface RequestBody {
  query?: string;
  top_k?: number;
}

async function getOpenAIEmbedding(text: string, model = 'text-embedding-3-small') {
  const apiKey = Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('EMBEDDING_API_KEY')
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY (or EMBEDDING_API_KEY) in env')

  const url = 'https://api.openai.com/v1/embeddings'
  const payload = { input: text, model }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`OpenAI embedding request failed: ${res.status} ${txt}`)
  }

  const json = await res.json()
  // OpenAI returns embeddings in json.data[0].embedding
  return json.data[0].embedding as number[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: RequestBody = (await req.json().catch(() => ({}))) as RequestBody
    const q = (body.query || '').trim()
    const top_k = body.top_k ?? 10

    if (!q) {
      return new Response(JSON.stringify({ recommendations: [] }), { status: 200, headers: { ...corsHeaders, 'Content-Type':'application/json' } })
    }

    // 1) Create embedding for query
    const queryEmbedding = await getOpenAIEmbedding(q)

    // 2) Try RPC vector search (fast, server-side pgvector)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('match_news', {
        query_embedding: queryEmbedding,
        match_count: top_k
      })

      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        return new Response(JSON.stringify({ recommendations: rpcData }), { status: 200, headers: { ...corsHeaders, 'Content-Type':'application/json' } })
      }
    } catch (e) {
      console.warn('RPC match_news failed or not available, falling back to client-side scoring', e)
    }

    // 3) Fallback: fetch candidate articles (recent) and compute cosine similarity in-memory
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString()
    const { data: candidates, error } = await supabase
      .from('news_articles')
      .select('id, title, url, category, source, published_at, embedding')
      .gte('published_at', sevenDaysAgo)
      .limit(500)

    if (error) throw error

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), { status: 200, headers: { ...corsHeaders, 'Content-Type':'application/json' } })
    }

    // Compute cosine similarity between queryEmbedding and each article.embedding
    const scored = candidates
      .filter((a: any) => a.embedding && Array.isArray(a.embedding))
      .map((a: any) => {
        const emb = a.embedding as number[]
        let sim = 0
        try {
          sim = cosineSimilarity(queryEmbedding, emb)
        } catch (e) {
          sim = 0
        }
        return { id: a.id, title: a.title, url: a.url, category: a.category, source: a.source, published_at: a.published_at, score: sim }
      })
      .sort((x: any, y: any) => y.score - x.score)
      .slice(0, top_k)

    return new Response(JSON.stringify({ recommendations: scored }), { status: 200, headers: { ...corsHeaders, 'Content-Type':'application/json' } })

  } catch (err) {
    console.error('bert_search error', err)
    return new Response(JSON.stringify({ error: 'Internal server error', detail: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type':'application/json' } })
  }
})
