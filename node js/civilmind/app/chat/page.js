'use client'
import { useState, useRef, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'

const TRANSLATIONS = {
  ar: {
    dir: 'rtl',
    appName: 'CivilMind',
    tagline: 'مساعد الهندسة المدنية بالذكاء الاصطناعي',
    newChat: 'محادثة جديدة',
    placeholder: 'اسأل عن الكودات الهندسية...',
    welcome: 'مرحباً بك في CivilMind',
    welcomeSub: 'اسأل عن أي بند في الكودات الهندسية المصرية أو السعودية',
    suggestions: [
      'ما هو الحد الأدنى لغطاء الخرسانة؟',
      'متطلبات تسليح الأعمدة حسب SBC 304',
      'ما هي الأحمال الحية للأسطح؟',
      'فرق بين ECP 203 و SBC 304',
    ],
    country: { sa: '🇸🇦 السعودية', eg: '🇪🇬 مصر' },
    switchLang: 'English',
    disclaimer: '⚠️ للأغراض التعليمية فقط. يجب مراجعة جميع القرارات الهندسية من قبل مهندس مرخص.',
    sources: 'المصادر: Saudi Building Code (SBC 301, 303, 304) · Egyptian Code of Practice (ECP 203, 201)',
    thinking: 'جارٍ التفكير...',
    error: 'حدث خطأ — حاول مرة أخرى',
    today: 'اليوم',
    send: 'إرسال',
  },
  en: {
    dir: 'ltr',
    appName: 'CivilMind',
    tagline: 'AI Assistant for Civil Engineers',
    newChat: 'New Chat',
    placeholder: 'Ask about engineering codes...',
    welcome: 'Welcome to CivilMind',
    welcomeSub: 'Ask about any clause in Egyptian or Saudi engineering codes',
    suggestions: [
      'Minimum concrete cover requirements?',
      'Column reinforcement per SBC 304',
      'Live loads for inaccessible roofs?',
      'Compare ECP 203 vs SBC 304',
    ],
    country: { sa: '🇸🇦 Saudi Arabia', eg: '🇪🇬 Egypt' },
    switchLang: 'عربي',
    disclaimer: '⚠️ For educational purposes only. All engineering decisions must be reviewed by a licensed engineer.',
    sources: 'Sources: Saudi Building Code (SBC 301, 303, 304) · Egyptian Code of Practice (ECP 203, 201)',
    thinking: 'Thinking...',
    error: 'An error occurred — please try again',
    today: 'Today',
    send: 'Send',
  }
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0,1,2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
      ))}
    </div>
  )
}

