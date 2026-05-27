# E-Commerce Sales Forecasting

A working college-demo prototype for an e-commerce sales forecasting system. The app includes
customer shopping flows, admin product management, sales analytics, and a future sales
forecasting dashboard based on seeded historical sales data.

## Features

- Responsive React storefront with product search and category filters
- Customer registration and login demo
- Shopping cart with quantity updates and checkout
- Order management table
- Admin dashboard with revenue, orders, customers, stock, and product performance
- Admin product add, edit, delete, and stock management
- Sales analytics charts for monthly revenue and category performance
- Six-month machine learning sales forecast with model metrics and business insights
- Python ML module with preprocessing, feature engineering, train/test split, and model evaluation
- Express API with seeded in-memory users, products, orders, and sales data

## Tech Stack

- Frontend: React, Vite, React Router, Recharts, Lucide icons
- Backend: Node.js, Express
- Machine Learning: Python, Pandas, NumPy, Scikit-learn
- Data: Seeded in-memory demo data, no MongoDB required for this prototype

## Demo Accounts

Admin:

```text
Email: admin@forecast.test
Password: admin123
```

Customer:

```text
Email: customer@forecast.test
Password: customer123
```

## Run Locally

Install dependencies:

```bash
npm install
```

Install Python ML dependencies:

```bash
npm run setup:python
```

Start frontend and backend together:

```bash
npm run dev
```

Or start them separately:

```bash
npm run server
npm run client
```

Open the app:

```text
http://localhost:5173/
```

The API runs at:

```text
http://localhost:5000/
```

## Important Routes

Frontend:

- `/`
- `/products`
- `/cart`
- `/login`
- `/register`
- `/orders`
- `/admin`
- `/admin/products`
- `/admin/analytics`
- `/admin/forecast`

Backend:

- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/analytics/summary`
- `GET /api/analytics/sales`
- `GET /api/forecast`

## Machine Learning Module

The forecast endpoint runs [ml/train_forecast.py](ml/train_forecast.py), which:

- Loads historical monthly sales data
- Cleans and sorts records using Pandas
- Creates ML features such as month index, calendar month, quarter, festival season, previous revenue, and previous orders
- Trains Scikit-learn models with a train/test split
- Compares Linear Regression and Random Forest Regressor
- Returns MAE, RMSE, and R2 score
- Generates the next six months of predicted revenue and orders

If `.venv/` is available, the backend automatically uses `.venv/bin/python`. If Scikit-learn is
not installed, the Python script can still return a NumPy regression fallback so the demo does
not break.

## Notes

This prototype intentionally prioritizes a reliable submission/demo experience. Data resets when
the backend restarts because it is stored in memory. MongoDB can be added later without
changing the visible app flow.
