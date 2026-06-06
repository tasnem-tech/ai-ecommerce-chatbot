// app/store/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import { PRODUCTS, Product } from "@/lib/products";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function StorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "t-shirt" | "pants">("all");
  const [orderSuccess, setOrderSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchCart = useCallback(async () => {
    const res = await fetch("/api/cart");
    if (res.ok) {
      const data = await res.json();
      setCart(data.items ?? []);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchCart();
  }, [status, fetchCart]);

  const handleCartUpdate = () => fetchCart();

  const removeFromCart = async (productId: string, size: string) => {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, size }),
    });
    fetchCart();
  };

  const handleCheckout = async () => {
    const res = await fetch("/api/checkout", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setCart([]);
      setCartOpen(false);
      setOrderSuccess(`Order #${data.orderId.toString().slice(-8).toUpperCase()} placed! Total: £${data.total.toFixed(2)}`);
      setTimeout(() => setOrderSuccess(""), 5000);
    }
  };

  const displayed = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">👕 ThreadBot</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Hi, {session?.user?.name}</span>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              🛒 Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Order success toast */}
      {orderSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium">
          ✅ {orderSuccess}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "t-shirt", "pants"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {f === "all" ? "All Products" : f === "t-shirt" ? "T-Shirts" : "Pants"}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayed.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </main>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="w-96 bg-white dark:bg-gray-900 h-full overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Your Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="flex-1 p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-gray-500 py-16 text-sm">Your cart is empty</p>
              ) : (
                cart.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className="text-2xl">{item.category === "t-shirt" ? "👕" : "👖"}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Size {item.size} · Qty {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">£{(item.price * item.quantity).toFixed(2)}</p>
                      <button onClick={() => removeFromCart(item.productId, item.size)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>£{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  Place Order →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ChatWidget onCartUpdate={handleCartUpdate} />
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-5xl">
        {product.category === "t-shirt" ? "👕" : "👖"}
      </div>
      <div className="p-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${product.category === "t-shirt" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
          {product.category}
        </span>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 leading-tight">{product.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{product.brand}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">£{product.price.toFixed(2)}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{product.availableSizes.join(" · ")}</p>
      </div>
    </div>
  );
}
