import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        })
        if (error) {
          setMessage('Error: ' + error.message)
        } else {
          setMessage('Success! Check your email to confirm your account.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        })
        if (error) {
          setMessage('Error: ' + error.message)
        } else {
          setMessage('Logged in successfully!')
          // Will redirect to calendar page later
        }
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #6A00FF 0%, #4B0099 50%, #1F0A40 100%)'
      }}
    >
      {/* Purple gradient background with stars */}
      <div className="absolute inset-0">
        {/* Stars effect */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(2px 2px at 20% 30%, white, transparent),
                           radial-gradient(2px 2px at 60% 70%, white, transparent),
                           radial-gradient(1px 1px at 50% 50%, white, transparent),
                           radial-gradient(1px 1px at 80% 10%, white, transparent),
                           radial-gradient(2px 2px at 90% 60%, white, transparent),
                           radial-gradient(1px 1px at 33% 85%, white, transparent),
                           radial-gradient(1px 1px at 75% 25%, white, transparent)`,
          backgroundSize: '200% 200%',
          opacity: 0.5
        }}></div>
        
        {/* Mountain silhouettes */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Back mountains */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-purple-900/40 to-transparent"
               style={{
                 clipPath: 'polygon(0 100%, 0 60%, 20% 50%, 40% 65%, 60% 45%, 80% 60%, 100% 50%, 100% 100%)'
               }}>
          </div>
          {/* Middle mountains */}
          <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-purple-900/60 to-transparent"
               style={{
                 clipPath: 'polygon(0 100%, 0 70%, 15% 65%, 35% 55%, 50% 65%, 70% 50%, 85% 60%, 100% 55%, 100% 100%)'
               }}>
          </div>
          {/* Front mountains */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-purple-900/80 to-transparent"
               style={{
                 clipPath: 'polygon(0 100%, 0 75%, 25% 65%, 45% 75%, 55% 60%, 75% 70%, 90% 65%, 100% 70%, 100% 100%)'
               }}>
          </div>
          
          {/* Pine trees silhouettes */}
          <div className="absolute bottom-0 left-10 w-8 h-32 bg-purple-950/70"
               style={{
                 clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
               }}>
          </div>
          <div className="absolute bottom-0 left-24 w-10 h-40 bg-purple-950/60"
               style={{
                 clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
               }}>
          </div>
          <div className="absolute bottom-0 right-16 w-12 h-48 bg-purple-950/70"
               style={{
                 clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
               }}>
          </div>
          <div className="absolute bottom-0 right-40 w-9 h-36 bg-purple-950/50"
               style={{
                 clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
               }}>
          </div>
        </div>
      </div>
      
      {/* Glassmorphism login card */}
      <div className="relative z-10 mx-4" style={{ width: '450px', maxWidth: '90vw' }}>
        <div 
          className="backdrop-blur-xl px-14 py-20 rounded-2xl shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(106, 0, 255, 0.37)'
          }}
        >
          {/* Title */}
          <h1 className="text-4xl font-bold text-white text-center mb-20 tracking-wide">
            {isSignUp ? 'Sign Up' : 'Login'}
          </h1>
          
          <form onSubmit={handleAuth} className="space-y-0">
            {/* Email input with icon */}
            <div className="relative mb-14">
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-7 py-6 bg-transparent border rounded-full outline-none transition text-white placeholder-gray-300 pr-14 text-lg"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.35)'
                }}
                required
                disabled={loading}
              />
              <Mail className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" size={22} />
            </div>

            {/* Password input with icon */}
            <div className="relative mb-16">
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-7 py-6 bg-transparent border rounded-full outline-none transition text-white placeholder-gray-300 pr-14 text-lg"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.35)'
                }}
                required
                minLength={6}
                disabled={loading}
              />
              <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" size={22} />
            </div>

            {/* Login/Sign Up button */}
            <button
              type="submit"
              className="w-full bg-white text-purple-900 py-6 rounded-full font-semibold text-xl hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              disabled={loading}
              style={{
                color: '#4B0082'
              }}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-16 text-center">
            <p className="text-gray-300 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setMessage('')
                }}
                className="text-purple-300 hover:text-purple-200 font-medium underline"
                disabled={loading}
              >
                {isSignUp ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </div>

          {/* Message display */}
          {message && (
            <div className={`mt-4 p-3 rounded-full text-sm text-center ${
              message.startsWith('Error') 
                ? 'bg-red-500/20 text-red-200 border border-red-300/30' 
                : 'bg-green-500/20 text-green-200 border border-green-300/30'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
