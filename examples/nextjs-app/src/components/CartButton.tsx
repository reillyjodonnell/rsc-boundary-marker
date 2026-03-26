"use client";

// Client Component - needs state for cart count
// Creates another client boundary

import { useState } from "react";
import { CartIcon } from "./CartIcon";

export function CartButton() {
  const [itemCount, setItemCount] = useState(3);

  return (
    <button
      className="cart-button"
      onClick={() => setItemCount((c) => c + 1)}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <CartIcon count={itemCount} />
      <span>Cart</span>
    </button>
  );
}
