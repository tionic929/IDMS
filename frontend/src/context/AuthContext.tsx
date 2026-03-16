import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
// 💡 CRITICAL CHANGE: Import the two new logout functions
import { 
    fetchUser, 
    apiLogin, 
    // apiLogoutAndRevokeToken, 
    // apiLogoutAndClearSession, 
    apiLogout
} from "../api/auth"; 
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";


export interface User {
    uid: any;
    id: number;
    email: string;
    role: 'admin' | 'applicant';
    name: string;
    avatar?: string | null;
    avatar_url?: string | null;
} 

// interface RegistrationPayload {
//     firstName: string;
//     middleInitial: string | null;
//     lastName: string;
//     email: string;
//     password: string;
//     passwordConfirmation: string;
//     dateOfBirth: string;
//     phoneNumber: string;
//     address: string;
//     resumeFile?: File | null;
//     role?: 'instructor' | 'learner'; 
// }

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
    remember: boolean;
    isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [remember] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        fetchUser()
            .then(res => setUser(res.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const updateUser = useCallback((data: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...data } : null);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            await apiLogin(email, password); 
            
            const res = await fetchUser();
            
            if (res && res.data) {
                console.log("Login Success, User Data:", res.data);
                setUser(res.data);
                navigate("/dashboard", { replace: true });
            } else {
                console.warn("Login seemed successful, but fetchUser returned no data.");
                setUser(null);
            }
        } catch (err: any) {
            console.error("Login Error:", err);
            if (err.response?.status === 429) {
                toast.error("⚠️ Too many attempts. Please wait a minute.");
            } else {
                toast.error(err.response?.data?.message || "Login failed.");
            }
            setUser(null);
        }
    }, [navigate, setUser]);

    const logout = useCallback(async () => {
        setIsLoggingOut(true);
        try {
            // 1. Call the API
            await apiLogout();
        } catch (error) {
            console.error("Server-side logout failed:", error);
        } finally {
            // 2. ALWAYS clear local state regardless of server response
            setUser(null);
            
            // 3. 🚨 THE MISSING PIECE: Clear local persistence
            localStorage.removeItem('auth_token'); 
            
            setIsLoggingOut(false);
            // 4. Force a clean redirect
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    
    // 3. CRITICAL FIX: Memoize the entire context value object
    const contextValue = useMemo(() => ({
        user, 
        loading,
        login, 
        logout, 
        updateUser,
        remember,
        isLoggingOut
    }), [user, loading, login, logout, updateUser, remember, isLoggingOut]); 

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be inside AuthProvider");
    return ctx;
};