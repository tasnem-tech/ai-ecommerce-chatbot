"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  onCartUpdate?: () => void;
}

export default function ChatWidget({ onCartUpdate }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! Ask me to show products, view cart, or place order.",
    },
  ]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      let replyText = data.reply || "Sorry, I could not understand.";

      if (data.products && data.products.length > 0) {
        replyText +=
          "\n\n" +
          data.products
            .map((p: any) => `• ${p.name} - £${p.price}`)
            .join("\n");
      }

      if (data.cart && data.cart.length > 0) {
        replyText +=
          "\n\nCart:\n" +
          data.cart
            .map(
              (item: any) =>
                `• ${item.name} size ${item.size} x${item.quantity} - £${(
                  item.price * item.quantity
                ).toFixed(2)}`
            )
            .join("\n");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: replyText,
        },
      ]);

      onCartUpdate?.();
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(!open)} style={floatingButton}>
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div style={panel}>
          <div style={header}>
            <h3 style={{ margin: 0 }}>🤖 ThreadBot</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>
              Your AI shopping assistant
            </p>
          </div>

          <div style={messagesBox}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...bubble,
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? "#2563eb" : "#f1f5f9",
                  color: m.role === "user" ? "white" : "#0f172a",
                  whiteSpace: "pre-line",
                }}
              >
                {m.content}
              </div>
            ))}

            {loading && <div style={bubble}>Typing...</div>}
          </div>

          <div style={quickButtons}>
            <button style={btn} onClick={() => send("View my cart")}>
              View cart
            </button>
            <button style={btn} onClick={() => send("Show me t-shirts")}>
              T-Shirts
            </button>
            <button style={btn} onClick={() => send("Show me pants")}>
              Pants
            </button>
            <button style={btn} onClick={() => send("Place my order")}>
              Order
            </button>
          </div>

          <div style={inputBox}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask me anything..."
              style={inputStyle}
            />
            <button style={sendBtn} onClick={() => send()}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const floatingButton = {
  position: "fixed" as const,
  bottom: 24,
  right: 24,
  width: 64,
  height: 64,
  borderRadius: "50%",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontSize: 28,
  cursor: "pointer",
  zIndex: 9999,
  boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
};

const panel = {
  position: "fixed" as const,
  bottom: 100,
  right: 24,
  width: 390,
  height: 560,
  background: "white",
  borderRadius: 22,
  boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
  overflow: "hidden",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column" as const,
};

const header = {
  background: "linear-gradient(135deg, #2563eb, #0f172a)",
  color: "white",
  padding: 18,
};

const messagesBox = {
  flex: 1,
  padding: 16,
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
  overflowY: "auto" as const,
};

const bubble = {
  maxWidth: "85%",
  padding: 12,
  borderRadius: 16,
  fontSize: 14,
};

const quickButtons = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  padding: 12,
};

const btn = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "white",
  cursor: "pointer",
};

const inputBox = {
  display: "flex",
  gap: 8,
  padding: 12,
  borderTop: "1px solid #e5e7eb",
};

const inputStyle = {
  flex: 1,
  padding: 12,
  borderRadius: 12,
border: "1px solid #cbd5e1",
};

const sendBtn = {
  padding: "0 14px",
  borderRadius: 12,
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
};