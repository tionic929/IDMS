import React, { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./layout/sidebar";
import Welcome from './pages/welcome';
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import { useAuth, type User } from './context/AuthContext';
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import Header from './layout/header';

// Lazy Load Admin Components
const Dashboard = lazy(() => import("./pages/dashboard"));
const ApplicantsIndex = lazy(() => import("./pages/Admin/Applicants/ApplicantsIndex"));
const ImportReports = lazy(() => import("./pages/Admin/Reports/importReports"));
const DepartmentList = lazy(() => import("./pages/Admin/Departments/DepartmentsIndex"));
const CardManagement = lazy(() => import("./pages/cardManagement"));

// Lazy Load Other Pages
const ProfileDetails = lazy(() => import("./pages/profileDetails"));
const Instructions = lazy(() => import("./pages/instructions"));

// Simple loading fallback for lazy components
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center bg-white/50 backdrop-blur-sm">
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
              <Route path="/" element={<Welcome />}/>
              <Route path="/submit-details" element={<ProfileDetails />} />
              <Route path="/how-to-submit" element={<Instructions />} />
              
              <Route 
                path="/login" 
                element={user ? <Navigate to="/dashboard" replace /> : <Login />}
              />
              <Route 
                path="/register" 
                element={user ? <Navigate to="/dashboard" replace /> : <Register />}
              />
              
              <Route element={<ProtectedRoute />}>
                <Route 
                  path="/card-management"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <CardManagement />
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

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;