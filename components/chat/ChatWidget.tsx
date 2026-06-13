"use client";

import { useState } from "react";

interface ChatWidgetProps {
  onCartUpdate?: () => void;
}

export default function ChatWidget({ onCartUpdate }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 90,
          right: 24,
          zIndex: 9999,
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "none",
          background: "#2563eb",
          color: "white",
          fontSize: 28,
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          cursor: "pointer",
        }}
      >
        {open ? "×" : "💬"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 170,
            right: 24,
            zIndex: 9999,
            width: 380,
            height: 520,
            background: "white",
            borderRadius: 24,
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #2563eb, #0f172a)",
              color: "white",
              padding: 18,
            }}
          >
            <h3 style={{ margin: 0 }}>🤖 ThreadBot</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>
              Your AI shopping assistant
            </p>
          </div>

          <div style={{ flex: 1, padding: 18 }}>
            <div
              style={{
                background: "#f1f5f9",
                padding: 14,
                borderRadius: 16,
                marginBottom: 14,
              }}
            >
              Hi! Ask me to show products, view cart, or place order.
            </div>

            <button style={btn} onClick={onCartUpdate}>
              View my cart
            </button>
            <button style={btn}>Show me t-shirts</button>
            <button style={btn}>Show me pants</button>
            <button style={btn}>Place my order</button>
          </div>

          <div style={{ padding: 14, borderTop: "1px solid #e5e7eb" }}>
            <input
              placeholder="Ask me anything..."
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 14,
                border: "1px solid #cbd5e1",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

const btn = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: 12,
  borderRadius: 14,
border: "1px solid #cbd5e1",
  background: "white",
  cursor: "pointer",
};