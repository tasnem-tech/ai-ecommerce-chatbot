import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Cart } from "@/models";
import { PRODUCTS } from "@/lib/products";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const cart = await Cart.findOne({
    userId: (session.user as any).id,
  });

  const items = cart?.items ?? [];

  const total = items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  return NextResponse.json({
    items,
    total: +total.toFixed(2),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, size, quantity = 1 } = await req.json();

  await connectDB();

  const product = PRODUCTS.find((p) => p._id === productId);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.availableSizes.includes(size)) {
    return NextResponse.json({ error: "Size not available" }, { status: 400 });
  }

  let cart = await Cart.findOne({
    userId: (session.user as any).id,
  });

  if (!cart) {
    cart = await Cart.create({
      userId: (session.user as any).id,
      items: [],
    });
  }

  const existing = cart.items.find(
    (item: any) => item.productId === productId && item.size === size
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      productId,
      name: product.name,
      price: product.price,
      size,
      quantity,
      image: product.image,
      category: product.category,
    });
  }

  cart.updatedAt = new Date();
  await cart.save();

  return NextResponse.json({ success: true, items: cart.items });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, size } = await req.json();

  await connectDB();

  const cart = await Cart.findOne({
    userId: (session.user as any).id,
  });

  if (cart) {
    cart.items = cart.items.filter(
      (item: any) => !(item.productId === productId && item.size === size)
    );

    await cart.save();
  }

  return NextResponse.json({ success: true });
}