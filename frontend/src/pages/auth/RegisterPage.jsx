"use client"

import { useState } from "react"
import AxiosInstance from "../../api/AxiosInterCepters"

function RegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    email: "",
    otp: "",
  })

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleNext = async (e) => {
    e.preventDefault()
    setError("")

    if (step === 3) {
      await sendOTP()
    } else {
      setStep(step + 1)
    }
  }

  const sendOTP = async () => {
    try {
      setLoading(true)
      const res = await AxiosInstance.post("/auth/register/", {
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
      })

      if (res.status === 200) {
        setStep(4)
      }
    } catch (err) {
      if (err.response?.data?.email) {
        setError("Email already registered. Please login instead.")
      } else {
        setError("Failed to send OTP. Try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await AxiosInstance.post("/auth/verify-otp/", {
        email: userData.email,
        otp: userData.otp,
      })

      if (res.status === 201) {
        localStorage.setItem("access", res.data.access)
        localStorage.setItem("refresh", res.data.refresh)
        localStorage.setItem("user", JSON.stringify(res.data.user))

        alert("Account created successfully!")
        window.location.href = "/home"
      }
    } catch {
      setError("Invalid OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = ["Name", "Phone", "Email", "Verify"]
  const stepIcons = ["👤", "📱", "✉️", "🔐"]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 animate-fade-in">

          <h2
            className="text-center text-3xl font-bold bg-gradient-to-r from-indigo-400 via-teal-400 to-blue-400 bg-clip-text text-transparent mb-2 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            House of Anbu
          </h2>
          <p className="text-center text-sm text-gray-400 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Create your account
          </p>

          <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex justify-between items-center gap-2">
              {stepLabels.map((label, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-500 ${
                      step > idx
                        ? "bg-gradient-to-r from-green-500 to-teal-500 text-white"
                        : step === idx + 1
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white scale-110"
                          : "bg-white/10 border border-white/20 text-gray-400"
                    }`}
                  >
                    {step > idx ? "✓" : stepIcons[idx]}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-1 mt-3">
              {stepLabels.map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                    step > idx ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-white/10"
                  }`}
                ></div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm animate-slide-down">
              {error}
            </div>
          )}

          <div className="relative h-64 overflow-hidden">
            {step === 1 && (
              <form onSubmit={handleNext} className="space-y-6 animate-slide-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">What's your name?</label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-white/40"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  Next <span>→</span>
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleNext} className="space-y-6 animate-slide-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Enter your phone number</label>
                  <input
                    type="text"
                    name="phone"
                    value={userData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    required
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-white/40"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  Next <span>→</span>
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleNext} className="space-y-6 animate-slide-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Enter your email address</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-white/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 4 && (
              <form onSubmit={verifyOTP} className="space-y-6 animate-slide-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Enter 4-digit OTP</label>
                  <input
                    type="text"
                    name="otp"
                    value={userData.otp}
                    onChange={handleChange}
                    placeholder="0000"
                    maxLength="4"
                    required
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-center text-2xl tracking-widest transition-all duration-300 hover:border-white/40 font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Create Account <span>✓</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            Already have an account?{" "}
            <a
              href="/login"
              className="text-transparent bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text font-semibold hover:from-indigo-300 hover:to-teal-300 transition-all duration-300 hover:underline"
            >
              Login
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in {
          animation: slideIn 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}

export default RegisterPage
