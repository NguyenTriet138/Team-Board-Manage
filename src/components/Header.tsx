import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Database,
  Home,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../integrations/auth/auth-provider'

function AuthButtons() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm">{user.name}</span>
        <button
          onClick={() => {
            logout();
            navigate({ to: '/login' });
          }}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        Login
      </Link>
      <Link
        to="/signup"
        className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
      >
        Sign Up
      </Link>
    </div>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors mr-4"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Home size={20} />
            <span className="font-medium">Formation Setup</span>
          </Link>
          <Link
            to="/teams"
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Database size={20} />
            <span className="font-medium">Team Management</span>
          </Link>
        </div>

        <div className="ml-auto">
          <AuthButtons />
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Home size={20} />
              <span>Formation Setup</span>
            </Link>
            <Link
              to="/teams"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Database size={20} />
              <span>Team Management</span>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  )
}
