import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children || <Outlet />}
      </main>
      <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; {new Date().getFullYear()} <span className="font-semibold text-slate-600">VetIA</span>. Diseñado para veterinarios del futuro.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">Soporte</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
export { Layout };
