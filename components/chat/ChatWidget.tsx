"use client";
// components/chat/ChatWidget.tsx
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: any[];
  cart?: any[];
  orderId?: string;
}

interface ChatWidgetProps {
  onCartUpdate?: () => void;
}

export default function ChatWidget({ onCartUpdate }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! 👋 I'm ThreadBot. Ask me to show products, add items to your cart, or place an order!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? "Sorry, something went wrong.",
          products: data.products,
          cart: data.cart,
          orderId: data.orderId,
        },
      ]);

      if (["add_to_cart", "remove_from_cart", "checkout"].includes(data.action)) {
        onCartUpdate?.();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = ["Show me t-shirts", "Show me pants", "View my cart", "Place my order"];

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        aria-label="Toggle chat"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">TB</div>
            <div>
              <p className="font-medium text-sm">ThreadBot</p>
              <p className="text-xs text-blue-200">Your shopping assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {m.content}

                  {/* Product chips */}
                  {m.products && m.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.products.map((p) => (
                        <ProductChip key={p._id} product={p} onAdd={() => send(`Add ${p.name} in size ${p.availableSizes[1] ?? p.availableSizes[0]} to my cart`)} />
                      ))}
                    </div>
                  )}

                  {/* Cart summary */}
                  {m.cart && m.cart.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.cart.map((item: any, j: number) => (
                        <div key={j} className="text-xs bg-white dark:bg-gray-700 rounded-lg p-2">
                          {item.name} — Size {item.size} × {item.quantity} — £{(item.price * item.quantity).toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order confirmation */}
                  {m.orderId && (
                    <div className="mt-2 bg-green-100 dark:bg-green-900 rounded-lg p-2 text-xs text-green-800 dark:text-green-200">
                      ✅ Order #{m.orderId.toString().slice(-8).toUpperCase()} confirmed!
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div className="flex gap-1 px-3 pb-2 flex-wrap">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-gray-100 dark:border-gray-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask me anything…"
              className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => send()}
              disabled={loading}
              className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ProductChip({ product, onAdd }: { product: any; onAdd: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-2">
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xl">
        {product.category === "t-shirt" ? "👕" : "👖"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">£{product.price.toFixed(2)} · {product.availableSizes.join(", ")}</p>
      </div>
      <button
        onClick={onAdd}
        className="text-xs bg-blue-600 text-white rounded-lg px-2 py-1 hover:bg-blue-700 transition-colors whitespace-nowrap"
      >
        Add
      </button>
    </div>
  );
}
