import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, NavLink, Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Home,
  LineChart as LineChartIcon,
  LogOut,
  Menu,
  PackagePlus,
  Search,
  ShoppingCart,
  Sparkles,
  UserRound
} from 'lucide-react';
import './styles.css';

const API_BASE = '/api';

const AppContext = createContext(null);

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('forecast-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem('forecast-cart');
    return stored ? JSON.parse(stored) : [];
  });
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const loadProducts = async () => {
    setProductsLoading(true);
    const data = await api('/products');
    setProducts(data);
    setProductsLoading(false);
  };

  useEffect(() => {
    loadProducts().catch(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('forecast-user', JSON.stringify(user));
    else localStorage.removeItem('forecast-user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('forecast-cart', JSON.stringify(cart));
  }, [cart]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id, quantity) => {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    setUser,
    cart,
    setCart,
    cartTotal,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    products,
    productsLoading,
    loadProducts,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useApp() {
  return useContext(AppContext);
}

function Shell() {
  const { cart, user, logout } = useApp();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/products', label: 'Products', icon: Boxes },
    { to: '/cart', label: `Cart ${cart.length ? `(${cart.length})` : ''}`, icon: ShoppingCart },
    { to: '/orders', label: 'Orders', icon: ClipboardList }
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin', icon: BarChart3 },
    { to: '/admin/products', label: 'Manage', icon: PackagePlus },
    { to: '/admin/analytics', label: 'Analytics', icon: LineChartIcon },
    { to: '/admin/forecast', label: 'Forecast', icon: Sparkles }
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">FS</span>
          <span>
            <strong>ForecastStore</strong>
            <small>Sales Forecasting</small>
          </span>
        </Link>

        <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-label="Menu">
          <Menu size={20} />
        </button>

        <nav className={`nav ${open ? 'open' : ''}`}>
          {[...links, ...(user?.role === 'admin' ? adminLinks : [])].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="user-area">
          {user ? (
            <>
              <span className="user-chip">
                <UserRound size={16} />
                {user.name}
              </span>
              <button className="ghost-button" onClick={logout}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <Link className="primary-button compact" to="/login">
              Login
            </Link>
          )}
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
          <Route path="/admin/products" element={<AdminOnly><AdminProducts /></AdminOnly>} />
          <Route path="/admin/analytics" element={<AdminOnly><AnalyticsPage /></AdminOnly>} />
          <Route path="/admin/forecast" element={<AdminOnly><ForecastPage /></AdminOnly>} />
        </Routes>
      </main>
    </div>
  );
}

function AdminOnly({ children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function HomePage() {
  const { products, addToCart } = useApp();
  const featured = products.slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">E-Commerce Sales Forecasting Prototype</span>
          <h1>ForecastStore</h1>
          <p>
            A working demo for product browsing, customer orders, admin analytics, and future
            sales prediction based on historical sales trends.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/products">Browse Products</Link>
            <Link className="secondary-button" to="/admin/forecast">View Forecast</Link>
          </div>
        </div>
        <div className="hero-panel">
          <div>
            <small>Projected Revenue</small>
            <strong>₹2.63L</strong>
            <span>Nov 2026 forecast</span>
          </div>
          <div>
            <small>Active Products</small>
            <strong>{products.length}</strong>
            <span>Across 4 categories</span>
          </div>
          <div>
            <small>Demo Logins</small>
            <strong>Admin + Customer</strong>
            <span>Ready for presentation</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Featured Products</span>
            <h2>Products customers can order</h2>
          </div>
          <Link className="text-link" to="/products">See all</Link>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />
          ))}
        </div>
      </section>
    </>
  );
}

function ProductsPage() {
  const { products, productsLoading, addToCart } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...new Set(products.map((product) => product.category))];

  const visibleProducts = products.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category;
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Storefront</span>
          <h1>Product Display</h1>
        </div>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
        </label>
        <div className="segments">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? 'active' : ''}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {productsLoading ? (
        <p className="muted">Loading products...</p>
      ) : (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductCard({ product, onAdd }) {
  return (
    <article className="product-card">
      <img src={product.image} alt={product.name} />
      <div className="product-body">
        <div className="product-meta">
          <span>{product.category}</span>
          <span>{product.stock} in stock</span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-footer">
          <strong>{currency(product.price)}</strong>
          <button className="primary-button compact" onClick={onAdd}>
            <ShoppingCart size={16} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

function CartPage() {
  const { cart, cartTotal, updateCartQuantity, removeFromCart, setCart, user, loadProducts } = useApp();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const checkout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const order = await api('/orders', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        customer: user.name,
        items: cart
      })
    });
    setCart([]);
    await loadProducts();
    setMessage(`Order #${order.id} placed successfully.`);
  };

  return (
    <section className="section page-section narrow">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Shopping Cart</span>
          <h1>Review Order</h1>
        </div>
      </div>

      {message && <div className="success-banner"><CheckCircle2 size={18} />{message}</div>}

      {!cart.length ? (
        <EmptyState title="Your cart is empty" action={<Link className="primary-button" to="/products">Browse Products</Link>} />
      ) : (
        <>
          <div className="list-card">
            {cart.map((item) => (
              <div className="cart-row" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div>
                  <strong>{item.name}</strong>
                  <span>{currency(item.price)}</span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateCartQuantity(item.id, Number(event.target.value))}
                />
                <strong>{currency(item.price * item.quantity)}</strong>
                <button className="ghost-button" onClick={() => removeFromCart(item.id)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="checkout-bar">
            <span>Total Amount</span>
            <strong>{currency(cartTotal)}</strong>
            <button className="primary-button" onClick={checkout}>Place Order</button>
          </div>
        </>
      )}
    </section>
  );
}

function LoginPage() {
  const { setUser } = useApp();
  const [form, setForm] = useState({ email: 'admin@forecast.test', password: 'admin123' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(form) });
      setUser(data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/products');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout title="Login">
      <form className="form-card" onSubmit={submit}>
        <p className="muted">Admin: admin@forecast.test / admin123</p>
        <p className="muted">Customer: customer@forecast.test / customer123</p>
        <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" />
        <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" />
        {error && <p className="error-text">{error}</p>}
        <button className="primary-button" type="submit">Login</button>
        <Link className="text-link" to="/register">Create a customer account</Link>
      </form>
    </AuthLayout>
  );
}

function RegisterPage() {
  const { setUser } = useApp();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      setUser(data.user);
      navigate('/products');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout title="Register">
      <form className="form-card" onSubmit={submit}>
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" />
        <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" />
        <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" />
        {error && <p className="error-text">{error}</p>}
        <button className="primary-button" type="submit">Create Account</button>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ title, children }) {
  return (
    <section className="auth-page">
      <div>
        <span className="eyebrow">Secure Access</span>
        <h1>{title}</h1>
        <p>Use demo accounts to show customer and admin modules quickly.</p>
      </div>
      {children}
    </section>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api('/orders').then(setOrders);
  }, []);

  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Order Management</span>
          <h1>Orders</h1>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.date}</td>
                <td><span className="status">{order.status}</span></td>
                <td>{currency(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    api('/analytics/summary').then(setSummary);
    api('/analytics/sales').then(setSales);
  }, []);

  if (!summary) return <section className="section page-section"><p>Loading dashboard...</p></section>;

  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Admin Dashboard</span>
          <h1>Business Overview</h1>
        </div>
      </div>
      <StatsGrid summary={summary} />
      <div className="dashboard-grid">
        <ChartPanel title="Monthly Sales">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => currency(value)} />
              <Area type="monotone" dataKey="revenue" stroke="#186f65" fill="#b8efe1" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Top Products">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary.productPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip formatter={(value) => currency(value)} />
              <Bar dataKey="revenue" fill="#d88c45" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </section>
  );
}

