import React, { useState } from "react";
// We'll use 'User' icon for username, 'Mail' for email, and 'Lock' for password
import { User, Mail, Lock } from "lucide-react"; 
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

// Placeholder API function for demonstration. 
// In a real app, you would import this from an API file.
const apiRegister = async (username: string, email: string, password: string) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Simulated registration for: ${username}, ${email}`);
            // Resolve successfully to simulate a successful API call
            resolve({ success: true });
        }, 1500); 
    });
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false); 

  const navigate = useNavigate();

  const { username, email, password, confirmPassword } = formData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Client-side Validation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    
    setIsLoading(true);

    try{
        // 2. Call the registration API
        await apiRegister(username, email, password);
        
        toast.success("Registration successful! Please log in.");
        // Navigate to the login page after successful registration
        navigate("/login"); 
        
    } catch(err: any){
        // Handle API errors (e.g., email already exists, server down)
        const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
        toast.error(errorMessage);
        
    } finally {
        setIsLoading(false); // Stop loading regardless of success or failure
    }
  };

  return (
    // Outer container: centers the form vertically and horizontally (same as login)
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      
      {/* Registration Card Container (same styling) */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-8">
        
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-800">
            Create Your Account
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Join us and start learning today
          </p>
        </div>

        {/* Registration Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Username Input Field */}
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                // Apply the exact same input styling as the login component
                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                placeholder="Username"
                value={username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Email Input Field */}
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                placeholder="Email address"
                value={email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input Field */}
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                placeholder="Password"
                value={password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Confirm Password Input Field */}
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button (Same loading logic and styling) */}
          <div>
            <button
              type="submit"
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 
                ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </button>
          </div>
        </form>
        
        {/* Footer/Login Link */}
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Already have an account? 
            {/* Link back to the login page */}
            <Link to='/login' className="ml-1 font-medium text-blue-600 hover:text-blue-500">
            Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;