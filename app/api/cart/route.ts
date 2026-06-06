// app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Cart } from "@/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const cart = await Cart.findOne({ userId: (session.user as any).id });
  const items = cart?.items ?? [];
  const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

  return NextResponse.json({ items, total: +total.toFixed(2) });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, size } = await req.json();
  await connectDB();

  const cart = await Cart.findOne({ userId: (session.user as any).id });
  if (cart) {
    cart.items = cart.items.filter((i: any) => !(i.productId === productId && i.size === size));
    await cart.save();
  }

  return NextResponse.json({ success: true });
}
