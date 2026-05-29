import { useState } from 'react'
import { Activity, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#020617' }}>

      {/* Card */}
      <div className="glass rounded-2xl w-full max-w-sm px-8 py-10 flex flex-col items-center gap-6"
        style={{ boxShadow: '0 0 60px rgba(20,184,166,0.06), 0 4px 32px rgba(0,0,0,0.5)' }}>

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(20,184,166,0.1)] border border-[rgba(20,184,166,0.25)]
                          flex items-center justify-center">
            <Activity size={26} className="text-[#14b8a6]" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#f8fafc]" style={{ fontFamily: 'Figtree, sans-serif' }}>
              ClinicalDoc <span className="text-[#14b8a6]">AI</span>
            </h1>
            <p className="text-xs text-[#475569] mt-1">Documentation Copilot</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[rgba(51,65,85,0.5)]" />

        {/* Tagline */}
        <div className="text-center space-y-1.5">
          <p className="text-sm font-medium text-[#94a3b8]">Sign in to your workspace</p>
          <p className="text-xs text-[#475569] leading-relaxed">
            Your encounters are private and visible only to you.
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                     bg-[rgba(255,255,255,0.05)] border border-[rgba(71,85,105,0.5)]
                     hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(20,184,166,0.4)]
                     text-[#f8fafc] text-sm font-medium
                     transition-all duration-200 cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
          )}
          {loading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {/* Privacy note */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#334155]">
          <Shield size={11} />
          <span>Secured by Supabase Auth · No passwords stored</span>
        </div>
      </div>
    </div>
  )
}
