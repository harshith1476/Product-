import React, { useContext, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'
import { SignupForm } from '../components/SignupForm'

const Login = () => {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const navigate = useNavigate()
  const { token, userData } = useContext(AppContext)

  useEffect(() => {
    if (token && userData) {
      navigate('/')
    }
  }, [token, userData, navigate])

  const isSignup = mode === 'signup'

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">

      {/* ── Top bar: brand + Emergency ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-8 py-3 bg-white/60 backdrop-blur-sm border-b border-white/40">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 text-sm sm:text-base">
            Medi<span className="text-cyan-500">Chain</span><span className="text-cyan-600">+</span>
          </span>
        </div>

        {/* Emergency Button */}
        <button
          onClick={() => navigate('/emergency')}
          className="relative flex items-center gap-2 text-white font-bold px-4 py-2 rounded-full text-sm emergency-btn-top"
        >
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-300 rounded-full animate-ping"></span>
          <span className="text-base">🚨</span>
          <span>Emergency</span>
        </button>
      </div>

      {/* ── White background ── */}
      <div className="absolute inset-0 -z-20 bg-white" />

      {/* ── Subtle dot grid ── */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Form card ── */}
      <div className="w-full max-w-sm md:max-w-4xl relative z-10 mt-10">
        {isSignup ? <SignupForm /> : <LoginForm />}
      </div>

      {/* ── Bottom brand line ── */}
      <p className="relative z-10 mt-5 text-cyan-700/50 text-xs tracking-widest uppercase font-medium">
        MediChain+ · Healthcare Platform
      </p>

      {/* ── Emergency button keyframes ── */}
      <style>{`
        @keyframes emergencyShake {
          0%, 70%, 100% { transform: translateX(0) rotate(0deg); }
          72% { transform: translateX(-4px) rotate(-2deg); }
          74% { transform: translateX(4px) rotate(2deg); }
          76% { transform: translateX(-3px) rotate(-1deg); }
          78% { transform: translateX(3px) rotate(1deg); }
          80% { transform: translateX(-2px); }
          82% { transform: translateX(2px); }
          84% { transform: translateX(0); }
        }
        @keyframes emergencyGlow {
          0%, 100% { box-shadow: 0 0 8px 3px rgba(239,68,68,0.55), 0 4px 16px rgba(239,68,68,0.35); }
          50%       { box-shadow: 0 0 22px 8px rgba(239,68,68,0.85), 0 6px 24px rgba(239,68,68,0.55); }
        }
        @keyframes emergencyShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .emergency-btn-top {
          background: linear-gradient(270deg, #ef4444, #dc2626, #b91c1c, #ef4444);
          background-size: 300% 100%;
          animation:
            emergencyGlow    1.8s ease-in-out infinite,
            emergencyShake   4s   ease-in-out infinite,
            emergencyShimmer 3s   linear       infinite;
        }
        .emergency-btn-top:hover {
          transform: scale(1.07);
          transition: transform 0.15s ease;
        }
      `}</style>
    </div>
  )
}

export default Login
