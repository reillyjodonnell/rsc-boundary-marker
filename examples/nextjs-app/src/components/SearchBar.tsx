"use client";

import { useState } from "react";
import { SearchInput } from "./SearchInput";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="search-bar">
      <SearchInput
        value={query}
        onChange={setQuery}
        onFocus={() => setIsExpanded(true)}
        onBlur={() => setIsExpanded(false)}
      />
      {isExpanded && query && (
        <div className="search-overlay">
          Searching for: {query}
        </div>
      )}
    </div>
  );
}
