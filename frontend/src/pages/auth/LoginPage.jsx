import { useState } from "react"
import AxiosInstance from "../../api/AxiosInterCepters"
import { Mail, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"

function LoginPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSent, setIsSent] = useState(false) 
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
        setLoading(false)
        setIsSent(true)
        setTimeout(() => {
          setStep(2)
          setIsSent(false)
        }, 2000)
      }
    } catch (error) {
      setLoading(false)
      setError(error.response?.status === 404 ? "Email not registered. Please sign up first." : "Error sending OTP. Try again later.")
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-[2.5rem] p-8 md:p-10">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              House of Anbu
            </h2>
            <p className="text-slate-400 text-sm mt-2">Secure access to your workspace</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs animate-bounce-subtle text-center">
              {error}
            </div>
          )}

          {/* Stepper Dot */}
          <div className="flex justify-center gap-2 mb-8">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 1 ? "w-12 bg-purple-500" : "w-2 bg-slate-700"}`}></div>
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 2 ? "w-12 bg-blue-500" : "w-2 bg-slate-700"}`}></div>
          </div>

          <div className="min-h-[260px]">
            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-6 animate-slide-up">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-slate-900/50 border border-white/10 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder:text-slate-600 transition-all"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || isSent}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                    isSent ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : isSent ? <CheckCircle2 className="w-5 h-5" /> : "Send Magic Link"}
                  {!loading && !isSent && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6 animate-slide-up">
                <div className="text-center">
                  <p className="text-slate-300 text-sm">Verify code sent to</p>
                  <p className="text-white font-medium text-sm">{formData.email}</p>
                </div>
                
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="· · · ·"
                    maxLength="4"
                    required
                    className="w-full bg-slate-900/50 border border-white/10 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white text-2xl tracking-[0.5em] font-mono transition-all"
                  />
                </div>

                <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-slate-500 hover:text-white transition-colors">
                  Wrong email? Go back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify & Login"}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-10">
            Don't have an account? <a href="/register" className="text-purple-400 font-semibold hover:underline">Sign up</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 2s infinite; }
      `}</style>
    </div>
  )
}

export default LoginPage