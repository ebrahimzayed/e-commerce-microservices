import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux-hooks';

const Header = () => {
  const navigate = useNavigate();
  const { cartItems } = useAppSelector((state) => state.cart);
  const { count } = useAppSelector((state) => state.theme);

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className={`bg-blue-600 text-white shadow-md p-4 sticky top-0 z-50`}>
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold flex items-center space-x-2">
          <span>🛍️</span>
          <span>e-commerce store</span>
        </Link>

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

        <div className="flex items-center space-x-6">
          <Link to="/cart" className="relative p-2 hover:bg-blue-700 rounded-full transition">
            <span className="text-2xl">🛒</span>
            {totalQuantity > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">
                {totalQuantity}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
