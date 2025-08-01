import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Clock, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Fuse from "fuse.js";

export interface SearchableSection {
  id: string;
  title: string;
  content: string;
  category?: string;
}

export interface SearchResult {
  section: SearchableSection;
  matches: Fuse.FuseResultMatch[];
  score: number;
}

interface DocumentSearchProps {
  sections: SearchableSection[];
  placeholder?: string;
  onResultClick?: (sectionId: string) => void;
  onSearchChange?: (query: string, results: SearchResult[]) => void;
  className?: string;
  pageType?: "terms" | "privacy" | "support";
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({
  sections,
  placeholder = "Search...",
  onResultClick,
  onSearchChange,
  className = "",
  pageType = "terms"
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Popular searches by page type
  const popularSearches = {
    terms: ["payment", "termination", "liability", "warranty", "privacy", "intellectual property"],
    privacy: ["data collection", "cookies", "GDPR", "retention", "security", "third party"],
    support: ["conversion", "troubleshooting", "account", "billing", "API", "file formats"]
  };

  // Initialize Fuse.js
  const fuse = new Fuse(sections, {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "content", weight: 0.6 }
    ],
    threshold: 0.4,
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true
  });

  // Load search history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`search-history-${pageType}`);
    if (stored) {
      setSearchHistory(JSON.parse(stored));
    }
  }, [pageType]);

  // Debounced search
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      onSearchChange?.(searchQuery, []);
      return;
    }

    const fuseResults = fuse.search(searchQuery);
    const searchResults: SearchResult[] = fuseResults.map(result => ({
      section: result.item,
      matches: result.matches || [],
      score: result.score || 0
    }));

    setResults(searchResults);
    onSearchChange?.(searchQuery, searchResults);
  }, [fuse, onSearchChange]);

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    if (query.trim() && !searchHistory.includes(query.trim())) {
      const newHistory = [query.trim(), ...searchHistory.slice(0, 4)];
      setSearchHistory(newHistory);
      localStorage.setItem(`search-history-${pageType}`, JSON.stringify(newHistory));
    }
    
    if (results.length > 0) {
      onResultClick?.(results[0].section.id);
    }
    setShowSuggestions(false);
  };

  // Handle result click
  const handleResultClick = (sectionId: string) => {
    onResultClick?.(sectionId);
    setShowSuggestions(false);
    setIsExpanded(false);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
    setShowSuggestions(false);
    
    if (!searchHistory.includes(suggestion)) {
      const newHistory = [suggestion, ...searchHistory.slice(0, 4)];
      setSearchHistory(newHistory);
      localStorage.setItem(`search-history-${pageType}`, JSON.stringify(newHistory));
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearchChange?.("", []);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      clearSearch();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleResultClick(results[selectedIndex].section.id);
      } else {
        handleSearchSubmit();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    }
  };

  // Highlight matching text
  const highlightText = (text: string, matches: Fuse.FuseResultMatch[]) => {
    if (!matches.length) return text;

    let highlightedText = text;
    const contentMatch = matches.find(match => match.key === "content");

    if (contentMatch && contentMatch.indices) {
      // Create a copy with highlights
      let offset = 0;
      contentMatch.indices.forEach(([start, end]) => {
        const before = highlightedText.slice(0, start + offset);
        const match = highlightedText.slice(start + offset, end + 1 + offset);
        const after = highlightedText.slice(end + 1 + offset);
        highlightedText = before + `<mark class="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-medium">${match}</mark>` + after;
        offset += 67; // Length of added markup
      });
    }

    return highlightedText;
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={`relative w-full max-w-2xl mx-auto ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          className="pl-12 pr-12 py-4 text-lg bg-white border-2 border-gray-200 shadow-lg rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 relative z-10"
        />
        {query && (
          <Button
            onClick={clearSearch}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results Counter */}
      {query && (
        <div className="mt-2 text-sm text-gray-600">
          {results.length > 0 ? (
            <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
          ) : (
            <span>No results found</span>
          )}
        </div>
      )}

      {/* Suggestions and Results Dropdown */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-[100] max-h-96 overflow-y-auto border-2 border-gray-200 shadow-2xl bg-white">
          <CardContent className="p-0 bg-white">
            {/* Search History */}
            {!query && searchHistory.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Recent searches</span>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(item)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {!query && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Popular searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches[pageType].map((item, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSuggestionClick(item)}
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {query && results.length > 0 && (
              <div className="divide-y divide-gray-100 bg-white">
                {results.slice(0, 5).map((result, index) => (
                  <button
                    key={result.section.id}
                    onClick={() => handleResultClick(result.section.id)}
                    className={`w-full text-left p-4 transition-colors border-0 bg-white ${
                      selectedIndex === index
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2 text-base">
                          {result.section.title}
                        </h4>
                        <p
                          className="text-sm text-gray-700 line-clamp-2 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(
                              result.section.content.slice(0, 150) + "...",
                              result.matches
                            )
                          }}
                        />
                        {result.section.category && (
                          <Badge variant="outline" className="mt-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {result.section.category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs font-medium text-blue-600 flex-shrink-0 bg-blue-50 px-2 py-1 rounded">
                        {Math.round((1 - result.score) * 100)}% match
                      </div>
                    </div>
                  </button>
                ))}
                
                {results.length > 5 && (
                  <div className="p-4 text-center border-t border-gray-100">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-2 mx-auto text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          Show less
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Show {results.length - 5} more results
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {isExpanded && results.slice(5).map((result, index) => (
                  <button
                    key={result.section.id}
                    onClick={() => handleResultClick(result.section.id)}
                    className={`w-full text-left p-4 transition-colors border-0 bg-white ${
                      selectedIndex === index + 5
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2 text-base">
                          {result.section.title}
                        </h4>
                        <p
                          className="text-sm text-gray-700 line-clamp-2 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(
                              result.section.content.slice(0, 150) + "...",
                              result.matches
                            )
                          }}
                        />
                      </div>
                      <div className="text-xs font-medium text-blue-600 flex-shrink-0 bg-blue-50 px-2 py-1 rounded">
                        {Math.round((1 - result.score) * 100)}% match
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && results.length === 0 && (
              <div className="p-6 text-center bg-white">
                <p className="text-gray-700 mb-4 font-medium">No results found for "{query}"</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Try searching for:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {popularSearches[pageType].slice(0, 3).map((item, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors bg-white"
                        onClick={() => handleSuggestionClick(item)}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
