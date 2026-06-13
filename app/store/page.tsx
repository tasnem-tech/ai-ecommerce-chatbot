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

  if (status === "loading") return <div style={styles.loading}>Loading...</div>;
  if (status === "unauthenticated") return null;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>👕 ThreadBot</h1>
          <p style={styles.subtitle}>AI powered clothing store</p>
        </div>

        <div style={styles.navRight}>
          <span>Hi, {session?.user?.name}</span>
          <button style={styles.darkButton} onClick={() => setCartOpen(true)}>
            🛒 Cart ({cartCount})
          </button>
          <button style={styles.lightButton} onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign out
          </button>
        </div>
      </header>

      <section style={styles.hero}>
        <div>
          <p style={styles.tag}>NEW SEASON COLLECTION</p>
          <h2 style={styles.heroTitle}>Shop smart with ThreadBot</h2>
          <p style={styles.heroText}>
            Browse stylish t-shirts and pants, add items to your cart, and place orders easily.
          </p>
        </div>
        <div style={styles.heroIcon}>🛍️</div>
      </section>

      {orderSuccess && <div style={styles.success}>✅ {orderSuccess}</div>}

      <div style={styles.filters}>
        {(["all", "t-shirt", "pants"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={filter === f ? styles.activeFilter : styles.filterButton}
          >
            {f === "all" ? "All Products" : f === "t-shirt" ? "T-Shirts" : "Pants"}
          </button>
        ))}
      </div>

      <main style={styles.grid}>
        {displayed.map((product) => (
          <ProductCard key={product._id} product={product} onAdd={addToCart} />
        ))}
      </main>

      {cartOpen && (
        <div style={styles.overlay}>
          <div style={styles.backdrop} onClick={() => setCartOpen(false)} />
          <div style={styles.cartPanel}>
            <div style={styles.cartHeader}>
              <h2>Your Cart ({cartCount})</h2>
              <button style={styles.closeBtn} onClick={() => setCartOpen(false)}>×</button>
            </div>

            {cart.length === 0 ? (
              <p style={{ color: "#64748b" }}>Your cart is empty.</p>
            ) : (
              <>
                {cart.map((item, index) => (
                  <div key={index} style={styles.cartItem}>
                    <strong>{item.name}</strong>
                    <p>Size {item.size} · Qty {item.quantity}</p>
                    <b>£{(item.price * item.quantity).toFixed(2)}</b>
                    <br />
                    <button
                      style={styles.removeBtn}
                      onClick={() => removeFromCart(item.productId, item.size)}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div style={styles.totalBox}>
                  <h3>Total: £{cartTotal.toFixed(2)}</h3>
                  <button style={styles.checkoutBtn} onClick={handleCheckout}>
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
    String(product.availableSizes[0] ?? "")
  );

  return (
    <div style={styles.card}>
      <div style={styles.productImage}>
        {product.category === "t-shirt" ? "👕" : "👖"}
      </div>

      <div style={styles.cardBody}>
        <span style={styles.badge}>{product.category}</span>
        <h3>{product.name}</h3>
        <p style={styles.brand}>{product.brand}</p>
        <p style={styles.price}>£{product.price.toFixed(2)}</p>

        <label style={styles.label}>Size</label>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          style={styles.select}
        >
          {product.availableSizes.map((size) => (
            <option key={String(size)} value={String(size)}>
              {String(size)}
            </option>
          ))}
        </select>

        <button style={styles.addButton} onClick={() => onAdd(product, selectedSize)}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "Arial, sans-serif",
    color: "#0f172a",
  },
  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    background: "white",
    padding: "18px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  logo: { margin: 0, fontSize: 28 },
  subtitle: { margin: 0, color: "#64748b" },
  navRight: { display: "flex", gap: 12, alignItems: "center" },
  darkButton: {
    background: "#0f172a",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 12,
    cursor: "pointer",
  },
  lightButton: {
    background: "white",
    border: "1px solid #cbd5e1",
    padding: "10px 16px",
    borderRadius: 12,
    cursor: "pointer",
  },
  hero: {
    margin: "35px auto",
    maxWidth: 1100,
    background: "linear-gradient(135deg, #2563eb, #0f172a)",
    color: "white",
    borderRadius: 28,
    padding: 45,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tag: { letterSpacing: 2, fontSize: 13, opacity: 0.8 },
  heroTitle: { fontSize: 44, margin: "10px 0" },
  heroText: { fontSize: 18, maxWidth: 560, opacity: 0.9 },
  heroIcon: { fontSize: 90 },
  success: {
    maxWidth: 1100,
    margin: "0 auto 20px",
    background: "#dcfce7",
    color: "#166534",
    padding: 16,
    borderRadius: 14,
  },
  filters: {
    maxWidth: 1100,
    margin: "0 auto 25px",
    display: "flex",
    gap: 12,
  },
  filterButton: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
  },
  activeFilter: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  grid: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 24,
    paddingBottom: 60,
  },
  card: {
    background: "white",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
    border: "1px solid #e2e8f0",
  },
  productImage: {
    height: 170,
    background: "linear-gradient(135deg, #dbeafe, #f1f5f9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 70,
  },
  cardBody: { padding: 20 },
  badge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
  },
  brand: { color: "#64748b" },
  price: { fontSize: 22, fontWeight: "bold" },
  label: { display: "block", marginBottom: 6, color: "#475569" },
  select: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
  },
  addButton: {
    width: "100%",
    marginTop: 14,
    background: "#0f172a",
    color: "white",
    border: "none",
    padding: 12,
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: "bold",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    display: "flex",
  },
  backdrop: { flex: 1, background: "rgba(0,0,0,0.45)" },
  cartPanel: {
    width: 420,
    background: "white",
    padding: 24,
    overflowY: "auto",
  },
  cartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    fontSize: 26,
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  cartItem: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  removeBtn: {
    marginTop: 8,
    color: "#dc2626",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  totalBox: {
    marginTop: 20,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 20,
  },
  checkoutBtn: {
    width: "100%",
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: 14,
    borderRadius: 14,
    fontWeight: "bold",
    cursor: "pointer",
  },
};