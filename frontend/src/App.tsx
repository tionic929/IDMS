import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./layout/sidebar";
import Welcome from './pages/welcome';
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import { useAuth, type User } from './context/AuthContext';
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import Dashboard from "./pages/dashboard";
import ProfileDetails from "./pages/profileDetails";
import Instructions from "./pages/instructions";
import ApplicantsIndex from "./pages/Admin/Applicants/ApplicantsIndex";
import ImportReports from "./pages/Admin/Reports/importReports";
import DepartmentList from "./pages/Admin/Departments/DepartmentsIndex";

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
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  return (
    // 1. h-screen + overflow-hidden prevents the whole window from scrolling
    <div className="flex h-screen w-full bg-white dark:bg-[#eef3ff] overflow-hidden">
      <ToastContainer theme="dark" />
      
      {/* 2. Sidebar is fixed in height by the parent's h-screen */}
      {user && isAdmin && <Sidebar />}
      
      {/* 3. Main container needs flex-1 to fill remaining width and overflow-y-auto to scroll */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scrollbar">
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
        </main>
      </div>
    </div>
  );
};

export default App;