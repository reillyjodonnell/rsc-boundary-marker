// This is a Server Component (RSC) - no "use client" directive
// It can fetch data directly and use async/await

import { ProductList } from "@/components/ProductList";
import { SearchBar } from "@/components/SearchBar";
import { CartButton } from "@/components/CartButton";
import { Header } from "@/components/Header";

async function getProducts() {
  // Simulated data fetch - in real app this would be a database query
  return [
    { id: 1, name: "Wireless Headphones", price: 99.99 },
    { id: 2, name: "Mechanical Keyboard", price: 149.99 },
    { id: 3, name: "4K Monitor", price: 399.99 },
    { id: 4, name: "USB-C Hub", price: 49.99 },
  ];
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="container">
      <Header />

      <div className="toolbar">
        <SearchBar />
        <CartButton />
      </div>

      <ProductList products={products} />
    </main>
  );
}
