// Client Component by INHERITANCE (2 levels deep)
// No "use client" directive
// Inheritance chain: CartButton.tsx -> CartIcon.tsx -> Badge.tsx

interface BadgeProps {
  count: number;
}

export function Badge({ count }: BadgeProps) {
  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <span className="badge" aria-label={`${count} items`}>
      {displayCount}
    </span>
  );
}
