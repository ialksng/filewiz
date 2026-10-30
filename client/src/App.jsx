import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import { LoaderProvider } from "./context/LoaderContext";
import { FileProvider } from "./context/FileContext";
import { AuthProvider } from "./context/AuthContext"; 
import Loader from "./components/Loader";
import { tools } from "./services/toolDefinitions";
import { PremiumProvider } from "./context/PremiumContext";

// Lazy-loaded pages
const CategoryTools = lazy(() => import("./pages/CategoryTools")); 
const ToolWorkspace = lazy(() => import("./pages/ToolWorkspace"));
const FileWorkspace = lazy(() => import("./pages/FileWorkspace"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProductDirectory = lazy(() => import("./pages/FileWiz"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ShortLinkRedirect = lazy(() => import("./pages/ShortLinkRedirect"));

function LegacyImageToolRedirect() {
  const { tool } = useParams();
  const match = tools.find((item) => item.category === 'Image' && (
    item.path.split('/').at(-1) === tool || item.id === tool || item.engine === tool
  ));
  return <Navigate to={match ? `/tools/image/${match.engine || match.id}` : '/tools/image'} replace />;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Loader />
    </div>
  );
}

function RouteContent() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const attemptedReloadRestore = useRef(false);

  useEffect(() => {
    const isReload = window.performance?.getEntriesByType?.('navigation')?.[0]?.type === 'reload';

    if (!attemptedReloadRestore.current) {
      attemptedReloadRestore.current = true;

      if (pathname === '/' && isReload) {
        try {
          const previousRoute = window.sessionStorage.getItem('filewiz:last-route')
            || window.sessionStorage.getItem('filewiz:last-workspace');
          if (previousRoute?.startsWith('/') && !previousRoute.startsWith('//')) {
            navigate(previousRoute, { replace: true });
            return;
          }
        } catch {
          // Storage can be unavailable in private browsing; normal routing still works.
        }
      }
    }

    try {
      if (pathname !== '/') {
        window.sessionStorage.setItem('filewiz:last-route', `${pathname}${search}${hash}`);
      } else {
        window.sessionStorage.removeItem('filewiz:last-route');
        window.sessionStorage.removeItem('filewiz:last-workspace');
      }
    } catch {
      // Storage can be unavailable in private browsing; normal routing still works.
    }

    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, search, hash, navigate]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/s/:code" element={<ShortLinkRedirect />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<ProductDirectory />} />
          <Route path="workspace" element={<FileWorkspace />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="products/*" element={<Navigate to="/" replace />} />
          <Route path="tools" element={<ProductDirectory />} />
          <Route path="convert" element={<ProductDirectory />} />
          <Route path="convert/:tool" element={<ProductDirectory />} />
          <Route path="pdf/:tool" element={<ProductDirectory />} />
          <Route path="image/:tool" element={<LegacyImageToolRedirect />} />
          <Route path="utility/:tool" element={<ProductDirectory />} />
          <Route path="account" element={<ProductDirectory />} />
          <Route path="account/:section" element={<ProductDirectory />} />
          <Route path="dashboard" element={<Navigate to="/account" replace />} />
          <Route path="tools/:type" element={<CategoryTools />} />
          <Route path="tools/:type/:tool" element={<ToolWorkspace />} />
          <Route path="pricing" element={<ProductDirectory />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <LoaderProvider>
      <AuthProvider> 
        <FileProvider>
          <PremiumProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <RouteContent />
          </BrowserRouter>
          </PremiumProvider>
        </FileProvider>
      </AuthProvider>
    </LoaderProvider>
  );
}
