import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

interface NewsCardProps {
  article: NewsArticle;
}

const NewsCard = ({ article }: NewsCardProps) => {
  const { user } = useAuth();
  const [dwellStartTime, setDwellStartTime] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Track view when component mounts
  useEffect(() => {
    if (user) {
      trackActivity('view');
      setDwellStartTime(Date.now());
    }
    return () => {
      // Track dwell time when component unmounts
      if (dwellStartTime && user) {
        const dwellTime = Math.round((Date.now() - dwellStartTime) / 1000);
        if (dwellTime > 2) {
          trackActivity('dwell', dwellTime);
        }
      }
    };
  }, [user]);

  const trackActivity = async (activityType: string, dwellTime?: number) => {
    if (!user) return;

    try {
      await supabase.from('user_activities').insert({
        user_id: user.id,
        article_id: article.id,
        activity_type: activityType,
        dwell_time: dwellTime || 0,
        metadata: {
          article_title: article.title,
          article_category: article.category,
          article_source: article.source
        }
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  const handleClick = async () => {
    if (user) {
      await trackActivity('click');
    }
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      if (isBookmarked) {
        await supabase
          .from('user_activities')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', article.id)
          .eq('activity_type', 'bookmark');
        setIsBookmarked(false);
        toast({ title: "Bookmark removed" });
      } else {
        await trackActivity('bookmark');
        setIsBookmarked(true);
        toast({ title: "Article bookmarked" });
      }
    } catch (error) {
      console.error('Error handling bookmark:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update bookmark",
        variant: "destructive" 
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      technology: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      sports: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      politics: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      business: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      health: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      science: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      entertainment: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      world: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return colors[category] || colors.world;
  };

  return (
    <Card className="group h-full flex flex-col bg-card border-border/20 hover:border-border/40 transition-all duration-300 hover:shadow-large hover:-translate-y-1 overflow-hidden animate-fade-up">
      {/* Image Section */}
      <div className="relative overflow-hidden">
        {article.image_url && !imageError ? (
          <div className="w-full h-48 overflow-hidden bg-muted">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
            <div className="text-4xl font-bold text-muted-foreground/30">
              {article.source.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        
        {/* Floating Bookmark Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBookmark}
          className="absolute top-3 right-3 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border-border/20 hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-4 w-4 text-accent" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content Section */}
      <CardContent className="flex-1 flex flex-col p-6 space-y-4">
        {/* Category Badge */}
        <Badge className={`${getCategoryColor(article.category)} w-fit text-xs font-medium px-2 py-1`}>
          {article.category}
        </Badge>

        {/* Title */}
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {article.title}
        </h3>

        {/* Summary */}
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">
          {article.summary}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/10 pt-4">
          <span className="font-medium text-foreground/80 truncate max-w-[120px]">
            {article.source}
          </span>
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Read More Button */}
        <Button
          onClick={handleClick}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 group/btn"
        >
          <ExternalLink className="h-4 w-4 mr-2 group-hover/btn:translate-x-0.5 transition-transform" />
          Read Article
        </Button>
      </CardContent>
    </Card>
  );
};

export default NewsCard;