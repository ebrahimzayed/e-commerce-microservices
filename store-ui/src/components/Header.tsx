import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-blue-600 text-white shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* العودة للرئيسية */}
        <Link to="/" className="text-2xl font-bold flex items-center space-x-2">
          <span>🛍️</span>
          <span>e-commerce store</span>
        </Link>

        {/* خانة البحث */}
        <div className="flex-1 max-w-xl mx-8">
          <input
            type="text"
            placeholder="Search for products ..."
            className="w-full px-4 py-2 rounded-lg text-black focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/search?q=${(e.target as HTMLInputElement).value}`);
              }
            }}
          />
        </div>

        {/* زرار السلة السحري والمربوط بالمسار صح */}
        <div className="flex items-center space-x-6">
          <Link to="/cart" className="relative p-2 hover:bg-blue-700 rounded-full transition flex items-center space-x-1">
            <span className="text-2xl">🛒</span>
            <span className="text-sm font-semibold hidden md:inline">My Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
