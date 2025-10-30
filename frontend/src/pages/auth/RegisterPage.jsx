import React, { useState } from "react";
import AxiosInstance from "../../api/AxiosInterCepters";

function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    email: "",
    otp: "",
  });

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError("");

    if (step === 3) {
      await sendOTP();
    } else {
      setStep(step + 1);
    }
  };

  const sendOTP = async () => {
    try {
      setLoading(true);
      const res = await AxiosInstance.post("/auth/register/", {
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
      });

      if (res.status === 200) {
        setStep(4);
      }
    } catch (err) {
      if (err.response?.data?.email) {
        setError("Email already registered. Please login instead.");
      } else {
        setError("Failed to send OTP. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await AxiosInstance.post("/auth/verify-otp/", {
        email: userData.email,
        otp: userData.otp,
      });

      if (res.status === 201) {
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        alert("✅ Account created successfully!");
        window.location.href = "/home";
      }
    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-200">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">
        <h2 className="text-center text-2xl font-bold text-indigo-600 mb-6">
          House of Anbu
        </h2>

        {error && (
          <p className="text-red-500 text-center mb-3 text-sm">{error}</p>
        )}

        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Enter your name
              </label>
              <input
                type="text"
                name="name"
                value={userData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              Next
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Enter your phone number
              </label>
              <input
                type="text"
                name="phone"
                value={userData.phone}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              Next
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Enter your email address
              </label>
              <input
                type="email"
                name="email"
                value={userData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={verifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Enter 4-digit OTP
              </label>
              <input
                type="text"
                name="otp"
                value={userData.otp}
                onChange={handleChange}
                maxLength="4"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