function Message({ msg, lang }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? (lang === 'ar' ? 'flex-row-reverse' : 'flex-row-reverse') : 'flex-row'} mb-6`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${
        isUser ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-emerald-400 border border-slate-600'
      }`}>
        {isUser ? 'أ' : 'C'}
      </div>
      <div className={`max-w-[78%] ${isUser ? (lang === 'ar' ? 'items-end' : 'items-end') : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-emerald-600 text-white rounded-tr-sm'
            : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
        }`}>
          {isUser ? msg.content : (
            <div dangerouslySetInnerHTML={{ __html: msg.content
              .replace(/\n/g, '<br/>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-300">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`(.*?)`/g, '<code class="bg-slate-900 px-1 rounded text-emerald-300 text-xs">$1</code>')
            }} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { user } = useUser()
  const [lang, setLang] = useState('ar')
  const [country, setCountry] = useState('sa')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [countryOpen, setCountryOpen] = useState(false)
  const [conversations, setConversations] = useState([
    { id: 1, title: 'محادثة جديدة', active: true }
  ])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const T = TRANSLATIONS[lang]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    if (messages.length === 0) {
      setConversations(prev => prev.map((c, i) =>
        i === 0 ? { ...c, title: q.slice(0, 35) + (q.length > 35 ? '...' : '') } : c
      ))
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, country }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || data.error || T.error
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: T.error }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const newChat = () => {
    setMessages([])
    setConversations(prev => [
      { id: Date.now(), title: T.newChat, active: true },
      ...prev.map(c => ({ ...c, active: false }))
    ])
  }

  return (
    <div className={`flex h-screen overflow-hidden ${lang === 'ar' ? 'rtl' : 'ltr'}`}
      dir={T.dir}
      style={{ background: '#0d1117', color: '#e6edf3', fontFamily: lang === 'ar' ? "'Cairo', sans-serif" : "'DM Sans', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? '260px' : '0', transition: 'width 0.25s', overflow: 'hidden', flexShrink: 0, background: '#161b22', borderInlineEnd: '1px solid #21262d' }}
        className="flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid #21262d' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 8 }}
            className="flex items-center justify-center text-white font-bold text-sm flex-shrink-0">C</div>
          <div>
            <div className="font-bold text-sm" style={{ color: '#e6edf3' }}>CivilMind</div>
            <div className="text-xs" style={{ color: '#7d8590' }}>{T.tagline.split(' ').slice(0,3).join(' ')}</div>
          </div>
        </div>

        {/* New Chat */}
        <div className="p-3">
          <button onClick={newChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{ background: '#21262d', color: '#e6edf3', border: '1px solid #30363d' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#30363d'}>
            <span style={{ fontSize: 16 }}>+</span>
            <span>{T.newChat}</span>
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <div className="px-2 py-1 text-xs mb-1" style={{ color: '#7d8590' }}>{T.today}</div>
          {conversations.map(conv => (
            <button key={conv.id}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-0.5 text-start transition-all"
              style={{
                background: conv.active ? '#21262d' : 'transparent',
                color: conv.active ? '#e6edf3' : '#7d8590',
              }}>
              <span style={{ flexShrink: 0 }}>💬</span>
              <span className="truncate">{conv.title}</span>
            </button>
          ))}
        </div>

        {/* User */}
        <div className="p-3 flex items-center gap-2" style={{ borderTop: '1px solid #21262d' }}>
          <UserButton afterSignOutUrl="/" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: '#e6edf3' }}>
              {user?.firstName || 'مستخدم'}
            </div>
            <div className="text-xs truncate" style={{ color: '#7d8590' }}>
              {user?.emailAddresses[0]?.emailAddress?.slice(0, 20)}...
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: '#161b22', borderBottom: '1px solid #21262d' }}>

          <button onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: '#7d8590' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'}
            onMouseLeave={e => e.currentTarget.style.color = '#7d8590'}>
            ☰
          </button>

          <div className="flex-1" />

          {/* Country */}
          <div className="relative">
            <button onClick={() => setCountryOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{ background: '#21262d', color: '#e6edf3', border: '1px solid #30363d' }}>
              {country === 'sa' ? T.country.sa : T.country.eg}
              <span style={{ color: '#7d8590', fontSize: 10 }}>▼</span>
            </button>
            {countryOpen && (
              <div className="absolute mt-1 rounded-lg overflow-hidden shadow-xl z-50"
                style={{ top: '100%', insetInlineEnd: 0, minWidth: 150, background: '#21262d', border: '1px solid #30363d' }}>
                {[['sa', T.country.sa], ['eg', T.country.eg]].map(([v, l]) => (
                  <button key={v} onClick={() => { setCountry(v); setCountryOpen(false) }}
                    className="w-full px-3 py-2 text-sm text-start transition-colors"
                    style={{ color: country === v ? '#10b981' : '#e6edf3', background: country === v ? '#161b22' : 'transparent' }}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lang */}
          <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: '#21262d', color: '#7d8590', border: '1px solid #30363d' }}>
            🌐 {T.switchLang}
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              {/* Icon */}
              <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: 18, boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}
                className="flex items-center justify-center text-3xl mb-5">🏗️</div>

              <h2 className="text-2xl font-bold mb-2" style={{ color: '#e6edf3' }}>{T.welcome}</h2>
              <p className="text-sm mb-8 max-w-md leading-relaxed" style={{ color: '#7d8590' }}>{T.welcomeSub}</p>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full mb-8">
                {T.suggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="text-start px-4 py-3 rounded-xl text-sm transition-all"
                    style={{ background: '#161b22', border: '1px solid #21262d', color: '#7d8590' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#e6edf3' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#21262d'; e.currentTarget.style.color = '#7d8590' }}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Sources */}
              <div className="text-xs max-w-lg text-center" style={{ color: '#7d8590' }}>
                {T.sources}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <Message key={i} msg={msg} lang={lang} />)}
              {loading && (
                <div className="flex gap-3 mb-6">
                  <div style={{ width: 32, height: 32, background: '#1c2128', borderRadius: 8, border: '1px solid #21262d' }}
                    className="flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1" style2={{ color: '#10b981' }}>C</div>
                  <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '16px 16px 16px 4px' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input + Disclaimer */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2" style={{ borderTop: '1px solid #21262d', background: '#161b22' }}>

          {/* Disclaimer */}
          <div className="mb-2 px-1">
            <p className="text-xs leading-relaxed" style={{ color: '#7d8590' }}>
              <span style={{ color: '#f0883e' }}>⚠️</span> {T.disclaimer}
            </p>
          </div>

          {/* Input Row */}
          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={T.placeholder}
                rows={1}
                className="w-full px-4 py-3 text-sm rounded-xl resize-none outline-none transition-all"
                style={{
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  color: '#e6edf3',
                  minHeight: 44,
                  maxHeight: 120,
                }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = '#30363d'}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all"
              style={{
                width: 44, height: 44,
                background: (!input.trim() || loading) ? '#21262d' : '#10b981',
                color: (!input.trim() || loading) ? '#7d8590' : 'white',
                border: 'none',
                cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
              }}>
              →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}