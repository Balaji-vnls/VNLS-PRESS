import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import NewsCard from './NewsCard';
import NewsFilters from './NewsFilters';
import ArticleCardSkeleton from '@/components/ui/ArticleCardSkeleton';
import { Loader2, Newspaper, Sparkles, TrendingUp } from 'lucide-react';

interface NewsArticle {
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

interface Category {
  name: string;
  slug: string;
}

interface Source {
  name: string;
}

interface NewsFeedProps {
  searchQuery?: string;
  filtersVisible: boolean;
  onToggleFilters: () => void;
}

const NewsFeed = ({ searchQuery = '', filtersVisible, onToggleFilters }: NewsFeedProps) => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [recommendations, setRecommendations] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    source: '',
    language: '',
    dateRange: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [filters, searchQuery]);

  const fetchInitialData = async () => {
    try {
      const [categoriesResponse, sourcesResponse] = await Promise.all([
        supabase.from('categories').select('name, slug').order('name'),
        supabase.from('news_sources').select('name').order('name')
      ]);

      if (categoriesResponse.data) setCategories(categoriesResponse.data);
      if (sourcesResponse.data) setSources(sourcesResponse.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news');
      
      if (error) throw error;
      
      let fetchedArticles = data.articles || [];
      
      // Apply search filter
      if (searchQuery) {
        fetchedArticles = fetchedArticles.filter((article: NewsArticle) => 
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.source.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply other filters
      if (filters.category) {
        fetchedArticles = fetchedArticles.filter((article: NewsArticle) => 
          article.category === filters.category
        );
      }
      if (filters.source) {
        fetchedArticles = fetchedArticles.filter((article: NewsArticle) => 
          article.source.toLowerCase().includes(filters.source.toLowerCase())
        );
      }
      if (filters.language) {
        fetchedArticles = fetchedArticles.filter((article: NewsArticle) => 
          article.language === filters.language
        );
      }
      if (filters.dateRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        fetchedArticles = fetchedArticles.filter((article: NewsArticle) => 
          new Date(article.published_at) >= startDate
        );
      }

      setArticles(fetchedArticles.slice(0, 20));
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch latest news articles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!user) return;
    
    setLoadingRecommendations(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations');
      
      if (error) throw error;
      
      setRecommendations(data.recommendations || []);
      toast({
        title: "Recommendations Generated",
        description: `Found ${data.recommendations?.length || 0} personalized articles for you!`
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations",
        variant: "destructive"
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  if (loading && articles.length === 0) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted rounded shimmer" />
          <div className="h-4 w-96 bg-muted rounded shimmer" />
        </div>
        
        {/* Articles Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const currentArticles = showRecommendations ? recommendations : articles;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {showRecommendations ? 'AI Recommendations' : 'Latest News'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {showRecommendations 
                ? 'Personalized articles based on your reading patterns' 
                : 'Stay updated with the latest technology and sports news'
              }
            </p>
          </div>
          
          {/* View Toggle Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={showRecommendations ? "outline" : "default"}
              onClick={() => setShowRecommendations(false)}
              className="transition-all duration-200"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Latest
            </Button>
            <Button
              variant={showRecommendations ? "default" : "outline"}
              onClick={() => {
                setShowRecommendations(true);
                if (recommendations.length === 0) {
                  fetchRecommendations();
                }
              }}
              disabled={loadingRecommendations || !user}
              className="transition-all duration-200"
            >
              {loadingRecommendations ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              AI Picks
            </Button>
          </div>
        </div>

        {/* Filters */}
        {filtersVisible && (
          <div className="animate-slide-in">
            <NewsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              categories={categories}
              sources={sources}
            />
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && currentArticles.length > 0 && (
        <div className="text-sm text-muted-foreground animate-fade-in">
          Showing {currentArticles.length} articles
          {searchQuery && (
            <span> for "{searchQuery}"</span>
          )}
        </div>
      )}

      {/* Empty States */}
      {showRecommendations && recommendations.length === 0 && !loadingRecommendations && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start reading articles to help our AI learn your preferences and generate personalized recommendations!
          </p>
        </div>
      )}

      {currentArticles.length === 0 && !showRecommendations && !loading && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Newspaper className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Articles Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchQuery 
              ? `No articles found matching "${searchQuery}". Try adjusting your search or filters.`
              : "Try adjusting your filters or check back later for new content."
            }
          </p>
        </div>
      )}

      {/* Articles Grid */}
      {currentArticles.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-up">
          {currentArticles.map((article, index) => (
            <div
              key={article.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-fade-up"
            >
              <NewsCard article={article} />
            </div>
          ))}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && articles.length > 0 && (
        <div className="flex items-center justify-center py-8 animate-fade-in">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
          <span className="text-sm text-muted-foreground">Loading more articles...</span>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;