import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { supabase } from './lib/supabase';
import { ADMIN_EMAIL } from './lib/constants';
import UpdatePrompt from './components/UpdatePrompt';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { UpdateProvider } from './context/UpdateContext';

const Home = lazy(() => import('./pages/Home'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Cart = lazy(() => import('./pages/Cart'));
const Contact = lazy(() => import('./pages/Contact'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement'));
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement'));
const SalesHistory = lazy(() => import('./pages/admin/SalesHistory'));
const CustomerManagement = lazy(() => import('./pages/admin/CustomerManagement'));
const Promotions = lazy(() => import('./pages/admin/Promotions'));
const Featured = lazy(() => import('./pages/admin/Featured'));
const SiteSettings = lazy(() => import('./pages/admin/SiteSettings'));
const Requests = lazy(() => import('./pages/admin/Requests'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Orders = lazy(() => import('./pages/Orders'));

// High-end Auth Guard (Supabase Session based with Admin Role verification)
const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Verify admin status based on email
      const userEmail = session?.user?.email;
      const adminStatus = userEmail === ADMIN_EMAIL;
      setIsAdmin(adminStatus);
      setLoadingAdmin(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Verify admin status based on email
      const userEmail = session?.user?.email;
      const adminStatus = userEmail === ADMIN_EMAIL;
      setIsAdmin(adminStatus);
      setLoadingAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined || loadingAdmin) {
    return <div className="min-h-screen bg-secondary-light flex items-center justify-center font-serif italic text-primary animate-pulse text-2xl">Cargando Lux HQ...</div>;
  }

  // CRITICAL: Verify user is admin before granting access
  if (!session || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};


const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function App() {
  return (
    <Router>
      <UpdateProvider>
        <ToastProvider>
          <CartProvider>
            <UpdatePrompt />
            <PWAInstallPrompt />
            <Suspense fallback={<div className="min-h-screen bg-secondary-light flex items-center justify-center font-serif italic text-primary animate-pulse text-2xl">Cargando Luxessence...</div>}>
              <Routes>
                {/* Storefront Routes */}
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/catalog" element={<Layout><Catalog /></Layout>} />
                <Route path="/cart" element={<Layout><Cart /></Layout>} />
                <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
                <Route path="/orders" element={<Layout><Orders /></Layout>} />
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
                  <Route path="settings" element={<SiteSettings />} />
                  <Route path="requests" element={<Requests />} />
                </Route>
              </Routes>
            </Suspense>
          </CartProvider>
        </ToastProvider>
      </UpdateProvider>
    </Router>
  );
}

export default App;
