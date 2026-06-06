// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Cart, Order } from "@/models";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = (session.user as any).id;
  const cart = await Cart.findOne({ userId });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const total = cart.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const order = await Order.create({ userId, items: cart.items, total: +total.toFixed(2) });

  // Clear cart after order
  cart.items = [];
  await cart.save();

  return NextResponse.json({ orderId: order._id, total: order.total, status: order.status });
}
