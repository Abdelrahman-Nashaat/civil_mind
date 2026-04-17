'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'

export default function LandingPage() {
  const [lang, setLang] = useState('ar')
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => { if (isSignedIn) router.push('/chat') }, [isSignedIn, router])

  const T = {
    ar: {
      dir: 'rtl', title: 'CivilMind', sub: 'المساعد الذكي للمهندسين المدنيين',
      desc: 'احصل على إجابات دقيقة من الكودات الهندسية المصرية والسعودية',
      signin: 'تسجيل الدخول', signup: 'ابدأ مجاناً',
      features: [
        { icon: '📋', t: 'SBC السعودي', d: 'SBC 301 · 303 · 304' },
        { icon: '📐', t: 'ECP المصري', d: 'ECP 203 · 201' },
        { icon: '⚡', t: 'إجابات فورية', d: 'Powered by AI' },
      ],
      disclaimer: '⚠️ للأغراض التعليمية فقط — يجب مراجعة مهندس مرخص قبل أي قرار هندسي',
      switchLang: 'English',
    },
    en: {
      dir: 'ltr', title: 'CivilMind', sub: 'AI Assistant for Civil Engineers',
      desc: 'Get accurate answers from Egyptian and Saudi engineering codes instantly',
      signin: 'Sign In', signup: 'Start Free',
      features: [
        { icon: '📋', t: 'Saudi SBC', d: 'SBC 301 · 303 · 304' },
        { icon: '📐', t: 'Egyptian ECP', d: 'ECP 203 · 201' },
        { icon: '⚡', t: 'Instant Answers', d: 'Powered by AI' },
      ],
      disclaimer: '⚠️ Educational purposes only — Licensed engineer review required for any engineering decision',
      switchLang: 'عربي',
    }
  }[lang]

  return (
    <div dir={T.dir} style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: lang === 'ar' ? "'Cairo',sans-serif" : "'DM Sans',sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>C</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>CivilMind</span>
        </div>
        <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
          style={{ padding: '6px 14px', borderRadius: 8, background: '#21262d', border: '1px solid #30363d', color: '#7d8590', cursor: 'pointer', fontSize: 13 }}>
          {T.switchLang}
        </button>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 24, boxShadow: '0 0 60px rgba(16,185,129,0.25)' }}>🏗️</div>

        <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg,#e6edf3,#7d8590)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{T.title}</h1>
        <p style={{ fontSize: 18, color: '#10b981', marginBottom: 12, fontWeight: 500 }}>{T.sub}</p>
        <p style={{ fontSize: 14, color: '#7d8590', marginBottom: 36, maxWidth: 440, lineHeight: 1.7 }}>{T.desc}</p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
          <SignUpButton mode="modal">
            <button style={{ padding: '12px 28px', borderRadius: 10, background: '#10b981', color: 'white', border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{T.signup}</button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button style={{ padding: '12px 28px', borderRadius: 10, background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{T.signin}</button>
          </SignInButton>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 600, width: '100%', marginBottom: 32 }}>
          {T.features.map((f, i) => (
            <div key={i} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#e6edf3', marginBottom: 2 }}>{f.t}</div>
              <div style={{ fontSize: 11, color: '#7d8590' }}>{f.d}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{ maxWidth: 500, padding: '10px 16px', borderRadius: 8, background: '#161b22', border: '1px solid #2d1f00', fontSize: 12, color: '#7d8590', lineHeight: 1.6 }}>
          {T.disclaimer}
        </div>
      </main>
    </div>
  )
}