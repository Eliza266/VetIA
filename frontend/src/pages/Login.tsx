import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { user, loginWithGoogle, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Ocurrió un error al iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left Column - Hero/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F6E56] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-[-15%] right-[-15%] w-[80%] h-[80%] rounded-full bg-white/10 blur-3xl"></div>

        {/* Top brand */}
        <div className="flex items-center gap-2 relative z-10">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-extrabold text-[#0F6E56] shadow-lg">
            V
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Vet<span className="text-emerald-300">IA</span>
          </span>
        </div>

        {/* Main hero message */}
        <div className="relative z-10 my-auto max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight text-white mb-6">
            La historia clínica de tus pacientes, escrita por IA.
          </h1>
          <p className="text-emerald-100 text-base leading-relaxed">
            Graba el audio de tus consultas veterinarias. Nuestra Inteligencia Artificial transcribirá el contenido y estructurará automáticamente una nota médica en formato SOAP en segundos.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                ✓
              </span>
              <span className="text-sm font-medium">Ahorra hasta 2 horas diarias de papeleo</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                ✓
              </span>
              <span className="text-sm font-medium">Formato estándar SOAP (Subjetivo, Objetivo, Análisis, Plan)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                ✓
              </span>
              <span className="text-sm font-medium">Historial clínico digital seguro y accesible</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-emerald-200">
          &copy; {new Date().getFullYear()} VetIA. Innovando en el cuidado animal.
        </div>
      </div>

      {/* Right Column - Login Actions */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            {/* Mobile Logo */}
            <div className="flex justify-center lg:justify-start items-center gap-2 mb-6 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F6E56] text-xl font-bold text-white shadow-md">
                V
              </span>
              <span className="text-xl font-extrabold tracking-tight text-slate-800">
                Vet<span className="text-[#0F6E56]">IA</span>
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Accede a tu panel médico y gestiona tus expedientes clínicos.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100 flex items-start gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <div className="mt-8 space-y-6">
            <button
              onClick={handleLogin}
              disabled={isLoggingIn || loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.5l3.86 3C6.19 7.56 8.84 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.73-4.94 3.73-8.55z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.5c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.42 7.14C.51 8.97 0 11.01 0 13.18c0 2.17.51 4.21 1.42 6.04l3.86-3.04z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-3.96 1.1-3.16 0-5.81-2.52-6.72-5.46L1.42 15.9C3.37 19.75 7.35 22.4 12 22.4z"
                    />
                  </svg>
                  Iniciar sesión con Google
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-8 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-[#0F6E56]" />
              <span>Conexión cifrada de alta seguridad SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
export { Login };
