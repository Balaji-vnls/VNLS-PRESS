-- Create news articles table
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  url TEXT,
  image_url TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table for better filtering
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Technology', 'technology', 'Latest tech news and innovations'),
  ('Sports', 'sports', 'Sports news and updates'),
  ('Politics', 'politics', 'Political news and analysis'),
  ('Business', 'business', 'Business and financial news'),
  ('Health', 'health', 'Health and medical news'),
  ('Science', 'science', 'Scientific discoveries and research'),
  ('Entertainment', 'entertainment', 'Entertainment and celebrity news'),
  ('World', 'world', 'International news and events');

-- Create news sources table
CREATE TABLE public.news_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert some default news sources
INSERT INTO public.news_sources (name, domain, description) VALUES
  ('TechCrunch', 'techcrunch.com', 'Technology startup news'),
  ('BBC News', 'bbc.com', 'British Broadcasting Corporation'),
  ('CNN', 'cnn.com', 'Cable News Network'),
  ('Reuters', 'reuters.com', 'International news agency'),
  ('Associated Press', 'ap.org', 'American news agency'),
  ('The Guardian', 'theguardian.com', 'British daily newspaper');

-- Enable Row Level Security on news tables
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for news articles (public read access)
CREATE POLICY "News articles are viewable by everyone" 
ON public.news_articles 
FOR SELECT 
USING (true);

-- Create policies for categories (public read access)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

-- Create policies for news sources (public read access)
CREATE POLICY "News sources are viewable by everyone" 
ON public.news_sources 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates on news articles
CREATE TRIGGER update_news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_news_articles_category ON public.news_articles(category);
CREATE INDEX idx_news_articles_source ON public.news_articles(source);
CREATE INDEX idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_articles_language ON public.news_articles(language);
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_article_id ON public.user_activities(article_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at DESC);

-- Insert some sample news articles for testing
INSERT INTO public.news_articles (title, content, summary, url, source, category, language, published_at) VALUES
  (
    'AI Revolution in Healthcare: New Breakthrough in Medical Diagnosis',
    'Artificial intelligence is transforming healthcare with new diagnostic tools that can detect diseases earlier and more accurately than traditional methods.',
    'AI breakthrough improves medical diagnosis accuracy and speed.',
    'https://example.com/ai-healthcare',
    'TechCrunch',
    'technology',
    'en',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'Climate Change Summit Reaches Historic Agreement',
    'World leaders gather to discuss unprecedented climate action plans and commit to carbon neutrality goals.',
    'Historic climate agreement reached at international summit.',
    'https://example.com/climate-summit',
    'Reuters',
    'world',
    'en',
    NOW() - INTERVAL '4 hours'
  ),
  (
    'Tech Giants Report Strong Q4 Earnings',
    'Major technology companies exceed market expectations with robust quarterly earnings driven by cloud services and AI investments.',
    'Tech companies show strong Q4 performance.',
    'https://example.com/tech-earnings',
    'CNN',
    'business',
    'en',
    NOW() - INTERVAL '6 hours'
  ),
  (
    'Olympic Training Revolution: Athletes Use VR Technology',
    'Virtual reality technology is being adopted by Olympic athletes to enhance training and performance preparation.',
    'VR technology transforms Olympic training methods.',
    'https://example.com/vr-olympics',
    'BBC News',
    'sports',
    'en',
    NOW() - INTERVAL '8 hours'
  ),
  (
    'New Study Reveals Benefits of Mediterranean Diet',
    'Long-term research shows significant health benefits from following a Mediterranean diet pattern.',
    'Mediterranean diet study shows health benefits.',
    'https://example.com/mediterranean-diet',
    'The Guardian',
    'health',
    'en',
    NOW() - INTERVAL '12 hours'
  );