// lib/products.ts — Static product catalog
// In production: store this in MongoDB and seed it once

export type Size = "S" | "M" | "L" | "XL" | "XXL";
export type Category = "t-shirt" | "pants";

export interface Product {
  _id: string;
  name: string;
  brand: string;
  price: number;
  category: Category;
  image: string; // URL or path to /public
  availableSizes: Size[];
  description: string;
  tags: string[];
}

export const PRODUCTS: Product[] = [
  {
    _id: "prod_001",
    name: "Classic White Tee",
    brand: "Basics",
    price: 24.99,
    category: "t-shirt",
    image: "/products/white-tee.jpg",
    availableSizes: ["S", "M", "L", "XL"],
    description: "Essential crew-neck tee in soft 100% cotton.",
    tags: ["basics", "casual", "cotton", "everyday"],
  },
  {
    _id: "prod_002",
    name: "Oversized Graphic Tee",
    brand: "UrbanWear",
    price: 34.99,
    category: "t-shirt",
    image: "/products/graphic-tee.jpg",
    availableSizes: ["M", "L", "XL", "XXL"],
    description: "Boxy graphic tee with bold street-art print.",
    tags: ["streetwear", "graphic", "oversized", "urban"],
  },
  {
    _id: "prod_003",
    name: "Slim Polo Shirt",
    brand: "ClassicFit",
    price: 44.99,
    category: "t-shirt",
    image: "/products/polo.jpg",
    availableSizes: ["S", "M", "L"],
    description: "Smart slim-fit polo in breathable piqué cotton.",
    tags: ["polo", "smart", "slim", "office"],
  },
  {
    _id: "prod_004",
    name: "Vintage Band Tee",
    brand: "RetroVibe",
    price: 29.99,
    category: "t-shirt",
    image: "/products/band-tee.jpg",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    description: "Washed-out vintage tee with retro music graphic.",
    tags: ["vintage", "music", "retro", "casual"],
  },
  {
    _id: "prod_005",
    name: "Running Performance Tee",
    brand: "ActiveBase",
    price: 39.99,
    category: "t-shirt",
    image: "/products/running-tee.jpg",
    availableSizes: ["S", "M", "L", "XL"],
    description: "Moisture-wicking performance tee for athletes.",
    tags: ["running", "sport", "performance", "gym", "activewear"],
  },
  {
    _id: "prod_006",
    name: "Slim Chino Pants",
    brand: "FitForm",
    price: 59.99,
    category: "pants",
    image: "/products/chino.jpg",
    availableSizes: ["S", "M", "L", "XL"],
    description: "Tailored slim chinos in stretch cotton twill.",
    tags: ["chino", "slim", "smart casual", "work"],
  },
  {
    _id: "prod_007",
    name: "Cargo Trousers",
    brand: "TacStyle",
    price: 64.99,
    category: "pants",
    image: "/products/cargo.jpg",
    availableSizes: ["M", "L", "XL", "XXL"],
    description: "Multi-pocket cargo pants in durable ripstop fabric.",
    tags: ["cargo", "utility", "outdoor", "streetwear"],
  },
  {
    _id: "prod_008",
    name: "Jogger Pants",
    brand: "ActiveBase",
    price: 49.99,
    category: "pants",
    image: "/products/jogger.jpg",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    description: "Tapered joggers with elastic waist and zip pockets.",
    tags: ["jogger", "sport", "activewear", "running", "gym"],
  },
  {
    _id: "prod_009",
    name: "Smart Dress Pants",
    brand: "CityWear",
    price: 79.99,
    category: "pants",
    image: "/products/dress-pants.jpg",
    availableSizes: ["S", "M", "L"],
    description: "Formal slim-leg trousers for office and events.",
    tags: ["formal", "office", "dress", "smart", "business"],
  },
  {
    _id: "prod_010",
    name: "Denim Jeans",
    brand: "DenimCo",
    price: 69.99,
    category: "pants",
    image: "/products/jeans.jpg",
    availableSizes: ["S", "M", "L", "XL"],
    description: "Classic straight-leg jeans in indigo denim.",
    tags: ["jeans", "denim", "casual", "everyday"],
  },
];

// Helper: find products by search query / tags / category
export function searchProducts(query: string, limit = 5): Product[] {
  const q = query.toLowerCase();
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.includes(q) ||
      p.tags.some((t) => t.includes(q))
  ).slice(0, limit);
}
