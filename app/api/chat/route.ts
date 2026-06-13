import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Cart, ChatHistory, Order, StockRequest } from "@/models";
import { PRODUCTS } from "@/lib/products";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await req.json();
    const userId = (session.user as any).id;

    await connectDB();

    const text = String(message || "").toLowerCase();

    let reply = "I can help you browse products, add items to cart, remove items, or checkout.";
    let action = "none";
    let responseExtras: any = {};

    const matchedProduct = PRODUCTS.find((p) =>
      text.includes(p.name.toLowerCase()) ||
      text.includes(p.category.toLowerCase())
    );

    const matchedSize =
      ["XXL", "XL", "L", "M", "S"].find((s) => text.includes(` ${s.toLowerCase()}`)) ||
      "M";

    if (text.includes("show") || text.includes("browse") || text.includes("products")) {
      action = "browse";
      responseExtras.products = PRODUCTS.slice(0, 5);
      reply = "Here are some products you may like.";
    }

    if (text.includes("add")) {
      action = "add_to_cart";

      const product = matchedProduct || PRODUCTS[0];

      if (!product.availableSizes.includes(matchedSize)) {
        await StockRequest.create({
          userId,
          productId: product._id,
          productName: product.name,
          requestedSize: matchedSize,
        });

        reply = `Sorry, ${product.name} is not available in size ${matchedSize}. I submitted a restock request.`;
      } else {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
          cart = await Cart.create({ userId, items: [] });
        }

        const existing = cart.items.find(
          (i: any) => i.productId === product._id && i.size === matchedSize
        );

        if (existing) {
          existing.quantity += 1;
        } else {
          cart.items.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            size: matchedSize,
            quantity: 1,
            image: product.image,
            category: product.category,
          });
        }

        await cart.save();

        reply = `${product.name} size ${matchedSize} added to your cart.`;
        responseExtras.cartItem = product;
      }
    }

    if (text.includes("remove")) {
      action = "remove_from_cart";

      const product = matchedProduct || PRODUCTS[0];

      const cart = await Cart.findOne({ userId });

      if (cart) {
        cart.items = cart.items.filter(
          (i: any) => !(i.productId === product._id && i.size === matchedSize)
        );
        await cart.save();
      }

      reply = `${product.name} size ${matchedSize} removed from your cart.`;
    }

    if (text.includes("cart")) {
      action = "view_cart";

      const cart = await Cart.findOne({ userId });
      const items = cart?.items ?? [];
      const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

      responseExtras.cart = items;
      responseExtras.total = total;

      reply =
        items.length === 0
          ? "Your cart is empty."
          : `You have ${items.length} item(s) in your cart. Total: £${total.toFixed(2)}.`;
    }

    if (text.includes("checkout") || text.includes("place order") || text.includes("order")) {
      action = "checkout";

      const cart = await Cart.findOne({ userId });

      if (!cart || cart.items.length === 0) {
        reply = "Your cart is empty. Please add items before checkout.";
      } else {
        const total = cart.items.reduce(
          (s: number, i: any) => s + i.price * i.quantity,
          0
        );

        const order = await Order.create({
          userId,
          items: cart.items,
          total: +total.toFixed(2),
        });

        cart.items = [];
        await cart.save();

        reply = `Order placed successfully. Your order ID is ${order._id.toString().slice(-8).toUpperCase()}. Total: £${total.toFixed(2)}.`;
        responseExtras.orderId = order._id;
        responseExtras.total = total;
      }
    }

    await ChatHistory.findOneAndUpdate(
      { userId },
      {
        $push: {
          messages: {
            $each: [
              { role: "user", content: message, timestamp: new Date() },
              { role: "assistant", content: reply, timestamp: new Date() },
            ],
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({
      reply,
      action,
      ...responseExtras,
    });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}