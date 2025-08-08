import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from 'next-themes';
import Navbar from '@/components/layout/Navbar';
import NewsFeed from '@/components/news/NewsFeed';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center animate-fade-in">
          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading SLV Press...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleToggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen bg-background">
        <Navbar 
          onSearch={handleSearch} 
          onToggleFilters={handleToggleFilters}
        />
        
        <main className="container mx-auto px-4 py-8">
          <NewsFeed 
            searchQuery={searchQuery}
            filtersVisible={filtersVisible}
            onToggleFilters={handleToggleFilters}
          />
        </main>
        
        <Toaster />
      </div>
    </ThemeProvider>
  );
};

export default Index;
