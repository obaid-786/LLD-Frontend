import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <span className="brand">LLD Practice</span>
      <div className="nav-links">
        <NavLink to="/" end>
          Problems
        </NavLink>
        <NavLink to="/history">My Attempts</NavLink>
      </div>
    </nav>
  )
}