function StatsGrid({ summary }) {
  const stats = [
    { label: 'Revenue', value: currency(summary.totalRevenue), icon: BarChart3 },
    { label: 'Orders', value: summary.totalOrders, icon: ClipboardList },
    { label: 'Customers', value: summary.customerCount, icon: UserRound },
    { label: 'Low Stock', value: summary.lowStockCount, icon: Boxes }
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div className="stat-card" key={stat.label}>
            <Icon size={22} />
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        );
      })}
    </div>
  );
}

function AdminProducts() {
  const { products, loadProducts } = useApp();
  const emptyForm = { name: '', category: 'Electronics', price: '', stock: '', image: '', description: '' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const saveProduct = async (event) => {
    event.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const path = editingId ? `/products/${editingId}` : '/products';
    await api(path, { method, body: JSON.stringify(form) });
    setForm(emptyForm);
    setEditingId(null);
    await loadProducts();
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm(product);
  };

  const deleteProduct = async (id) => {
    await api(`/products/${id}`, { method: 'DELETE' });
    await loadProducts();
  };

  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Product Management</span>
          <h1>Admin Products</h1>
        </div>
      </div>
      <div className="admin-layout">
        <form className="form-card" onSubmit={saveProduct}>
          <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Product name" />
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            <option>Electronics</option>
            <option>Fashion</option>
            <option>Home</option>
            <option>Lifestyle</option>
          </select>
          <input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Price" />
          <input type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} placeholder="Stock" />
          <input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="Image URL" />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" />
          <button className="primary-button" type="submit">{editingId ? 'Update Product' : 'Add Product'}</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{currency(product.price)}</td>
                  <td>{product.stock}</td>
                  <td className="actions">
                    <button className="ghost-button" onClick={() => editProduct(product)}>Edit</button>
                    <button className="danger-button" onClick={() => deleteProduct(product.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    api('/analytics/summary').then(setSummary);
    api('/analytics/sales').then(setSales);
  }, []);

  if (!summary) return <section className="section page-section"><p>Loading analytics...</p></section>;

  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Sales Analytics</span>
          <h1>Reports and Performance</h1>
        </div>
      </div>
      <StatsGrid summary={summary} />
      <div className="dashboard-grid">
        <ChartPanel title="Revenue Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => currency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#186f65" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Category Performance">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary.categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="units" fill="#d88c45" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </section>
  );
}

