import React, { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import Sidebar from "./layout/sidebar";
// import Welcome from './pages/welcome'; // DELETED
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import { useAuth, type User } from './context/AuthContext';
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Header from './layout/header';

// Lazy Load Admin Components
// Administrative Components
import CardDesignerPage from "./components/CardDesignerPage";
import Dashboard from "./pages/dashboard";
import ApplicantsIndex from "./pages/Admin/Applicants/ApplicantsIndex";
import ImportReports from "./pages/Admin/Reports/importReports";
import ReportsExport from "./pages/Admin/Reports/ReportsExport";
import DepartmentList from "./pages/Admin/Departments/DepartmentsIndex";
import CardManagement from "./pages/cardManagement";
import SettingsPage from "./pages/Admin/Settings/SettingsPage";
import History from "./pages/Admin/History/HistoryIndex";
import NotificationsPage from "./pages/Admin/Notifications/NotificationsPage";
import { SystemSettingsProvider, useSystemSettings } from "./context/SystemSettingsContext";

import DesignerWorkspace from "./components/DesignerWorkspace";
import { StudentProvider } from "./context/StudentContext";
import { TemplateProvider } from "./context/TemplateContext";

// Simple loading fallback for lazy components
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center bg-white/80">
    <div className="flex flex-col items-center gap-2">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Section...</p>
    </div>
  </div>
);

const RoleGuard = ({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: User['role'][]
}) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const MainContent = () => {
  const { user } = useAuth();
  const { settings } = useSystemSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAdmin = user?.role === 'admin';

  // Calculate inverse scale for "Inward Scaling"
  // If scale is 1.2 (120%), the virtual width should be 83.33% (100/1.2)
  const scale = settings.componentScale;
  const invScale = (1 / scale) * 100;

  return (
    <div 
      className="bg-background text-foreground transition-all duration-300 origin-top-left overflow-hidden"
      style={{
        width: `${invScale}%`,
        height: `${invScale}%`,
        transform: `scale(${scale})`,
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    >
      <ToastContainer theme="dark" />
      {user && isAdmin && <Sidebar isCollapsed={isCollapsed} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {user && isAdmin && <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <Login />}
              />
              <Route element={<ProtectedRoute />}>
                <Route
                  element={
                    <StudentProvider>
                      <TemplateProvider>
                        <Outlet />
                      </TemplateProvider>
                    </StudentProvider>
                  }
                >
                  <Route
                    path="/card-management"
                    element={
                      <RoleGuard allowedRoles={['admin']}>
                        <CardManagement />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/card-designer"
                    element={
                      <RoleGuard allowedRoles={['admin']}>
                        <CardDesignerPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <RoleGuard allowedRoles={['admin']}>
                        <Dashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/departments"
                    element={
                      <RoleGuard allowedRoles={['admin']}>
                        <DepartmentList />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/applicants"
                    element={
                      <RoleGuard allowedRoles={['admin']}>
                        <ApplicantsIndex />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/reports/import"
                    element={
                      <RoleGuard allowedRoles={['admin']}>
                        <ImportReports />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/reports/export"
                    element={
                      <RoleGuard allowedRoles={['admin']}>
                        <ReportsExport />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <RoleGuard allowedRoles={['admin']}>
                        <History />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <RoleGuard allowedRoles={['admin']}>
                        <NotificationsPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RoleGuard allowedRoles={['admin']}>
                        <SettingsPage />
                      </RoleGuard>
                    }
                  />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  return (
    <SystemSettingsProvider>
      <MainContent />
    </SystemSettingsProvider>
  );
}

export default App;