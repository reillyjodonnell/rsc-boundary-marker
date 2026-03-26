# RSC Boundary Marker

A VSCode extension that displays badges on React components indicating whether they're Server Components (RSC) or Client Components. On hover, shows the inheritance chain explaining why a component is a client component.

## Badges

| Badge | Meaning |
|-------|---------|
| **RSC** (green) | Server Component - no `"use client"` directive |
| **Client** (blue) | Client Component - has `"use client"` directive |
| **Client (inherited)** (purple) | Client by inheritance - imported by a client component |

## Setup

```bash
# Install dependencies
bun install
```

## Running the Extension

### Option 1: VSCode Debug (Recommended)

1. Open the `packages/vscode-extension` folder in VSCode
2. Press `F5` to launch the Extension Development Host
3. The dev host opens with the example Next.js project loaded
4. Open any `.tsx` file to see the badges

### Option 2: Manual Build

```bash
# Build the extension
cd packages/vscode-extension
bun run build

# Watch mode for development
bun run dev
```

Then in VSCode:
1. Open the Command Palette (`Cmd+Shift+P`)
2. Run "Developer: Install Extension from Location..."
3. Select the `packages/vscode-extension` folder

## Example Project

The `examples/nextjs-app` folder contains a Next.js project demonstrating various component patterns:

```
src/components/
├── Header.tsx              # RSC
├── ProductList.tsx         # RSC
├── ProductCard.tsx         # RSC
├── SearchBar.tsx           # Client ("use client")
├── SearchInput.tsx         # Client (inherited)
├── SearchSuggestions.tsx   # Client (inherited, 2 levels)
├── CartButton.tsx          # Client ("use client")
├── CartIcon.tsx            # Client (inherited)
└── Badge.tsx               # Client (inherited, 2 levels)
```

### Inheritance Chain Example

When you hover over `SearchSuggestions.tsx`, the tooltip shows:

```
Client Component (inherited)

Inheritance Chain:
SearchBar.tsx "use client"
  ↳ SearchInput.tsx (imported)
    ↳ SearchSuggestions.tsx (imported)
```

## Project Structure

```
rsc-boundary-marker/
├── packages/
│   └── vscode-extension/     # The VSCode extension
│       ├── src/
│       │   ├── extension.ts          # Entry point
│       │   ├── analyzer.ts           # RSC boundary detection
│       │   ├── decorationProvider.ts # Badge rendering
│       │   └── hoverProvider.ts      # Hover tooltips
│       └── package.json
└── examples/
    └── nextjs-app/           # Demo Next.js project
```

## Commands

The extension provides one command:

- **RSC Boundary Marker: Refresh** - Re-analyzes the workspace and updates all badges
