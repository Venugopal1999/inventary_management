import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Topbar = () => {
  const [scanInput, setScanInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (scanInput.trim()) {
      console.log('Scanned:', scanInput);
      // TODO: Implement scan logic
      setScanInput('');
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
    <header className="bg-[#232F3E] text-white shadow-md p-4 flex items-center justify-between">
      <form onSubmit={handleScanSubmit} className="flex-1 max-w-2xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Scan barcode or search SKU/Lot/Location..."
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amazon-orange"
          />
          <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </form>
      <div className="flex items-center space-x-4 ml-4">
        <button className="relative hover:bg-[#37475A] p-2 rounded transition">
          <span className="text-xl">🔔</span>
          <span className="absolute top-0 right-0 bg-amazon-orange text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>
        <div className="relative">
          <div
            className="flex items-center space-x-2 hover:bg-[#37475A] p-2 rounded transition cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-8 h-8 bg-amazon-orange rounded-full flex items-center justify-center font-bold">
              {getUserInitial()}
            </div>
            <span>{user?.name || 'User'}</span>
          </div>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
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
    </header>
  );
};

export default Topbar;
