import { useState } from "react"
import AxiosInstance from "../../api/AxiosInterCepters"

function LoginPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!formData.email.trim()) return

    try {
      setLoading(true)
      const res = await AxiosInstance.post("/auth/login/", {
        email: formData.email,
      })

      if (res.status === 200) {
        setStep(2)
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setError("Email not registered. Please sign up first.")
      } else {
        setError("Error sending OTP. Try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (!formData.otp.trim()) return

    try {
      setLoading(true)
      const res = await AxiosInstance.post("/auth/login/verify-otp/", {
        email: formData.email,
        otp: formData.otp,
      })

      if (res.status === 200) {
        localStorage.setItem("access", res.data.access)
        localStorage.setItem("refresh", res.data.refresh)
        localStorage.setItem("user", JSON.stringify(res.data.user))

        alert("Login successful!")
        window.location.href = "/home"
      }
    } catch (error) {
      setError("Invalid OTP. Please try again.")
      setFormData({ ...formData, otp: "" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 animate-fade-in">
        
          <h2
            className="text-center text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            House of Anbu
          </h2>
          <p className="text-center text-sm text-gray-400 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Secure authentication with OTP
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm animate-slide-down">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-2 mb-8">
            <div
              className={`h-1 rounded-full transition-all duration-500 ${step === 1 ? "w-12 bg-gradient-to-r from-purple-400 to-pink-400" : "w-2 bg-gray-600"}`}
            ></div>
            <div
              className={`h-1 rounded-full transition-all duration-500 ${step === 2 ? "w-12 bg-gradient-to-r from-blue-400 to-purple-400" : "w-2 bg-gray-600"}`}
            ></div>
          </div>

          <div className="relative h-64 overflow-hidden">
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-6 animate-slide-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Enter your email address</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                      className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:border-white/40"
                    />
                
                  </div>
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
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-6 animate-slide-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Enter 4-digit OTP</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="0000"
                      maxLength="4"
                      required
                      className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-center text-2xl tracking-widest transition-all duration-300 hover:border-white/40 font-semibold"
                    />
                    
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center gap-2"
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
                      Verify & Login
                      <span>✓</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-semibold hover:from-purple-300 hover:to-pink-300 transition-all duration-300 hover:underline"
            >
              Sign up
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

export default LoginPage
