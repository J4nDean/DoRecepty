import { useState } from 'react'
import logoImg from '@/assets/images/App_Icon.png'

const Home = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login:', { email, password })
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <img src={logoImg} alt="Logo aplikacji" className="logo-icon" />
      </div>

      <div className="bottom-rectangle">
        <h2 className="prescription-title">Witaj w znajdź mój lek</h2>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Wpisz swój email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wpisz hasło"
              required
            />
          </div>

          <button type="submit" className="login-button">Zaloguj się</button>
        </form>

        <div className="register-link">
          Nie masz konta? <a href="#register">Zarejestruj się</a>
        </div>
      </div>
    </div>
  )
}

export default Home
