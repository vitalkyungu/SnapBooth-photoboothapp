import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar__logo">
        <img
          src="/snapbooth-icon.png"
          alt=""
          className="navbar__logo-icon"
          width={40}
          height={40}
        />
        <div>
          <span className="navbar__logo-text">
            Snap<span>Booth</span>
          </span>
          <span className="navbar__logo-tagline">Photo Booth</span>
        </div>
      </Link>
    </header>
  )
}
