import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Lock, Mail } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState<{ email?: string[]; password?: string[] }>({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({}); // Reset errors on every new attempt

    try {
      await login(email, password);
    } catch (err: any) {
      // 2. Handle 422 Validation Errors from Laravel
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors);
        toast.error("Please check the form for errors.");
      } 
      else if (err.response?.status === 403) {
        toast.warning(err.response.data.message || "Your instructor application is pending approval.");
        navigate("/pending");
      } 
      else if (err.response?.status === 401) {
        toast.error("Invalid credentials");
      } 
      else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-800">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to your account to continue</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Email Input Field */}
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className={`w-5 h-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                id="email"
                type="text" // Change to text if you want Laravel to handle email format validation strings
                className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 
                  ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {/* 3. Display Backend Email Error */}
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.email[0]}</p>
            )}
          </div>

          {/* Password Input Field */}
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className={`w-5 h-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                id="password"
                type="password"
                className={`appearance-none block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 
                  ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {/* 3. Display Backend Password Error */}
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.password[0]}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Forgot your password?</a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 
                ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Don't have an account? 
            <Link to='/register' className="ml-1 font-medium text-blue-600 hover:text-blue-500">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;