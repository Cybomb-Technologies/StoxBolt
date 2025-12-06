import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Helmet } from "react-helmet";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import UserLogin from "./pages/UserLogin";
import UserRegister from "./pages/UserRegister";
import UserForgetPassword from "./pages/UserforgetPassword";
import UserOtpVerification from "./pages/UserOtpVerification";
import UserConfirmPassword from "./pages/UserConfirmPassword";
// Import components directly to avoid any import issues
const Header = React.lazy(() => import("@/components/Header"));
const Footer = React.lazy(() => import("@/components/Footer"));
const HomePage = React.lazy(() => import("@/pages/HomePage"));
const PostDetailPage = React.lazy(() => import("@/pages/PostDetailPage"));
const CategoryPage = React.lazy(() => import("@/pages/CategoryPage"));
const AdminDashboard = React.lazy(() => import("@/pages/admin/AdminDashboard"));
const LoginPage = React.lazy(() => import("@/pages/admin/LoginPage"));
const DisclaimerPage = React.lazy(() => import("@/pages/DisclaimerPage"));
const TermsPage = React.lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = React.lazy(() => import("@/pages/PrivacyPage"));
const RefundPolicyPage = React.lazy(() => import("@/pages/RefundPolicyPage"));
const AboutPage = React.lazy(() => import("@/pages/AboutPage"));
const FloatingIndices = React.lazy(() =>
  import("@/components/FloatingIndices")
);

// Admin Components
const PostList = React.lazy(() => import("@/components/admin/PostList"));
const PostEditor = React.lazy(() =>
  import("@/components/superadmin/PostEditor")
);
const PostPreview = React.lazy(() => import("@/components/admin/PostPreview"));
const BulkUpload = React.lazy(() =>
  import("@/components/superadmin/BulkUpload")
);
const PostScheduler = React.lazy(() =>
  import("@/components/admin/PostScheduler")
);
const ActivityLog = React.lazy(() =>
  import("@/components/superadmin/ActivityLog")
);
const AdminList = React.lazy(() => import("@/components/superadmin/AdminList"));
const CreateAdmin = React.lazy(() =>
  import("@/components/superadmin/CreateAdmin")
);
const EditAdmin = React.lazy(() => import("@/components/superadmin/EditAdmin"));
const Overview = React.lazy(() => import("@/components/admin/Overview"));
const ApprovalQueue = React.lazy(() =>
  import("@/components/superadmin/ApprovalQueue")
);
const AdminPostEditor = React.lazy(() =>
  import("@/components/admin/AdminPostEditor")
);
const MyApprovals = React.lazy(() => import("@/components/admin/MyApprovals"));
const ScheduleApprovals = React.lazy(() =>
  import("@/components/superadmin/ScheduleApprovals")
);

// New components for CRUD/Approval mode routing
const NewPostRouteHandler = React.lazy(() =>
  import("@/components/admin/NewPostRouteHandler")
);

// Loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Main Layout Component
const MainLayout = ({ children }) => {
  return (
    <>
      <ToastContainer />
      <React.Suspense fallback={<LoadingFallback />}>
        <Header />
        <FloatingIndices />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
          <main className="flex-grow">{children}</main>
        </div>
        <Footer />
      </React.Suspense>
    </>
  );
};

// CRUD Access Check Wrapper
const CRUDAccessRoute = ({ children, requireCRUD = false }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (requireCRUD && user.role === "admin" && !user.hasCRUDAccess) {
    return <Navigate to="/admin/my-approvals" replace />;
  }

  return children;
};

// Admin-only Route (no superadmin access needed)
const AdminOnlyRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (user.role !== "admin" && user.role !== "superadmin") {
    return <Navigate to="/admin/overview" replace />;
  }

  return children;
};

