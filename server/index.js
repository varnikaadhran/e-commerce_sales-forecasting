import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { monthlySales, orders, products, users } from './data.js';

const app = express();
const port = process.env.PORT || 5000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const pythonExecutable = existsSync(join(projectRoot, '.venv', 'bin', 'python'))
  ? join(projectRoot, '.venv', 'bin', 'python')
  : 'python3';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const withoutPassword = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const orderTotal = (order) =>
  order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const getNextId = (records) =>
  records.length ? Math.max(...records.map((record) => Number(record.id))) + 1 : 1;

const getProductPerformance = () => {
  const totals = new Map();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = totals.get(item.productId) || {
        id: item.productId,
        name: item.name,
        units: 0,
        revenue: 0
      };
      current.units += item.quantity;
      current.revenue += item.quantity * item.price;
      totals.set(item.productId, current);
    });
  });

  return Array.from(totals.values()).sort((a, b) => b.revenue - a.revenue);
};

const getCategoryPerformance = () => {
  const totals = new Map();
  products.forEach((product) => {
    totals.set(product.category, {
      category: product.category,
      stock: (totals.get(product.category)?.stock || 0) + product.stock,
      products: (totals.get(product.category)?.products || 0) + 1
    });
  });

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return;
      const current = totals.get(product.category);
      current.revenue = (current.revenue || 0) + item.price * item.quantity;
      current.units = (current.units || 0) + item.quantity;
    });
  });

  return Array.from(totals.values()).map((entry) => ({
    ...entry,
    revenue: entry.revenue || 0,
    units: entry.units || 0
  }));
};

const buildForecast = () => {
  const futureMonths = ['Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026'];
  const recent = monthlySales.slice(-6);
  const averageGrowth =
    recent.slice(1).reduce((sum, month, index) => {
      const previous = recent[index].revenue;
      return sum + (month.revenue - previous) / previous;
    }, 0) /
    (recent.length - 1);

  let lastRevenue = monthlySales[monthlySales.length - 1].revenue;
  let lastOrders = monthlySales[monthlySales.length - 1].orders;

  const forecast = futureMonths.map((month, index) => {
    const seasonalBoost = index >= 4 ? 0.08 : 0;
    lastRevenue = Math.round(lastRevenue * (1 + averageGrowth + seasonalBoost));
    lastOrders = Math.round(lastOrders * (1 + averageGrowth * 0.8 + seasonalBoost));
    return {
      month,
      revenue: lastRevenue,
      orders: lastOrders,
      type: 'Forecast'
    };
  });

  return {
    historical: monthlySales.map((entry) => ({ ...entry, type: 'Historical' })),
    forecast,
    method: 'Forecast based on historical sales trend using recent average growth and seasonal demand adjustment.',
    insights: [
      `Expected revenue may reach ₹${forecast[forecast.length - 1].revenue.toLocaleString('en-IN')} by ${forecast[forecast.length - 1].month}.`,
      'Electronics and fashion should receive higher stock priority before festive months.',
      'Current sales trend shows steady demand growth, supporting inventory expansion.'
    ]
  };
};

const buildMlForecast = () => {
  try {
    const output = execFileSync(pythonExecutable, [join(projectRoot, 'ml', 'train_forecast.py')], {
      input: JSON.stringify({ monthlySales }),
      encoding: 'utf8',
      timeout: 10000
    });
    return JSON.parse(output);
  } catch (error) {
    const fallback = buildForecast();
    return {
      ...fallback,
      method: 'Fallback forecast based on historical sales trend. Python ML script could not complete.',
      machineLearning: {
        enabled: false,
        model: 'Fallback trend model',
        libraryStatus: error.message,
        features: ['recent revenue growth', 'seasonal demand adjustment'],
        trainingRows: monthlySales.length,
        testingRows: 0,
        metrics: {
          mae: null,
          rmse: null,
          r2: null
        },
        preprocessingSteps: [
          'Used historical monthly sales records',
          'Calculated recent average growth',
          'Applied seasonal demand adjustment'
        ]
      },
      insights: [
        'Python ML could not run, so the app used the built-in trend fallback.',
        ...fallback.insights
      ]
    };
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'E-Commerce Sales Forecasting' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((entry) => entry.email === email && entry.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.json({ user: withoutPassword(user), token: `demo-token-${user.role}-${user.id}` });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (users.some((user) => user.email === email)) {
    return res.status(409).json({ message: 'This email is already registered.' });
  }

  const user = {
    id: getNextId(users),
    name,
    email,
    password,
    role: 'customer'
  };
  users.push(user);
  res.status(201).json({ user: withoutPassword(user), token: `demo-token-customer-${user.id}` });
});

app.get('/api/products', (_req, res) => {
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const { name, category, price, stock, image, description } = req.body;
  if (!name || !category || Number.isNaN(Number(price)) || Number.isNaN(Number(stock))) {
    return res.status(400).json({ message: 'Product name, category, price, and stock are required.' });
  }

  const product = {
    id: getNextId(products),
    name,
    category,
    price: Number(price),
    stock: Number(stock),
    image: image || 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=900&q=80',
    description: description || 'New product added by admin.'
  };
  products.push(product);
  res.status(201).json(product);
});

app.put('/api/products/:id', (req, res) => {
  const product = products.find((entry) => entry.id === Number(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  Object.assign(product, {
    ...req.body,
    price: req.body.price === undefined ? product.price : Number(req.body.price),
    stock: req.body.stock === undefined ? product.stock : Number(req.body.stock)
  });
  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex((entry) => entry.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  const [deleted] = products.splice(index, 1);
  res.json(deleted);
});

app.get('/api/orders', (_req, res) => {
  res.json(orders.map((order) => ({ ...order, total: orderTotal(order) })));
});

app.post('/api/orders', (req, res) => {
  const { userId, customer, items } = req.body;
  if (!items?.length) {
    return res.status(400).json({ message: 'At least one cart item is required.' });
  }

  const order = {
    id: getNextId(orders),
    userId: userId || 2,
    customer: customer || 'Guest Customer',
    status: 'Placed',
    date: new Date().toISOString().slice(0, 10),
    items: items.map((item) => ({
      productId: item.id || item.productId,
      name: item.name,
      quantity: Number(item.quantity),
      price: Number(item.price)
    }))
  };

  order.items.forEach((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    if (product) product.stock = Math.max(0, product.stock - item.quantity);
  });

  orders.unshift(order);
  res.status(201).json({ ...order, total: orderTotal(order) });
});

app.get('/api/analytics/summary', (_req, res) => {
  const totalRevenue = orders.reduce((sum, order) => sum + orderTotal(order), 0);
  const totalUnits = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  res.json({
    totalRevenue,
    totalOrders: orders.length,
    customerCount: users.filter((user) => user.role === 'customer').length,
    productCount: products.length,
    totalUnits,
    lowStockCount: products.filter((product) => product.stock < 30).length,
    productPerformance: getProductPerformance(),
    categoryPerformance: getCategoryPerformance()
  });
});

app.get('/api/analytics/sales', (_req, res) => {
  res.json(monthlySales);
});

app.get('/api/forecast', (_req, res) => {
  res.json(buildMlForecast());
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
