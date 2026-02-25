import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import About from './pages/About';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import OrderManagement from './pages/admin/OrderManagement';
import ProductManagement from './pages/admin/ProductManagement';
import SalesHistory from './pages/admin/SalesHistory';
import CustomerManagement from './pages/admin/CustomerManagement';
import Promotions from './pages/admin/Promotions';
import Featured from './pages/admin/Featured';
import AdminLayout from './components/admin/AdminLayout';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';

// High-end Auth Guard (Supabase Session based)
const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return <div className="min-h-screen bg-secondary-light flex items-center justify-center font-serif italic text-primary animate-pulse text-2xl">Cargando Lux HQ...</div>;
  return session ? children : <Navigate to="/" />;
};


const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function App() {
  return (
    <Router>
      <ToastProvider>
        <CartProvider>
          <Routes>
            {/* Storefront Routes */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/catalog" element={<Layout><Catalog /></Layout>} />
            <Route path="/cart" element={<Layout><Cart /></Layout>} />
            <Route path="/reset-password" element={<Layout><Suspense fallback={null}><ResetPassword /></Suspense></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<Login />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="inventory" element={<ProductManagement />} />
              <Route path="sales" element={<SalesHistory />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="featured" element={<Featured />} />
            </Route>
          </Routes>
        </CartProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
