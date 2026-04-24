import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoImg from '@/assets/images/App_Icon.png'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login:', { email, password })
    // Direct navigate for demo purposes
    navigate('/home')
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center overflow-x-hidden">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 sm:py-12 w-full">
        <img
          src={logoImg}
          alt="Logo"
          className="w-[clamp(140px,18vw,210px)] max-w-full h-auto object-contain"
        />
      </div>

      <div className="w-full max-w-[min(480px,calc(100vw-1.5rem))] bg-[#f0f0f0] rounded-t-4xl sm:rounded-t-[2.5rem] px-5 sm:px-8 md:px-12 pt-8 sm:pt-10 pb-8 sm:pb-10 flex flex-col items-center shadow-[0_-10px_25px_rgba(0,0,0,0.03)] min-h-[clamp(380px,55vh,620px)]">
        <h2 className="text-[clamp(1.05rem,1.2vw,1.25rem)] font-bold text-black text-center mb-6 sm:mb-8">
          Witaj w znajdź mój lek
        </h2>

        <form className="w-full flex flex-col gap-4 sm:gap-5" onSubmit={handleLogin}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-black ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Wpisz swój email"
              className="w-full h-11 px-4 sm:px-5 border border-[#dcdcdc] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4a90e2] transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-black ml-1">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wpisz hasło"
              className="w-full h-11 px-4 sm:px-5 border border-[#dcdcdc] rounded-lg text-sm bg-white focus:outline-none focus:border-[#4a90e2] transition-colors"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full h-12 mt-2 bg-[#4a90e2] text-white rounded-lg text-base font-bold hover:bg-[#357abd] active:scale-[0.98] transition-all"
          >
            Zaloguj się
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium text-[#666666]">
          Nie masz konta? <a href="#register" className="text-[#4a90e2] font-bold ml-1 hover:underline">Zarejestruj się</a>
        </div>
      </div>
    </div>
  )
}

export default Login
