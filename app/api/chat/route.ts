// app/api/chat/route.ts
// Core chatbot endpoint — receives a message, runs it through the LLM,
// then executes the parsed intent (browse, add, remove, checkout).

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { connectDB } from "@/lib/db";
import { Cart, ChatHistory, Order, StockRequest } from "@/models";
import { PRODUCTS, searchProducts } from "@/lib/products";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── System prompt ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are ThreadBot, a friendly e-commerce assistant for an online clothing store.
You help users browse t-shirts and pants, manage their cart, and place orders.

PRODUCT CATALOG CONTEXT:
${PRODUCTS.map((p) => `- ${p._id}: "${p.name}" by ${p.brand} | £${p.price} | ${p.category} | sizes: ${p.availableSizes.join(", ")} | tags: ${p.tags.join(", ")}`).join("\n")}

You MUST respond with a JSON object only (no markdown fences, no preamble). The schema:
{
  "message": "<friendly reply to the user>",
  "action": "<one of: browse | add_to_cart | remove_from_cart | view_cart | checkout | stock_request | none>",
  "data": {
    // For browse:        { "query": "search term", "results": ["prod_id", ...] }
    // For add_to_cart:   { "productId": "prod_xxx", "size": "M", "quantity": 1 }
    // For remove_from_cart: { "productId": "prod_xxx", "size": "M" }
    // For stock_request: { "productId": "prod_xxx", "size": "XXL" }
    // For checkout:      {}
    // For view_cart:     {}
    // Otherwise:         {}
  }
}

Rules:
- Always be upbeat, concise, and helpful.
- If a user asks for a size that's not in availableSizes, set action = "stock_request".
- For browse intents, pick the 5 most relevant product IDs and include them in data.results.
- Never make up products that are not in the catalog.
- If the user's intent is ambiguous, ask a clarifying question and set action = "none".
`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    await connectDB();

    // Load chat history for context (last 10 turns)
    const historyDoc = await ChatHistory.findOne({ userId: (session.user as any).id });
    const recentHistory = (historyDoc?.messages ?? []).slice(-10).map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Call LLM
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...recentHistory,
        { role: "user", content: message },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    let parsed: { message: string; action: string; data: any };

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: "Sorry, I had trouble understanding that. Could you try again?", action: "none", data: {} };
    }

    const userId = (session.user as any).id;

    // ── Execute intent ─────────────────────────────────────────────────────────
    let responseExtras: any = {};

    switch (parsed.action) {
      case "browse": {
        const ids: string[] = parsed.data?.results ?? [];
        const products = ids.length > 0
          ? PRODUCTS.filter((p) => ids.includes(p._id))
          : searchProducts(parsed.data?.query ?? "", 5);
        responseExtras.products = products;
        break;
      }

      case "add_to_cart": {
        const { productId, size, quantity = 1 } = parsed.data ?? {};
        const product = PRODUCTS.find((p) => p._id === productId);

        if (!product) break;

        if (!product.availableSizes.includes(size)) {
          // Auto-raise stock request
          await StockRequest.create({ userId, productId, productName: product.name, requestedSize: size });
          parsed.message = `Sorry! ${product.name} isn't available in size ${size}. I've submitted a restock request on your behalf!`;
          break;
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) cart = await Cart.create({ userId, items: [] });

        const existing = cart.items.find(
          (i: any) => i.productId === productId && i.size === size
        );
        if (existing) {
          existing.quantity += quantity;
        } else {
          cart.items.push({ productId, name: product.name, price: product.price, size, quantity, image: product.image });
        }
        cart.updatedAt = new Date();
        await cart.save();
        responseExtras.cartItem = { productId, name: product.name, size, quantity };
        break;
      }

      case "remove_from_cart": {
        const { productId, size } = parsed.data ?? {};
        const cart = await Cart.findOne({ userId });
        if (cart) {
          cart.items = cart.items.filter(
            (i: any) => !(i.productId === productId && i.size === size)
          );
          cart.updatedAt = new Date();
          await cart.save();
        }
        break;
      }

      case "view_cart": {
        const cart = await Cart.findOne({ userId });
        responseExtras.cart = cart?.items ?? [];
        responseExtras.total = (cart?.items ?? []).reduce(
          (sum: number, i: any) => sum + i.price * i.quantity,
          0
        );
        break;
      }

      case "checkout": {
        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
          parsed.message = "Your cart is empty! Add some items before checking out.";
          break;
        }
        const total = cart.items.reduce(
          (sum: number, i: any) => sum + i.price * i.quantity,
          0
        );
        const order = await Order.create({ userId, items: cart.items, total });
        cart.items = [];
        await cart.save();
        responseExtras.orderId = order._id;
        responseExtras.total = total;
        break;
      }
    }

    // ── Persist message to chat history ───────────────────────────────────────
    await ChatHistory.findOneAndUpdate(
      { userId },
      {
        $push: {
          messages: {
            $each: [
              { role: "user", content: message, timestamp: new Date() },
              { role: "assistant", content: parsed.message, timestamp: new Date() },
            ],
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({ reply: parsed.message, action: parsed.action, ...responseExtras });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
