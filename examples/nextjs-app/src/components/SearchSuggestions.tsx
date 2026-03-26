// Client Component by INHERITANCE (2 levels deep)
// No "use client" directive
// Inheritance chain: SearchBar.tsx -> SearchInput.tsx -> SearchSuggestions.tsx

interface SearchSuggestionsProps {
  suggestions: string[];
  onSelect: (value: string) => void;
}

export function SearchSuggestions({ suggestions, onSelect }: SearchSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <ul className="search-suggestions">
      {suggestions.map((suggestion) => (
        <li key={suggestion}>
          <button onClick={() => onSelect(suggestion)}>{suggestion}</button>
        </li>
      ))}
    </ul>
  );
}
