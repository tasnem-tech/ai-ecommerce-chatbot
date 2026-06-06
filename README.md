# 👕 ThreadBot — AI E-Commerce Chatbot

A conversational e-commerce app for browsing and buying t-shirts and pants, powered by an LLM backend.

## Features

- 🤖 **AI Chat Widget** — natural language shopping via GPT-4o-mini
- 🛍️ **Product Catalog** — 10 products with sizes, prices, and categories
- 🛒 **Persistent Cart** — per-user cart saved to MongoDB
- ✅ **Checkout Flow** — simulated order placement
- 🔐 **Auth** — register + login with JWT sessions (NextAuth)
- 📝 **Chat History** — all conversations saved per user
- 📦 **Stock Requests** — auto-submitted when a size isn't available

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes (Node.js) |
| Database | MongoDB (Mongoose) |
| Auth | NextAuth.js (Credentials) |
| LLM | OpenAI GPT-4o-mini (swap for Gemini in `app/api/chat/route.ts`) |

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/threadbot.git
cd threadbot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Then edit .env.local with your values
```

Required values:
- `MONGODB_URI` — local MongoDB or Atlas connection string
- `OPENAI_API_KEY` — from platform.openai.com
- `JWT_SECRET` and `NEXTAUTH_SECRET` — any random strings
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev

### 3. Run MongoDB locally (if not using Atlas)

```bash
# macOS with Homebrew
brew services start mongodb-community

# Or with Docker
docker run -d -p 27017:27017 mongo
```

### 4. Start the dev server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
threadbot/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   └── register/route.ts        # User registration
│   │   ├── cart/route.ts                # GET/DELETE cart
│   │   ├── chat/route.ts                # 🤖 Main LLM chat endpoint
│   │   └── checkout/route.ts            # POST order
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── store/page.tsx                   # Main storefront
│   └── layout.tsx
├── components/
│   ├── chat/ChatWidget.tsx              # Floating chat widget
│   └── ui/SessionWrapper.tsx
├── lib/
│   ├── db.ts                            # MongoDB connection
│   └── products.ts                      # Product catalog + search
└── models/
    └── index.ts                         # User, Cart, Order, ChatHistory, StockRequest
```

---

## How the Chatbot Works

The chat endpoint (`app/api/chat/route.ts`) uses a structured prompt that:

1. **Provides the full product catalog** to the LLM in the system prompt
2. **Requires JSON-only responses** with an `action` field
3. **Executes the action** server-side (add to cart, search, checkout, etc.)
4. **Saves conversation history** to MongoDB for each user

### Supported intents

| User says | Action | What happens |
|---|---|---|
| "Show me running products" | `browse` | Returns 5 matching products |
| "Add Nike tee size L to cart" | `add_to_cart` | Adds to MongoDB cart |
| "Remove the joggers from cart" | `remove_from_cart` | Removes from cart |
| "What's in my cart?" | `view_cart` | Returns cart contents |
| "I'm ready to place my order" | `checkout` | Creates order, clears cart |
| Size not available | `stock_request` | Logs a StockRequest doc |

---

## Deployment (Vercel + MongoDB Atlas)

1. Push to GitHub
2. Import project at vercel.com/new
3. Add all env vars from `.env.example` in Vercel dashboard
4. Set `NEXTAUTH_URL` to your Vercel URL (e.g. `https://threadbot.vercel.app`)
5. Deploy!

---

## Switching LLM Provider

To use **Google Gemini** instead of OpenAI:

1. Install: `npm install @google/generative-ai`
2. In `app/api/chat/route.ts`, replace the OpenAI call with:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
const result = await model.generateContent([SYSTEM_PROMPT, ...messages]);
const raw = result.response.text();
```

---

## Running a Local LLM (Option B)

Use [Ollama](https://ollama.com/) with `llama3`:

```bash
ollama pull llama3
ollama serve  # runs on http://localhost:11434
```

Then in `app/api/chat/route.ts`, replace the OpenAI client with:

```typescript
const res = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  body: JSON.stringify({
    model: "llama3",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: message }],
    stream: false,
    format: "json",
  }),
});
const data = await res.json();
const raw = data.message.content;
```
