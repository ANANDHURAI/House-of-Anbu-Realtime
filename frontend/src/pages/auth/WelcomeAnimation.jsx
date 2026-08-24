import { useEffect, useState } from "react";
import { MessageSquare, Heart, Send, Users, Sparkles } from "lucide-react";

function WelcomeAnimation() {
  const DURATION = 5000; // ms — tweak between 4000-6000
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / DURATION) * 100);
      setProgress(pct);
    }, 30);

    const timer = setTimeout(() => {
      window.location.href = "/home";
    }, DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const floatingIcons = [
    { Icon: MessageSquare, top: "15%", left: "12%", delay: "0s", size: 28 },
    { Icon: Heart, top: "70%", left: "18%", delay: "0.6s", size: 22 },
    { Icon: Send, top: "25%", left: "82%", delay: "1.1s", size: 24 },
    { Icon: Users, top: "78%", left: "78%", delay: "0.3s", size: 26 },
    { Icon: Sparkles, top: "10%", left: "50%", delay: "1.4s", size: 20 },
    { Icon: Heart, top: "55%", left: "6%", delay: "1.8s", size: 18 },
    { Icon: MessageSquare, top: "60%", left: "90%", delay: "0.9s", size: 20 },
  ];

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0a0f1d] overflow-hidden font-sans">
      {/* Background glows, matching login page */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px]"></div>

      {/* Floating chat icons */}
      {floatingIcons.map(({ Icon, top, left, delay, size }, i) => (
        <div
          key={i}
          className="absolute text-white/20 animate-float"
          style={{ top, left, animationDelay: delay }}
        >
          <Icon size={size} />
        </div>
      ))}

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Logo mark */}
        <div className="relative mb-8 animate-logo-in">
          <div className="absolute -inset-6 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-2xl rotate-12">
            <MessageSquare size={40} className="text-white -rotate-12" strokeWidth={2.2} />
            <Heart
              size={18}
              className="absolute -bottom-2 -right-2 text-pink-300 fill-pink-300 animate-heartbeat"
            />
          </div>
        </div>

        {/* App name */}
        <h1 className="text-4xl md:text-5xl font-black text-center mb-3 animate-title-in">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            House of Anbu
          </span>
        </h1>

        {/* Slogan */}
        <p className="text-slate-300 text-sm md:text-base tracking-[0.3em] uppercase font-semibold animate-slogan-in">
          Love is everything
        </p>

        {/* Progress bar */}
        <div className="mt-12 w-56 h-1 bg-white/10 rounded-full overflow-hidden animate-bar-in">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={() => (window.location.href = "/home")}
        className="absolute bottom-8 right-8 text-xs text-slate-500 hover:text-slate-300 transition-colors tracking-widest uppercase"
      >
        Skip →
      </button>

      <style>{`
        @keyframes floatUpDown {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
          50% { transform: translateY(-20px) rotate(8deg); opacity: 0.35; }
        }
        .animate-float { animation: floatUpDown 4s ease-in-out infinite; }

        @keyframes logoIn {
          0% { opacity: 0; transform: scale(0.3) rotate(-30deg); }
          60% { opacity: 1; transform: scale(1.1) rotate(16deg); }
          100% { opacity: 1; transform: scale(1) rotate(12deg); }
        }
        .animate-logo-in { animation: logoIn 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.3); }
          40% { transform: scale(1); }
          60% { transform: scale(1.2); }
        }
        .animate-heartbeat { animation: heartbeat 1.4s ease-in-out infinite; animation-delay: 0.9s; }

        @keyframes titleIn {
          0% { opacity: 0; transform: translateY(15px); letter-spacing: 0.2em; }
          100% { opacity: 1; transform: translateY(0); letter-spacing: normal; }
        }
        .animate-title-in { opacity: 0; animation: titleIn 0.8s ease-out forwards; animation-delay: 0.5s; }

        @keyframes slogonIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slogan-in { opacity: 0; animation: slogonIn 0.8s ease-out forwards; animation-delay: 1.1s; }

        @keyframes barIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-bar-in { opacity: 0; animation: barIn 0.6s ease-out forwards; animation-delay: 1.6s; }
      `}</style>
    </div>
  );
}

export default WelcomeAnimation;