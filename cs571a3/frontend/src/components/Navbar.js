import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getFavoritesCount = () => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]').length;
    } catch {
      return 0;
    }
  };

  const isActive = (path) => location.pathname === path ? 'bg-blue-100 text-blue-600' : 'text-gray-600';

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">🎫 Events Around</Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/search" className={`px-4 py-2 rounded-md font-medium ${isActive('/search')}`}>
              Search Events
            </Link>
            <Link to="/favorites" className={`px-4 py-2 rounded-md font-medium relative ${isActive('/favorites')}`}>
              Favorites
              {getFavoritesCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getFavoritesCount()}
                </span>
              )}
            </Link>
          </div>
          
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
          >
            ☰
          </button>
        </div>
        
        {mobileOpen && (
          <div className="md:hidden bg-gray-50 border-t px-2 py-2">
            <Link to="/search" className={`block px-3 py-2 rounded-md ${isActive('/search')}`} onClick={() => setMobileOpen(false)}>
              Search Events
            </Link>
            <Link to="/favorites" className={`block px-3 py-2 rounded-md ${isActive('/favorites')}`} onClick={() => setMobileOpen(false)}>
              Favorites ({getFavoritesCount()})
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
