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
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchCart = useCallback(async () => {
    const res = await fetch("/api/cart");
    if (res.ok) {
      const data = await res.json();
      setCart(data.items ?? []);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCart();
    }
  }, [status, fetchCart]);

  const addToCart = async (product: Product, size: string) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: product._id,
        size,
        quantity: 1,
      }),
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId, size }),
    });

    fetchCart();
  };

  const handleCheckout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
    });

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

  const cartTotal = cart.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0
  );

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return null;

  return (
    <div>
      <h1>👕 ThreadBot</h1>

      <p>Hi, {session?.user?.name}</p>

      <button onClick={() => setCartOpen(true)}>🛒 Cart ({cartCount})</button>
      <button onClick={() => signOut({ callbackUrl: "/login" })}>
        Sign out
      </button>

      <br />
      <br />

      <button onClick={() => setFilter("all")}>All Products</button>
      <button onClick={() => setFilter("t-shirt")}>T-Shirts</button>
      <button onClick={() => setFilter("pants")}>Pants</button>

      {orderSuccess && <p style={{ color: "green" }}>{orderSuccess}</p>}

      <div>
        {displayed.map((product) => (
          <ProductCard key={product._id} product={product} onAdd={addToCart} />
        ))}
      </div>

      {cartOpen && (
        <div style={{ border: "1px solid black", padding: 15, marginTop: 20 }}>
          <h2>Your Cart ({cartCount})</h2>
          <button onClick={() => setCartOpen(false)}>Close</button>

          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              {cart.map((item, index) => (
                <div key={index}>
                  <p>
                    {item.name} — Size {item.size} — Qty {item.quantity} — £
                    {(item.price * item.quantity).toFixed(2)}
                  </p>

                  <button
                    onClick={() => removeFromCart(item.productId, item.size)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <h3>Total: £{cartTotal.toFixed(2)}</h3>
              <button onClick={handleCheckout}>Place Order</button>
            </>
          )}
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
    <div style={{ border: "1px solid #ccc", padding: 12, margin: 12 }}>
      <div style={{ fontSize: 40 }}>
        {product.category === "t-shirt" ? "👕" : "👖"}
      </div>

      <p>{product.category}</p>
      <h3>{product.name}</h3>
      <p>{product.brand}</p>
      <p>£{product.price.toFixed(2)}</p>

      <label>Size: </label>
      <select
        value={selectedSize}
        onChange={(e) => setSelectedSize(e.target.value)}
      >
        {product.availableSizes.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <br />
      <br />

      <button onClick={() => onAdd(product, selectedSize)}>Add to Cart</button>
    </div>
  );
}