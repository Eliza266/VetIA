import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Phone, User, Mail, Save, CheckCircle, AlertCircle } from 'lucide-react';

const Perfil: React.FC = () => {
  const { user } = useAuth();
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchVetData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'veterinarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTelefono(data.telefono || '');
        }
      } catch (error) {
        console.error('Error fetching veterinarian data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVetData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setStatus(null);

    try {
      const docRef = doc(db, 'veterinarios', user.uid);
      await updateDoc(docRef, { telefono });
      setStatus({ type: 'success', message: '¡Cambios guardados con éxito!' });
    } catch (error: any) {
      console.error('Error saving veterinarian changes:', error);
      setStatus({ type: 'error', message: error.message || 'Error al guardar los cambios.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Usuario no autenticado</h3>
        <p className="text-sm text-slate-500 mb-6">Inicia sesión para ver tu perfil.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header background decoration */}
        <div className="h-32 bg-gradient-to-r from-[#0F6E56] to-[#148F70]"></div>
        
        <div className="p-8 pt-0 relative">
          {/* Avatar positioning */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 mb-8">
            {user.foto ? (
              <img
                src={user.foto}
                alt={user.nombre}
                className="h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-4 ring-white shadow-md">
                <User className="h-12 w-12" />
              </div>
            )}
            <div className="text-center sm:text-left pb-1">
              <h1 className="text-2xl font-extrabold text-slate-800">{user.nombre}</h1>
              <p className="text-sm font-semibold text-[#0F6E56]">Médico Veterinario</p>
            </div>
          </div>

          {status && (
            <div className={`flex items-start gap-2.5 p-4 rounded-xl text-sm mb-6 ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
            }`}>
              {status.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              <span className="font-medium">{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={user.nombre}
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono de Contacto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    placeholder="Ej. +57 300 123 4567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] outline-none transition-shadow"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0c5945] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#0F6E56]/10 transition-all disabled:opacity-50"
              >
                <Save className="h-4.5 w-4.5" />
                {saving ? 'Guardando cambios...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
export { Perfil };
