// models/index.ts — All Mongoose schemas

import mongoose, { Schema, Document, models, model } from "mongoose";

/* ─── USER ─────────────────────────────────────────────── */
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = models.User ?? model<IUser>("User", UserSchema);

/* ─── CHAT MESSAGE ──────────────────────────────────────── */
export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  messages: IChatMessage[];
  updatedAt: Date;
}

const ChatHistorySchema = new Schema<IChatHistory>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  messages: [
    {
      role: { type: String, enum: ["user", "assistant"], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

export const ChatHistory =
  models.ChatHistory ?? model<IChatHistory>("ChatHistory", ChatHistorySchema);

/* ─── CART ──────────────────────────────────────────────── */
export interface ICartItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      size: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      image: { type: String, default: "" },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

export const Cart = models.Cart ?? model<ICart>("Cart", CartSchema);

/* ─── ORDER ─────────────────────────────────────────────── */
export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  placedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: String,
      name: String,
      price: Number,
      size: String,
      quantity: Number,
      image: String,
    },
  ],
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered"],
    default: "confirmed",
  },
  placedAt: { type: Date, default: Date.now },
});

export const Order = models.Order ?? model<IOrder>("Order", OrderSchema);

/* ─── STOCK REQUEST ─────────────────────────────────────── */
export interface IStockRequest extends Document {
  userId: mongoose.Types.ObjectId;
  productId: string;
  productName: string;
  requestedSize: string;
  requestedAt: Date;
}

const StockRequestSchema = new Schema<IStockRequest>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  requestedSize: { type: String, required: true },
  requestedAt: { type: Date, default: Date.now },
});

export const StockRequest =
  models.StockRequest ?? model<IStockRequest>("StockRequest", StockRequestSchema);
