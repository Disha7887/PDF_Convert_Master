import { useState, useEffect, useCallback } from "react";
import { SearchableSection, SearchResult } from "@/components/DocumentSearch";

export interface UseDocumentSearchOptions {
  sections: SearchableSection[];
  onSectionHighlight?: (sectionId: string | null) => void;
  onNavigationFilter?: (sectionIds: string[]) => void;
}

export const useDocumentSearch = (options: UseDocumentSearchOptions) => {
  const { sections, onSectionHighlight, onNavigationFilter } = options;
  const [currentQuery, setCurrentQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);

  // Handle search changes
  const handleSearchChange = useCallback((query: string, results: SearchResult[]) => {
    setCurrentQuery(query);
    setSearchResults(results);

    // Filter navigation based on search results
    if (query && results.length > 0) {
      const resultSectionIds = results.map(r => r.section.id);
      onNavigationFilter?.(resultSectionIds);
    } else {
      // Show all sections when no search query
      onNavigationFilter?.(sections.map(s => s.id));
    }

    // Clear highlight when search changes
    if (highlightedSectionId) {
      setHighlightedSectionId(null);
      onSectionHighlight?.(null);
    }
  }, [sections, highlightedSectionId, onNavigationFilter, onSectionHighlight]);

  // Handle result click with smooth scrolling
  const handleResultClick = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Account for header (65px) + PageSearch component (80px) + extra padding
      const headerOffset = 120;
      const elementPosition = element.offsetTop;
      const offsetPosition = Math.max(0, elementPosition - headerOffset);

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Highlight the section
      setHighlightedSectionId(sectionId);
      onSectionHighlight?.(sectionId);

      // Remove highlight after 5 seconds for better user experience
      setTimeout(() => {
        setHighlightedSectionId(null);
        onSectionHighlight?.(null);
      }, 5000);

      // Log successful navigation for debugging
      console.log(`Navigated to section: ${sectionId}`);
    } else {
      console.warn(`Section with ID "${sectionId}" not found in DOM`);
    }
  }, [onSectionHighlight]);

  // Clear search
  const clearSearch = useCallback(() => {
    setCurrentQuery("");
    setSearchResults([]);
    setHighlightedSectionId(null);
    onSectionHighlight?.(null);
    onNavigationFilter?.(sections.map(s => s.id));
  }, [sections, onSectionHighlight, onNavigationFilter]);

  return {
    currentQuery,
    searchResults,
    highlightedSectionId,
    handleSearchChange,
    handleResultClick,
    clearSearch
  };
};

// Utility function to extract searchable content from DOM elements
export const extractSearchableSections = (contentSelector: string): SearchableSection[] => {
  const sections: SearchableSection[] = [];
  
  // Find all sections with IDs
  const sectionElements = document.querySelectorAll(`${contentSelector} section[id]`);
  
  sectionElements.forEach((element) => {
    const id = element.id;
    const titleElement = element.querySelector('h2, h3, h4');
    const title = titleElement?.textContent?.trim() || '';
    
    // Get all text content, excluding script and style elements
    const content = Array.from(element.querySelectorAll('*'))
      .filter(el => !['SCRIPT', 'STYLE'].includes(el.tagName))
      .map(el => el.textContent)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (title && content) {
      sections.push({
        id,
        title,
        content,
        category: element.getAttribute('data-category') || undefined
      });
    }
  });

  return sections;
};

// Utility function to highlight text in DOM elements
export const highlightSearchTerms = (query: string, containerSelector: string) => {
  if (!query.trim()) {
    removeHighlights(containerSelector);
    return;
  }

  const container = document.querySelector(containerSelector);
  if (!container) return;

  // Remove existing highlights
  removeHighlights(containerSelector);

  // Create regex for search term
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

  // Find and highlight text nodes
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip script and style elements
        const parent = node.parentElement;
        if (parent && ['SCRIPT', 'STYLE', 'MARK'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes: Text[] = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent && regex.test(node.textContent)) {
      textNodes.push(node as Text);
    }
  }

  // Highlight matches in reverse order to preserve positions
  textNodes.reverse().forEach((textNode) => {
    const parent = textNode.parentNode;
    if (!parent) return;

    const text = textNode.textContent || '';
    const highlightedHTML = text.replace(regex, '<mark class="search-highlight bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-medium border border-blue-200">$1</mark>');

    if (highlightedHTML !== text) {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = highlightedHTML;
      parent.replaceChild(wrapper, textNode);
    }
  });
};

// Utility function to remove highlights
export const removeHighlights = (containerSelector: string) => {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const highlights = container.querySelectorAll('.search-highlight');
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
    }
  });

  // Normalize text nodes
  container.normalize();
};

// Analytics tracking
export const trackSearchAnalytics = (query: string, resultCount: number, pageType: string) => {
  try {
    // Store search analytics in localStorage
    const analytics = JSON.parse(localStorage.getItem('search-analytics') || '{}');
    const date = new Date().toISOString().split('T')[0];
    
    if (!analytics[date]) {
      analytics[date] = {};
    }
    
    if (!analytics[date][pageType]) {
      analytics[date][pageType] = [];
    }
    
    analytics[date][pageType].push({
      query,
      resultCount,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    Object.keys(analytics).forEach(dateKey => {
      if (new Date(dateKey) < cutoffDate) {
        delete analytics[dateKey];
      }
    });
    
    localStorage.setItem('search-analytics', JSON.stringify(analytics));
  } catch (error) {
    console.warn('Failed to track search analytics:', error);
  }
};

// Export search results
export const exportSearchResults = (query: string, results: SearchResult[], pageType: string) => {
  const exportData = {
    query,
    pageType,
    resultCount: results.length,
    timestamp: new Date().toISOString(),
    results: results.map(result => ({
      title: result.section.title,
      content: result.section.content.slice(0, 500),
      matchScore: Math.round((1 - result.score) * 100),
      sectionId: result.section.id
    }))
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `search-results-${pageType}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Print search results
export const printSearchResults = (query: string, results: SearchResult[], pageType: string) => {
  const printContent = `
    <html>
      <head>
        <title>Search Results - ${pageType}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #dc2626; padding-bottom: 10px; }
          .result { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .result-title { font-weight: bold; color: #dc2626; margin-bottom: 5px; }
          .result-content { color: #666; line-height: 1.5; }
          .match-score { font-size: 12px; color: #999; float: right; }
          .query { background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>PDF Convert Master - Search Results</h1>
        <div class="query">
          <strong>Search Query:</strong> "${query}"<br>
          <strong>Page:</strong> ${pageType}<br>
          <strong>Results Found:</strong> ${results.length}<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}
        </div>
        ${results.map(result => `
          <div class="result">
            <div class="result-title">
              ${result.section.title}
              <span class="match-score">${Math.round((1 - result.score) * 100)}% match</span>
            </div>
            <div class="result-content">${result.section.content.slice(0, 300)}...</div>
          </div>
        `).join('')}
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
};
