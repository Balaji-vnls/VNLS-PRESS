import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchBar from '@/components/ui/SearchBar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import ProfileDropdown from '@/components/ui/ProfileDropdown';

interface NavbarProps {
  onSearch: (query: string) => void;
  onToggleFilters: () => void;
}

const Navbar = ({ onSearch, onToggleFilters }: NavbarProps) => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/20 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-9 w-9 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  SLV Press
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  AI-Powered News
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 justify-center max-w-md">
            <SearchBar onSearch={onSearch} />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Filters Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFilters}
              className="hidden lg:flex h-9 px-3 text-sm"
            >
              Filters
            </Button>

            <ThemeToggle />
            
            {user ? (
              <ProfileDropdown />
            ) : (
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/20 animate-fade-in">
            <div className="space-y-4">
              <SearchBar onSearch={onSearch} />
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleFilters}
                  className="flex-1 mr-2"
                >
                  Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;