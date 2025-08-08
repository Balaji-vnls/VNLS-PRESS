import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar = ({ onSearch, placeholder = "Search articles..." }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(query);
  };

  const handleClear = () => {
    setQuery('');
    handleSubmit('');
    setIsExpanded(false);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`flex items-center transition-all duration-300 ${
        isExpanded ? 'w-96' : 'w-64'
      }`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => !query && setIsExpanded(false)}
            className="pl-10 pr-10 bg-muted/50 border-0 focus:bg-background transition-colors"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default SearchBar;\n\n
async function queryBertSearch(query: string) {
  const url = import.meta.env.VITE_BERT_SEARCH_URL || '/api/bert_search';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('BERT search error', err);
    return null;
  }
}
