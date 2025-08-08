import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: {
    name: string;
  };
  publishedAt: string;
  content: string;
}

interface TransformedArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  image_url: string;
  source: string;
  category: string;
  language: string;
  published_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    if (!newsApiKey) {
      console.error('NEWS_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching news from NewsAPI...');

    // Fetch from NewsAPI
    const newsApiUrl = `https://newsapi.org/v2/everything?q=technology OR sports&language=en&sortBy=publishedAt&apiKey=${newsApiKey}`;
    
    const response = await fetch(newsApiUrl);
    
    if (!response.ok) {
      console.error('NewsAPI request failed:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch news' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (data.status !== 'ok') {
      console.error('NewsAPI returned error:', data);
      return new Response(
        JSON.stringify({ error: data.message || 'NewsAPI error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetched ${data.articles.length} articles from NewsAPI`);

    // Transform articles to match our interface
    const transformedArticles: TransformedArticle[] = data.articles
      .filter((article: NewsAPIArticle) => 
        article.title && 
        article.description && 
        article.url && 
        article.title !== '[Removed]'
      )
      .map((article: NewsAPIArticle) => ({
        id: btoa(article.url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20),
        title: article.title,
        summary: article.description || article.title,
        content: article.content || article.description || '',
        url: article.url,
        image_url: article.urlToImage || '',
        source: article.source.name,
        category: article.title.toLowerCase().includes('sport') ? 'sports' : 'technology',
        language: 'en',
        published_at: article.publishedAt
      }));

    console.log(`Transformed ${transformedArticles.length} articles`);

    return new Response(
      JSON.stringify({ 
        articles: transformedArticles,
        total: transformedArticles.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});