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

  const addToCart = async (product: Product, size: string) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product._id, size, quantity: 1 }),
    });

    if (res.ok) {
      await fetchCart();
      setCartOpen(true);
    } else {
      alert("Could not add to cart");
    }
  };

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
      setOrderSuccess(
        `Order #${data.orderId.toString().slice(-8).toUpperCase()} placed! Total: £${data.total.toFixed(2)}`
      );
      setTimeout(() => setOrderSuccess(""), 5000);
    }
  };

  const displayed =
    filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">👕 ThreadBot</h1>
            <p className="text-sm text-slate-500">AI Clothing Store</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Hi, {session?.user?.name}</span>
            <button
              onClick={() => setCartOpen(true)}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm"
            >
              🛒 Cart ({cartCount})
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="border px-4 py-2 rounded-xl text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {orderSuccess && (
          <div className="mb-6 bg-green-100 text-green-800 px-4 py-3 rounded-xl">
            ✅ {orderSuccess}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Shop latest styles</h2>
          <p className="text-slate-500 mt-2">Browse t-shirts and pants with ThreadBot.</p>
        </div>

        <div className="flex gap-3 mb-8">
          {(["all", "t-shirt", "pants"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-medium ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 border"
              }`}
            >
              {f === "all" ? "All Products" : f === "t-shirt" ? "T-Shirts" : "Pants"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayed.map((product) => (
            <ProductCard key={product._id} product={product} onAdd={addToCart} />
          ))}
        </div>
      </main>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-md bg-white h-full shadow-xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="text-xl">×</button>
            </div>

            {cart.length === 0 ? (
              <p className="text-slate-500">Your cart is empty.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="border rounded-xl p-4">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        Size {item.size} · Qty {item.quantity}
                      </p>
                      <p className="font-bold mt-2">
                        £{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.productId, item.size)}
                        className="text-red-500 text-sm mt-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>£{cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold"
                  >
                    Place Order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ChatWidget onCartUpdate={fetchCart} />
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product, size: string) => void;
}) {
  const [selectedSize, setSelectedSize] = useState<string>(
    product.availableSizes[0] ?? ""
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition">
      <div className="h-40 bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center text-6xl">
        {product.category === "t-shirt" ? "👕" : "👖"}
      </div>

      <div className="p-5">
        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          {product.category}
        </span>

        <h3 className="mt-3 font-bold text-lg text-slate-900">{product.name}</h3>
        <p className="text-sm text-slate-500">{product.brand}</p>
        <p className="mt-3 font-bold text-xl">£{product.price.toFixed(2)}</p>

        <div className="mt-4">
          <label className="text-sm text-slate-600">Size</label>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="w-full mt-1 border rounded-xl px-3 py-2"
          >
            {product.availableSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onAdd(product, selectedSize)}
          className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-700"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}