export const users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@forecast.test',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 2,
    name: 'Demo Customer',
    email: 'customer@forecast.test',
    password: 'customer123',
    role: 'customer'
  }
];

export const products = [
  {
    id: 1,
    name: 'Aurora Smart Watch',
    category: 'Electronics',
    price: 2499,
    stock: 42,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    description: 'Fitness tracking, notifications, and a clean everyday design.'
  },
  {
    id: 2,
    name: 'Nova Wireless Headphones',
    category: 'Electronics',
    price: 3299,
    stock: 28,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    description: 'Comfortable wireless headphones with long battery life.'
  },
  {
    id: 3,
    name: 'Urban Denim Jacket',
    category: 'Fashion',
    price: 1899,
    stock: 64,
    image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80',
    description: 'Classic denim layer for casual and semi-formal looks.'
  },
  {
    id: 4,
    name: 'Everyday Running Shoes',
    category: 'Fashion',
    price: 2799,
    stock: 37,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    description: 'Lightweight shoes built for daily comfort and training.'
  },
  {
    id: 5,
    name: 'Ceramic Dinner Set',
    category: 'Home',
    price: 2199,
    stock: 23,
    image: 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=900&q=80',
    description: 'Minimal ceramic dinnerware set for modern dining tables.'
  },
  {
    id: 6,
    name: 'Focus Desk Lamp',
    category: 'Home',
    price: 999,
    stock: 55,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
    description: 'Adjustable LED lamp for study desks and home offices.'
  },
  {
    id: 7,
    name: 'Hydra Steel Bottle',
    category: 'Lifestyle',
    price: 699,
    stock: 91,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80',
    description: 'Reusable insulated bottle for travel, college, and work.'
  },
  {
    id: 8,
    name: 'Canvas Travel Backpack',
    category: 'Lifestyle',
    price: 1599,
    stock: 31,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
    description: 'Durable backpack with laptop storage and travel pockets.'
  }
];

export const orders = [
  {
    id: 1001,
    userId: 2,
    customer: 'Demo Customer',
    status: 'Delivered',
    date: '2026-01-18',
    items: [
      { productId: 1, name: 'Aurora Smart Watch', quantity: 2, price: 2499 },
      { productId: 7, name: 'Hydra Steel Bottle', quantity: 3, price: 699 }
    ]
  },
  {
    id: 1002,
    userId: 2,
    customer: 'Demo Customer',
    status: 'Packed',
    date: '2026-02-09',
    items: [
      { productId: 2, name: 'Nova Wireless Headphones', quantity: 1, price: 3299 },
      { productId: 5, name: 'Ceramic Dinner Set', quantity: 1, price: 2199 }
    ]
  },
  {
    id: 1003,
    userId: 2,
    customer: 'Demo Customer',
    status: 'In Transit',
    date: '2026-03-21',
    items: [
      { productId: 4, name: 'Everyday Running Shoes', quantity: 2, price: 2799 },
      { productId: 8, name: 'Canvas Travel Backpack', quantity: 1, price: 1599 }
    ]
  }
];

export const monthlySales = [
  { month: 'Jun 2025', revenue: 82000, orders: 84 },
  { month: 'Jul 2025', revenue: 91000, orders: 92 },
  { month: 'Aug 2025', revenue: 98000, orders: 103 },
  { month: 'Sep 2025', revenue: 112000, orders: 119 },
  { month: 'Oct 2025', revenue: 146000, orders: 151 },
  { month: 'Nov 2025', revenue: 168000, orders: 176 },
  { month: 'Dec 2025', revenue: 184000, orders: 190 },
  { month: 'Jan 2026', revenue: 132000, orders: 138 },
  { month: 'Feb 2026', revenue: 141000, orders: 147 },
  { month: 'Mar 2026', revenue: 156000, orders: 161 },
  { month: 'Apr 2026', revenue: 171000, orders: 179 },
  { month: 'May 2026', revenue: 188000, orders: 198 }
];
