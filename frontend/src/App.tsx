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
import DepartmentList from "./pages/Admin/Departments/DepartmentsIndex";
import CardManagement from "./pages/cardManagement";

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

function App() {
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#eef3ff] overflow-hidden">
      <ToastContainer theme="dark" />
      {user && isAdmin && <Sidebar isCollapsed={isCollapsed} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {user && isAdmin && <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Suspense is REQUIRED when using lazy components */}
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

export default App;