import { useState } from "react"
import AxiosInstance from "../../api/AxiosInterCepters"
import { User, Phone, Mail, Lock, ArrowRight, Loader2, Check } from "lucide-react"

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
    if (step === 3) await sendOTP()
    else setStep(step + 1)
  }

  const sendOTP = async () => {
    try {
      setLoading(true)
      const res = await AxiosInstance.post("/auth/register/", {
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
      })
      if (res.status === 200) setStep(4)
    } catch (err) {
      setError(err.response?.data?.email ? "Email already registered." : "Failed to send OTP.")
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async (e) => {
    e.preventDefault()
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
        window.location.href = "/home"
      }
    } catch {
      setError("Invalid OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { icon: <User className="w-4 h-4"/>, label: "Name" },
    { icon: <Phone className="w-4 h-4"/>, label: "Phone" },
    { icon: <Mail className="w-4 h-4"/>, label: "Email" },
    { icon: <Lock className="w-4 h-4"/>, label: "Verify" }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] relative overflow-hidden font-sans">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-[120px] animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-[2.5rem] p-8 md:p-10">
          
          <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent mb-10">
            Create Account
          </h2>

          {/* New Modern Stepper */}
          <div className="flex justify-between items-center mb-10 px-2">
            {steps.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border ${
                  step > idx + 1 ? "bg-teal-500 border-teal-500 text-white" :
                  step === idx + 1 ? "bg-indigo-500 border-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/20" :
                  "bg-slate-900 border-white/10 text-slate-500"
                }`}>
                  {step > idx + 1 ? <Check className="w-5 h-5"/> : s.icon}
                </div>
              </div>
            ))}
          </div>

          {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs text-center">{error}</div>}

          <div className="min-h-[220px]">
            <form onSubmit={step === 4 ? verifyOTP : handleNext} className="space-y-6 animate-slide-up">
              {step === 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" name="name" value={userData.name} onChange={handleChange} placeholder="John Doe" required className="input-field" />
                </div>
              )}
              {step === 2 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input type="tel" name="phone" value={userData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" required className="input-field" />
                </div>
              )}
              {step === 3 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" name="email" value={userData.email} onChange={handleChange} placeholder="name@example.com" required className="input-field" />
                </div>
              )}
              {step === 4 && (
                <div className="space-y-2 text-center">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Enter 4-Digit OTP</label>
                  <input type="text" name="otp" value={userData.otp} onChange={handleChange} placeholder="0000" maxLength="4" required className="input-field text-center text-2xl tracking-[0.5em]" />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-teal-600 text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : step === 3 ? "Send Code" : step === 4 ? "Create Account" : "Next Step"}
                {!loading && step < 3 && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-10">
            Already have an account? <a href="/login" className="text-indigo-400 font-semibold hover:underline">Login</a>
          </p>
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem 1.25rem;
          border-radius: 1rem;
          color: white;
          transition: all 0.3s;
        }
        .input-field:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
      `}</style>
    </div>
  )
}

export default RegisterPage