// Superadmin-only Route
const SuperadminOnlyRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (user.role !== "superadmin") {
    return <Navigate to="/admin/overview" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Helmet>
          <title>StoxBolt - Your Financial News Platform</title>
          <meta
            name="description"
            content="Stay updated with the latest financial news from India, US, Global markets, Commodities, Forex, Crypto, and IPOs on StoxBolt"
          />
        </Helmet>

        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/user-login" element={<UserLogin />} />
            <Route path="/user-register" element={<UserRegister />} />
            <Route
              path="/user-forget-password"
              element={<UserForgetPassword />}
            />
            <Route
              path="/user-otp-verification"
              element={<UserOtpVerification />}
            />
            <Route
              path="/user-confirm-password"
              element={<UserConfirmPassword />}
            />

            

            {/* Public routes with main layout */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <HomePage />
                </MainLayout>
              }
            />
            <Route
              path="/post/:id"
              element={
                <MainLayout>
                  <PostDetailPage />
                </MainLayout>
              }
            />
            <Route
              path="/category/:category"
              element={
                <MainLayout>
                  <CategoryPage />
                </MainLayout>
              }
            />
            <Route
              path="/disclaimer"
              element={
                <MainLayout>
                  <DisclaimerPage />
                </MainLayout>
              }
            />
            <Route
              path="/terms"
              element={
                <MainLayout>
                  <TermsPage />
                </MainLayout>
              }
            />
            <Route
              path="/privacy"
              element={
                <MainLayout>
                  <PrivacyPage />
                </MainLayout>
              }
            />
            <Route
              path="/refund-policy"
              element={
                <MainLayout>
                  <RefundPolicyPage />
                </MainLayout>
              }
            />
            <Route
              path="/about"
              element={
                <MainLayout>
                  <AboutPage />
                </MainLayout>
              }
            />

            {/* Admin Routes - All nested under AdminDashboard layout */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/admin/overview" replace />}
              />

              {/* Dashboard Overview */}
              <Route
                path="overview"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <Overview />
                  </React.Suspense>
                }
              />
              <Route
                path="posts/edit/new"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <CRUDAccessRoute requireCRUD={false}>
                      <PostEditor />
                    </CRUDAccessRoute>
                  </React.Suspense>
                }
              />
              {/* Posts Management */}
              <Route
                path="posts"
                element={<Navigate to="/admin/posts/list" replace />}
              />
              <Route
                path="posts/list"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <PostList />
                  </React.Suspense>
                }
              />

              {/* New Post - Dynamic route based on CRUD access */}
              <Route
                path="posts/new"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <NewPostRouteHandler />
                  </React.Suspense>
                }
              />

              {/* Edit Post - Only accessible with proper permissions */}
              <Route
                path="posts/edit/:id"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <CRUDAccessRoute requireCRUD={false}>
                      <PostEditor />
                    </CRUDAccessRoute>
                  </React.Suspense>
                }
              />

              {/* Approval System Routes */}
              <Route
                path="posts/new-approval"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <AdminOnlyRoute>
                      <AdminPostEditor />
                    </AdminOnlyRoute>
                  </React.Suspense>
                }
              />

              {/* My Approvals (for admin in approval mode) */}
              <Route
                path="my-approvals"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <AdminOnlyRoute>
                      <MyApprovals />
                    </AdminOnlyRoute>
                  </React.Suspense>
                }
              />

              {/* Edit Approval Post */}
              <Route
                path="my-approvals/edit/:id"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <AdminOnlyRoute>
                      <AdminPostEditor />
                    </AdminOnlyRoute>
                  </React.Suspense>
                }
              />

              {/* Schedule Approvals (superadmin only) */}
              <Route
                path="schedule-approvals"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <SuperadminOnlyRoute>
                      <ScheduleApprovals />
                    </SuperadminOnlyRoute>
                  </React.Suspense>
                }
              />

              {/* Approval Queue (superadmin only) */}
              <Route
                path="approval"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <SuperadminOnlyRoute>
                      <ApprovalQueue />
                    </SuperadminOnlyRoute>
                  </React.Suspense>
                }
              />

              {/* Other Admin Features */}
              <Route
                path="bulk-upload"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <CRUDAccessRoute requireCRUD={true}>
                      <BulkUpload />
                    </CRUDAccessRoute>
                  </React.Suspense>
                }
              />

              <Route
                path="scheduler"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <CRUDAccessRoute requireCRUD={false}>
                      <PostScheduler />
                    </CRUDAccessRoute>
                  </React.Suspense>
                }
              />

              <Route
                path="activity"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <ActivityLog />
                  </React.Suspense>
                }
              />

              <Route
                path="preview"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <PostPreview />
                  </React.Suspense>
                }
              />

              {/* User Management (superadmin only) */}
              <Route
                path="users"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <SuperadminOnlyRoute>
                      <AdminList />
                    </SuperadminOnlyRoute>
                  </React.Suspense>
                }
              />

              <Route
                path="users/create"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <SuperadminOnlyRoute>
                      <CreateAdmin />
                    </SuperadminOnlyRoute>
                  </React.Suspense>
                }
              />

              <Route
                path="users/edit/:id"
                element={
                  <React.Suspense fallback={<LoadingFallback />}>
                    <SuperadminOnlyRoute>
                      <EditAdmin />
                    </SuperadminOnlyRoute>
                  </React.Suspense>
                }
              />
            </Route>

            {/* Preview route (public but with main layout) */}
            <Route
              path="/post/preview"
              element={
                <MainLayout>
                  <React.Suspense fallback={<LoadingFallback />}>
                    <PostPreview />
                  </React.Suspense>
                </MainLayout>
              }
            />

            {/* Redirect any unmatched routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>

        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
