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
    // register: (data: RegistrationPayload) => Promise<{message: string} | void >;
    remember: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [remember] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        fetchUser()
            .then(res => setUser(res.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    // const register = useCallback(async (data: RegistrationPayload) => {
    //     setLoading(true);

    //     try {
    //         if (data.password !== data.passwordConfirmation) {
    //             throw new Error("Passwords do not match.");
    //         }

    //         const finalRole = data.role || "learner";

    //         const res = await api.post("/register", { ...data, role: finalRole }, {
    //             withCredentials: true
    //         });

    //         if(finalRole === 'learner'){
    //             await api.get("http://localhost:8000/sanctum/csrf-cookie", { withCredentials: true });
    //             const loginRes = await api.post("/login", {
    //                 email: data.email,
    //                 password: data.password
    //             }, { withCredentials: true });

    //             setUser(loginRes.data.user);
    //             navigate("/dashboard");
    //         } else if(finalRole === 'instructor') {
    //             // Instructor: just return success (no error thrown)
    //             return { message: res.data.message || "Application submitted and pending approval" };
    //         }

    //     } catch (error: any) {
    //         console.error("Registration failed:", error);

    //         let msg = 'Registration failed, please try again.';
    //         if(error.response?.data?.message){
    //             msg = error.response.data.message;
    //         } else if(error.message) {
    //             msg = error.message;
    //         }

    //         throw {
    //             message: msg,
    //             response: error.response || null
    //         };
    //     } finally {
    //         setLoading(false);
    //     }
    // }, [setLoading, setUser, navigate]);

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
        try {
            // 1. Call the API
            await apiLogout();
        } catch (error) {
            console.error("Server-side logout failed:", error);
        } finally {
            // 2. ALWAYS clear local state regardless of server response
            setUser(null);

            // 3. 🚨 THE MISSING PIECE: Clear local persistence
            // If you store tokens in localStorage, remove them:
            localStorage.removeItem('auth_token'); 
            
            // If you use cookies, you might need to manually clear them 
            // or ensure axios is configured to drop credentials
            
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
        remember,
    }), [user, loading, login, logout, remember]); 

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