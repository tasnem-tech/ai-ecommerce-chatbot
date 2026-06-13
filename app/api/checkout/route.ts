import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Cart, Order } from "@/models";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = (session.user as any).id;
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const total = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      userId,
      items: cart.items,
      total,
    });

    cart.items = [];
    await cart.save();

    return NextResponse.json({
      success: true,
      orderId: order._id,
      total,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}