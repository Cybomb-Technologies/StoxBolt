import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Shield, UserPlus, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CreateAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
  });

  const [errors, setErrors] = useState({});

  // Function to show the specific alert about CRUD access
  const showCrudAccessAlert = () => {
    // Assuming "Logesh V" is the name entered in the form
    const userName = formData.name.trim() || "the user";
    toast.info(`CRUD access enabled for ${userName}`, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authentication token found. Please login again.", {
          position: "top-right",
          autoClose: 5000,
        });
        navigate("/login");
        return;
      }

      const response = await fetch(`${baseURL}/api/users/admins`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.warning("Session expired. Please login again.", {
            position: "top-right",
            autoClose: 5000,
          });
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        
        if (response.status === 403) {
          toast.error("You don't have permission to create admins.", {
            position: "top-right",
            autoClose: 5000,
          });
          return;
        }
        
        throw new Error(data.message || `Error ${response.status}: Failed to create admin`);
      }

      // Show success message
      toast.success(data.message || "Admin created successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

      // Show CRUD access notification
      showCrudAccessAlert();

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "admin",
      });

      setTimeout(() => navigate("/admin/users"), 1000);
    } catch (error) {
      console.error("Create admin error:", error);
      toast.error(error.message || "Failed to create admin. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const passwordStrength = formData.password
    ? formData.password.length >= 8
      ? "strong"
      : formData.password.length >= 6
      ? "medium"
      : "weak"
    : "none";

  // You can also add a button or trigger to show the CRUD access alert manually if needed
  const handleTestCrudAlert = () => {
    showCrudAccessAlert();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* BACK BUTTON */}
        <div className="mb-6">
          <Link
            to="/admin/users"
            className="inline-flex items-center text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin List
          </Link>
        </div>

        {/* CARD */}
        <div className="border-2 border-gray-200 shadow-xl bg-white rounded-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-b">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Create New Admin
                </h2>
                <p className="text-gray-600">Add a new admin to the system</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* NAME */}
              <div className="space-y-2">
                <label className="text-gray-700 font-medium">Full Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className={`w-full h-12 px-4 border rounded-lg ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <label className="text-gray-700 font-medium">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className={`w-full h-12 px-4 border rounded-lg ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <label className="text-gray-700 font-medium">Password *</label>

                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className={`w-full h-12 px-4 pr-12 border rounded-lg ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>

                {/* Password strength */}
                {formData.password && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">
                      Password strength:{" "}
                      <span
                        className={`font-semibold ${
                          passwordStrength === "strong"
                            ? "text-green-600"
                            : passwordStrength === "medium"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {passwordStrength}
                      </span>
                    </p>

                    <div className="h-1.5 w-full bg-gray-200 rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${
                          passwordStrength === "strong"
                            ? "w-full bg-green-500"
                            : passwordStrength === "medium"
                            ? "w-2/3 bg-yellow-500"
                            : "w-1/3 bg-red-500"
                        }`}
                      ></div>
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-2">
                <label className="text-gray-700 font-medium">
                  Confirm Password *
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`w-full h-12 px-4 border rounded-lg ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* ROLE */}
              <div className="space-y-2">
                <label className="text-gray-700 font-medium">Role</label>

                <div className="flex space-x-6">
                  {/* Admin */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={formData.role === "admin"}
                      onChange={handleChange}
                    />
                    <span className="flex items-center space-x-1">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span>Admin</span>
                    </span>
                  </label>

                  
                </div>

                <p className="text-sm text-gray-500">
                  Only superadmins can create admins.
                </p>
              </div>

              {/* PERMISSIONS PREVIEW */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Admin Permissions
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✔ Create & edit own posts</li>
                  <li>✔ View own posts</li>
                  <li>✖ Cannot publish posts</li>
                  <li>✖ Cannot delete posts</li>
                </ul>
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Link
                  to="/admin/users"
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    "Create Admin"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Extra Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-800 flex items-center mb-2">
            <Shield className="h-5 w-5 mr-2" />
            Superadmin Notes
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Only Superadmin can create new admins</li>
            <li>• Passwords are hashed before saving</li>
            <li>• New admins get active status</li>
            <li>• You can deactivate admins anytime</li>
            <li>• Superadmin must be created manually</li>
          </ul>
        </div>

        
      </div>
    </motion.div>
  );
};

export default CreateAdmin;