import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PropTypes from 'prop-types';

const Topbar = ({ onMenuClick, isMobile }) => {
  const [scanInput, setScanInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (scanInput.trim()) {
      console.log('Scanned:', scanInput);
      setScanInput('');
      setShowSearch(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getUserInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header className="bg-[#232F3E] text-white shadow-md p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left side - Menu button (mobile) + Search */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-[#37475A] rounded transition flex-shrink-0"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Search - Desktop */}
          <form onSubmit={handleScanSubmit} className="hidden sm:block flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Scan barcode or search SKU/Lot/Location..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amazon-orange text-sm sm:text-base"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </form>

          {/* Search toggle - Mobile */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="sm:hidden p-2 hover:bg-[#37475A] rounded transition"
            aria-label="Search"
          >
            <span className="text-xl">🔍</span>
          </button>
        </div>

        {/* Right side - User */}
        <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
          {/* User dropdown */}
          <div className="relative">
            <div
              className="flex items-center gap-1 sm:gap-2 hover:bg-[#37475A] p-1.5 sm:p-2 rounded transition cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amazon-orange rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                {getUserInitial()}
              </div>
              <span className="hidden md:inline text-sm sm:text-base">{user?.name || 'User'}</span>
              <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b md:hidden">
                  {user?.name || 'User'}
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar - expandable */}
      {showSearch && isMobile && (
        <form onSubmit={handleScanSubmit} className="mt-3 sm:hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="Search SKU, Lot, Location..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amazon-orange"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="absolute right-3 top-2.5 text-gray-400"
            >
              ✕
            </button>
          </div>
        </form>
      )}
    </header>
  );
};

Topbar.propTypes = {
  onMenuClick: PropTypes.func,
  isMobile: PropTypes.bool,
};

Topbar.defaultProps = {
  onMenuClick: () => {},
  isMobile: false,
};

export default Topbar;
