// Client Component by INHERITANCE
// No "use client" directive, but imported by SearchBar.tsx which is a client component
// This demonstrates the inheritance chain: SearchBar.tsx -> SearchInput.tsx

import { SearchSuggestions } from "./SearchSuggestions";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

export function SearchInput({ value, onChange, onFocus, onBlur }: SearchInputProps) {
  const suggestions = ["headphones", "keyboard", "monitor", "mouse"];

  return (
    <div className="search-input-wrapper">
      <input
        type="text"
        placeholder="Search products..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="search-input"
      />
      {value.length > 0 && (
        <SearchSuggestions
          suggestions={suggestions.filter((s) => s.includes(value.toLowerCase()))}
          onSelect={onChange}
        />
      )}
    </div>
  );
}
