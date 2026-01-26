"use client";

import React from "react";

export type SearchSuggestion = {
  id: string;
  label: string;
  value: string;
  category?: string;
  subtitle?: string;
  metadata?: string;
};

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  showClearButton?: boolean;
  showDropdownOnFocus?: boolean;
  groupSuggestionsByCategory?: boolean;
  maxSuggestions?: number;
  noResultsText?: string;
  className?: string;
}

export function SearchBar(props: SearchBarProps) {
  const {
    placeholder,
    value,
    onValueChange,
    onSuggestionSelect,
    suggestions = [],
    showClearButton = true,
    showDropdownOnFocus = true,
    groupSuggestionsByCategory = true,
    maxSuggestions = 20,
    noResultsText = "No results",
    className = "",
  } = props;

  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const normalized = React.useMemo(() => {
    if (!value) return suggestions;
    const q = value.toLowerCase();
    return suggestions.filter(
      (s) => (s.label || "").toLowerCase().includes(q) || (s.value || "").toLowerCase().includes(q)
    );
  }, [suggestions, value]);

  const limited = React.useMemo(() => normalized.slice(0, maxSuggestions), [normalized, maxSuggestions]);

  const grouped = React.useMemo(() => {
    if (!groupSuggestionsByCategory) return { "": limited } as Record<string, SearchSuggestion[]>;
    const groups: Record<string, SearchSuggestion[]> = {};
    for (const s of limited) {
      const key = s.category || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return groups;
  }, [limited, groupSuggestionsByCategory]);

  React.useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleFocus = () => {
    if (showDropdownOnFocus) setIsOpen(true);
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onValueChange(e.target.value);
    if (!isOpen && showDropdownOnFocus) setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    const flat = limited;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => Math.min(prev + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < flat.length) {
        const sel = flat[highlightedIndex];
        onSuggestionSelect?.(sel);
        setIsOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const renderList = () => {
    const categories = Object.keys(grouped);
    const empty = limited.length === 0;
    if (empty) {
      return <div className="p-3 text-sm text-neutral-500">{noResultsText}</div>;
    }
    return (
      <div className="max-h-80 overflow-auto">
        {categories.map((cat) => (
          <div key={cat}>
            {groupSuggestionsByCategory && cat && (
              <div className="px-3 py-2 text-xs font-medium text-neutral-500">{cat}</div>
            )}
            {(grouped[cat] || []).map((s) => {
              const flatIndex = limited.findIndex((x) => x.id === s.id);
              const highlighted = flatIndex === highlightedIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSuggestionSelect?.(s);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    highlighted ? "bg-neutral-100 dark:bg-neutral-800" : ""
                  }`}
                >
                  <div className="text-sm text-neutral-800 dark:text-neutral-100">{s.label}</div>
                  {(s.subtitle || s.metadata) && (
                    <div className="text-xs text-neutral-500">
                      {s.subtitle}
                      {s.subtitle && s.metadata ? " • " : ""}
                      {s.metadata}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full input-field px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          role="combobox"
        />
        {showClearButton && value && (
          <button
            type="button"
            onClick={() => {
              onValueChange("");
              setIsOpen(false);
              setHighlightedIndex(-1);
              inputRef.current?.focus();
            }}
            className="btn-ghost text-sm px-2 py-1 border rounded"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
      {isOpen && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-md">
          {renderList()}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
