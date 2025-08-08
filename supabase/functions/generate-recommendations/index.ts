import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserActivity {
  article_id: string;
  activity_type: string;
  dwell_time: number;
  metadata: {
    article_category: string;
    article_source: string;
  };
}

interface Article {
  id: string;
  title: string;
  category: string;
  source: string;
  published_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    
    // Set the auth context for the client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Generating recommendations for user:', user.id)

    // Get user activities from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activities, error: activitiesError } = await supabaseClient
      .from('user_activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user activities' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Analyze user preferences
    const categoryPreferences = new Map<string, number>()
    const sourcePreferences = new Map<string, number>()
    
    for (const activity of activities as UserActivity[]) {
      const category = activity.metadata.article_category
      const source = activity.metadata.article_source
      
      // Weight different activities
      let weight = 1
      if (activity.activity_type === 'click') weight = 3
      else if (activity.activity_type === 'bookmark') weight = 5
      else if (activity.activity_type === 'dwell' && activity.dwell_time > 30) weight = 2
      
      // Update category preferences
      categoryPreferences.set(category, (categoryPreferences.get(category) || 0) + weight)
      
      // Update source preferences
      sourcePreferences.set(source, (sourcePreferences.get(source) || 0) + weight)
    }

    // Get top categories and sources
    const topCategories = Array.from(categoryPreferences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)

    const topSources = Array.from(sourcePreferences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([source]) => source)

    console.log('Top categories:', topCategories)
    console.log('Top sources:', topSources)

    // Get recent articles that user hasn't interacted with
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentArticles, error: articlesError } = await supabaseClient
      .from('news_articles')
      .select('*')
      .gte('published_at', sevenDaysAgo.toISOString())
      .order('published_at', { ascending: false })
      .limit(100)

    if (articlesError) {
      console.error('Error fetching articles:', articlesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch articles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get articles user has already interacted with
    const { data: interactedArticles } = await supabaseClient
      .from('user_activities')
      .select('article_id')
      .eq('user_id', user.id)

    const interactedIds = new Set(interactedArticles?.map(a => a.article_id) || [])

    // Score and filter articles
    const scoredArticles = (recentArticles as Article[])
      .filter(article => !interactedIds.has(article.id))
      .map(article => {
        let score = 0
        
        // Category preference score
        const categoryIndex = topCategories.indexOf(article.category)
        if (categoryIndex !== -1) {
          score += (3 - categoryIndex) * 10 // 30, 20, 10 points
        }
        
        // Source preference score
        const sourceIndex = topSources.indexOf(article.source)
        if (sourceIndex !== -1) {
          score += (3 - sourceIndex) * 5 // 15, 10, 5 points
        }
        
        // Recency score (newer articles get higher scores)
        const ageHours = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60)
        score += Math.max(0, 24 - ageHours) // Up to 24 points for very recent articles
        
        return { ...article, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20) // Top 20 recommendations

    console.log(`Generated ${scoredArticles.length} recommendations for user ${user.id}`)

    return new Response(
      JSON.stringify({ 
        recommendations: scoredArticles,
        user_preferences: {
          top_categories: topCategories,
          top_sources: topSources
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-recommendations:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})