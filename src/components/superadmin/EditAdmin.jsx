import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Shield,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  AlertCircle,
  Mail,
  Calendar,
  UserCheck,
  UserX,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

const baseURL = import.meta.env.VITE_API_URL || "https://api.stoxbolt.com";

const EditAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    isActive: true,
    createdAt: "",
  });
  const [errors, setErrors] = useState({});
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    if (id) fetchAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAdmin = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem("adminToken");

      const response = await fetch(`${baseURL}/api/users/admins/${id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to fetch admin (${response.status})`
        );
      }

      if (data.success) {
        const adminData = data.data;
        setFormData({
          name: adminData.name || "",
          email: adminData.email || "",
          password: "",
          confirmPassword: "",
          role: adminData.role || "admin",
          isActive:
            adminData.isActive !== undefined ? adminData.isActive : true,
          createdAt: adminData.createdAt || "",
        });
        setOriginalData(adminData);
      } else {
        throw new Error(data.message || "Failed to load admin data");
      }
    } catch (error) {
      console.error("Error fetching admin:", error);
      alert(error.message || "Failed to load admin data");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Only validate password if it's provided
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const adminToken = localStorage.getItem("adminToken");

      const updateData = {
        name: formData.name,
        email: formData.email,
        isActive: formData.isActive,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${baseURL}/api/users/admins/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update admin");
      }

      if (data.success) {
        alert("Admin updated successfully");
        setTimeout(() => navigate("/admin/users"), 1000);
      }
    } catch (error) {
      alert(error.message || "Failed to update admin");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleToggleStatus = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const action = formData.isActive ? "deactivate" : "reactivate";
      const endpoint = `${baseURL}/api/users/admins/${id}/${action}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} admin`);
      }

      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          isActive: !prev.isActive,
        }));

        alert(`Admin ${action}d successfully`);
      }
    } catch (error) {
      alert(error.message || "Failed to update admin status");
    }
  };

  const passwordStrength = formData.password
    ? formData.password.length >= 8
      ? "strong"
      : formData.password.length >= 6
        ? "medium"
        : "weak"
    : "none";

  const hasChanges = () => {
    if (!originalData) return false;

    return (
      formData.name !== originalData.name ||
      formData.email !== originalData.email ||
      formData.isActive !== originalData.isActive ||
      formData.password !== ""
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            to="/admin/users"
            className="inline-flex items-center px-3 py-2 rounded-lg hover:bg-orange-50 text-orange-600 hover:text-orange-700 text-sm font-medium border border-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin List
          </Link>
        </div>

        {/* Card */}
        <div className="border-2 border-gray-200 shadow-xl overflow-hidden rounded-xl bg-white">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-b p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Edit Admin User
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Update admin details and permissions
                  </p>
                </div>
              </div>

              <div
                className={`px-4 py-2 rounded-full text-sm font-semibold ${formData.isActive
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                  }`}
              >
                {formData.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Admin Info Summary */}
            {originalData && (
              <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">
                        {originalData.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Role</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {originalData.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-sm font-medium text-gray-900">
                        {originalData.createdAt
                          ? new Date(
                            originalData.createdAt
                          ).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-gray-700 font-medium flex items-center"
                >
                  Full Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter admin's full name"
                  disabled={saving}
                  className={`w-full h-12 px-4 rounded-lg border text-base ${errors.name
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300"
                    }`}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-gray-700 font-medium flex items-center"
                >
                  Email Address <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  disabled={saving}
                  className={`w-full h-12 px-4 rounded-lg border text-base ${errors.email
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300"
                    }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                  Change Password (Optional)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Leave password fields empty to keep the current password.
                </p>

                <div className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-gray-700 font-medium"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter new password (leave empty to keep current)"
                        disabled={saving}
                        className={`w-full h-12 px-4 pr-10 rounded-lg border text-base ${errors.password
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            Password strength:
                          </span>
                          <span
                            className={`text-xs font-semibold ${passwordStrength === "strong"
                                ? "text-green-600"
                                : passwordStrength === "medium"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                          >
                            {passwordStrength.charAt(0).toUpperCase() +
                              passwordStrength.slice(1)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength === "strong"
                                ? "w-full bg-green-500"
                                : passwordStrength === "medium"
                                  ? "w-2/3 bg-yellow-500"
                                  : "w-1/3 bg-red-500"
                              }`}
                          />
                        </div>
                      </div>
                    )}

                    {errors.password && (
                      <p className="text-sm text-red-500 mt-2">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-gray-700 font-medium"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm the new password"
                      disabled={saving}
                      className={`w-full h-12 px-4 rounded-lg border text-base ${errors.confirmPassword
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300"
                        }`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Control */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Admin Status
                </h3>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200 gap-4">
                  <div className="flex items-center space-x-3">
                    {formData.isActive ? (
                      <UserCheck className="h-8 w-8 text-green-600" />
                    ) : (
                      <UserX className="h-8 w-8 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {formData.isActive
                          ? "Active Account"
                          : "Inactive Account"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formData.isActive
                          ? "Admin can log in and perform actions"
                          : "Admin cannot log in or perform actions"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={saving || originalData?.role === "superadmin"}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${formData.isActive
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                      } ${saving || originalData?.role === "superadmin"
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                      }`}
                  >
                    {formData.isActive ? "Deactivate Admin" : "Activate Admin"}
                  </button>
                </div>
                {originalData?.role === "superadmin" && (
                  <p className="text-sm text-gray-500 mt-2">
                    Note: Superadmin status cannot be changed
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse md:flex-row md:justify-between items-center gap-3 pt-6 border-t">
                <div className="text-sm text-gray-500">
                  {hasChanges() ? (
                    <span className="flex items-center text-orange-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      You have unsaved changes
                    </span>
                  ) : (
                    "All changes saved"
                  )}
                </div>

                <div className="flex gap-3">
                  <Link
                    to="/admin/users"
                    className={`px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 ${saving ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={saving || !hasChanges()}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center min-w-[140px] ${saving || !hasChanges()
                        ? "bg-orange-300 cursor-not-allowed text-white"
                        : "bg-orange-600 hover:bg-orange-700 text-white"
                      }`}
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Permissions Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Admin Permissions Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-blue-700">
                Create and edit own posts
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-blue-700">View own posts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-red-500" />
              </div>
              <span className="text-sm text-blue-700">
                Cannot publish posts (Superadmin only)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-red-500" />
              </div>
              <span className="text-sm text-blue-700">
                Cannot delete posts (Superadmin only)
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EditAdmin;
