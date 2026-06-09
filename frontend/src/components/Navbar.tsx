import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Menu, X, PlusCircle, LayoutDashboard, Users, Calendar } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F6E56] text-xl font-bold text-white shadow-md shadow-[#0F6E56]/20">
                V
              </span>
              <span className="text-xl font-extrabold tracking-tight text-slate-800">
                Vet<span className="text-[#0F6E56]">IA</span>
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            {user && (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/') 
                      ? 'bg-[#0F6E56]/10 text-[#0F6E56]' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  to="/pacientes"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/pacientes') || location.pathname.startsWith('/pacientes/')
                      ? 'bg-[#0F6E56]/10 text-[#0F6E56]' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Pacientes
                </Link>
                <Link
                  to="/agenda"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/agenda')
                      ? 'bg-[#0F6E56]/10 text-[#0F6E56]' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Agenda
                </Link>
                <Link
                  to="/pacientes/nuevo"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Nuevo Paciente
                </Link>
              </div>
            )}
          </div>

          {/* User profile / actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/perfil')}>
                  {user.foto ? (
                    <img
                      src={user.foto}
                      alt={user.nombre}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-[#0F6E56]/20 group-hover:ring-[#0F6E56]/60 transition-all"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 group-hover:bg-slate-200 transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 leading-none group-hover:text-[#0F6E56] transition-colors">
                      {user.nombre}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">Veterinario</span>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-[#0F6E56] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c5945] transition-all shadow-md shadow-[#0F6E56]/10"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && user && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
              isActive('/') 
                ? 'bg-[#0F6E56]/10 text-[#0F6E56]' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/pacientes"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
              isActive('/pacientes') 
                ? 'bg-[#0F6E56]/10 text-[#0F6E56]' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="h-5 w-5" />
            Pacientes
          </Link>
          <Link
            to="/agenda"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
              isActive('/agenda') 
                ? 'bg-[#0F6E56]/10 text-[#0F6E56]' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="h-5 w-5" />
            Agenda
          </Link>
          <Link
            to="/pacientes/nuevo"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-slate-600 hover:bg-slate-50"
          >
            <PlusCircle className="h-5 w-5" />
            Nuevo Paciente
          </Link>
          
          <div className="pt-4 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-3 px-3 py-2 cursor-pointer" onClick={() => { setIsOpen(false); navigate('/perfil'); }}>
              {user.foto ? (
                <img
                  src={user.foto}
                  alt={user.nombre}
                  className="h-10 w-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <User className="h-5 w-5" />
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-slate-800">{user.nombre}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 mt-2 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
export { Navbar };