function ForecastPage() {
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    api('/forecast').then(setForecast);
  }, []);

  if (!forecast) return <section className="section page-section"><p>Loading forecast...</p></section>;

  const chartData = [
    ...forecast.historical.map((item) => ({ ...item, historicalRevenue: item.revenue })),
    ...forecast.forecast.map((item) => ({ ...item, forecastRevenue: item.revenue }))
  ];

  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Sales Forecasting</span>
          <h1>Future Sales Prediction</h1>
        </div>
      </div>
      <div className="forecast-note">
        <Sparkles size={20} />
        {forecast.method}
      </div>
      {forecast.machineLearning && <MachineLearningPanel details={forecast.machineLearning} />}
      <ChartPanel title="Historical and Forecast Revenue">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => currency(value)} />
            <Line type="monotone" dataKey="historicalRevenue" stroke="#186f65" strokeWidth={3} dot={false} connectNulls />
            <Line type="monotone" dataKey="forecastRevenue" stroke="#d88c45" strokeWidth={3} dot connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
      <div className="insight-grid">
        {forecast.insights.map((insight) => (
          <div className="insight-card" key={insight}>
            <CheckCircle2 size={18} />
            <p>{insight}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MachineLearningPanel({ details }) {
  const metrics = details.metrics || {};
  const metricCards = [
    { label: 'Model', value: details.model },
    { label: 'Training Rows', value: details.trainingRows },
    { label: 'Testing Rows', value: details.testingRows },
    { label: 'MAE', value: metrics.mae === null ? 'N/A' : currency(metrics.mae) },
    { label: 'RMSE', value: metrics.rmse === null ? 'N/A' : currency(metrics.rmse) },
    { label: 'R2 Score', value: metrics.r2 === null ? 'N/A' : metrics.r2 }
  ];

  return (
    <div className="ml-panel">
      <div className="ml-panel-header">
        <div>
          <span className="eyebrow">Machine Learning Module</span>
          <h2>Model Training Summary</h2>
        </div>
        <span className={details.enabled ? 'ml-status ready' : 'ml-status fallback'}>
          {details.libraryStatus}
        </span>
      </div>
      <div className="ml-metrics">
        {metricCards.map((metric) => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="ml-detail-grid">
        <div>
          <h3>Preprocessing</h3>
          <ul>
            {details.preprocessingSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Features Used</h3>
          <div className="feature-list">
            {details.features.map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartPanel({ title, children }) {
  return (
    <div className="chart-panel">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function EmptyState({ title, action }) {
  return (
    <div className="empty-state">
      <ShoppingCart size={36} />
      <h2>{title}</h2>
      {action}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppProvider>
        <Shell />
      </AppProvider>
    </Router>
  );
}

createRoot(document.getElementById('root')).render(<App />);
