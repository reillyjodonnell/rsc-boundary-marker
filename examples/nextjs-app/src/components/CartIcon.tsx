// Client Component by INHERITANCE
// No "use client" directive, but imported by CartButton.tsx
// Inheritance chain: CartButton.tsx -> CartIcon.tsx

import { Badge } from "./Badge";

interface CartIconProps {
  count: number;
}

export function CartIcon({ count }: CartIconProps) {
  return (
    <div className="cart-icon">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && <Badge count={count} />}
    </div>
  );
}
