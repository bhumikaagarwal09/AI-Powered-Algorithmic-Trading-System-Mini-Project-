# AI-Powered Algorithmic Trading System Frontend 📈

This directory contains the React/Vite frontend for the AI-Powered Algorithmic Trading System.

## 📂 Architecture

The frontend is built as a Single Page Application (SPA) using React and Vite, focusing on performance, smooth animations, and real-time data visualization.

Key directories (under `/src`):
- `/components` - Reusable UI components.
- `/pages` - Main application views (Dashboard, Portfolio, Orders, Settings, etc.).
- `/context` / `/hooks` - State management and custom hooks.
- `/utils` / `/services` - Helper functions and API interactions.

## 🛠️ Tech Stack
- **Framework** - React 19 & Vite
- **Routing** - React Router DOM (`react-router-dom`)
- **HTTP Client** - Axios (`axios`)
- **Animations** - Framer Motion (`framer-motion`)
- **Icons** - Lucide React (`lucide-react`)
- **Charting** - Recharts (`recharts`)

## 🔗 Connecting to the Backend

The frontend communicates with the Node.js backend API. Ensure you have the API URL configured.

Create a `.env.local` file in the root of the `frontend/frontend` directory:
```env
VITE_API_URL=http://localhost:5000
# Or the production backend URL
```

## 🔑 Running Locally

**1. Navigate into the frontend directory**
```bash
cd frontend/frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the development server**
```bash
npm run dev
```
*(Typically runs on `http://localhost:5173`)*

**4. Build for Production**
```bash
npm run build
```
*(Generates the production-ready build in the `dist/` directory)*
