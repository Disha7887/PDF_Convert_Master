import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DocumentSearch, SearchableSection } from "@/components/DocumentSearch";

interface PageSearchProps {
  sections: SearchableSection[];
  onResultClick?: (sectionId: string) => void;
  onSearchChange?: (query: string, results: any[]) => void;
  pageType?: "terms" | "privacy" | "support";
  className?: string;
}

export const PageSearch: React.FC<PageSearchProps> = ({
  sections,
  onResultClick,
  onSearchChange,
  pageType = "terms",
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsExpanded(true);
        // Focus the search input after expansion
        setTimeout(() => {
          const searchInput = document.querySelector('.page-search-input') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }

      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const placeholderMap = {
    terms: "Search terms and conditions...",
    privacy: "Search privacy information...",
    support: "Search help articles and guides..."
  };

  if (isMobile) {
    return (
      <div className={`fixed top-20 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800"
          variant="outline"
        >
          {isExpanded ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </Button>
        
        {isExpanded && (
          <div className="absolute top-16 right-0 w-80 max-w-[calc(100vw-2rem)]">
            <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-4">
              <DocumentSearch
                sections={sections}
                placeholder={placeholderMap[pageType]}
                onResultClick={(sectionId) => {
                  onResultClick?.(sectionId);
                  setIsExpanded(false);
                }}
                onSearchChange={onSearchChange}
                pageType={pageType}
                className="page-search-input"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`fixed top-20 right-6 z-50 transition-all duration-300 ${className}`}>
      {!isExpanded ? (
        <Button
          onClick={() => setIsExpanded(true)}
          className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800"
          variant="outline"
          title="Search (Ctrl+K)"
        >
          <Search className="w-5 h-5" />
        </Button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-4 min-w-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Search Page</h3>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <DocumentSearch
            sections={sections}
            placeholder={placeholderMap[pageType]}
            onResultClick={(sectionId) => {
              onResultClick?.(sectionId);
              setIsExpanded(false);
            }}
            onSearchChange={onSearchChange}
            pageType={pageType}
            className="page-search-input"
          />
          
          <div className="mt-3 text-xs text-gray-500 text-center">
            Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Esc</kbd> to close
          </div>
        </div>
      )}
    </div>
  );
};
