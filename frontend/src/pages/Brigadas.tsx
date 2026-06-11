import React, { useState } from 'react';
import { useBrigadas } from '../hooks/useBrigadas';
import type { Brigada } from '../types';
import { MapPin, Plus, X, Calendar, Users, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

const ESTADO_CONFIG = {
  planificada: { label: 'Planificada', classes: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  en_curso:    { label: 'En Curso',    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  finalizada:  { label: 'Finalizada', classes: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
};

const Brigadas: React.FC = () => {
  const { brigadas, loading, error, crearBrigada, actualizarBrigada } = useBrigadas();

  const [showModal, setShowModal] = useState(false);
  const [selectedBrigada, setSelectedBrigada] = useState<Brigada | null>(null);
  const [form, setForm] = useState({ nombre: '', fecha: '', direccion: '', ciudad: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.nombre.trim() || !form.fecha || !form.ciudad.trim()) {
      setFormError('Nombre, fecha y ciudad son obligatorios.');
      return;
    }
    setSubmitting(true);
    try {
      const newBrigada: Omit<Brigada, 'creadoEn'> = {
        nombre: form.nombre.trim(),
        fecha: form.fecha,
        ubicacion: {
          direccion: form.direccion.trim(),
          ciudad: form.ciudad.trim(),
        },
        veterinarioIds: [],
        estado: 'planificada',
      };
      const id = await crearBrigada(newBrigada);
      if (id) {
        setShowModal(false);
        setForm({ nombre: '', fecha: '', direccion: '', ciudad: '' });
      }
    } catch (err: any) {
      setFormError(err.message || 'Error al crear la brigada.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEstado = async (id: string, estado: Brigada['estado']) => {
    await actualizarBrigada(id, { estado });
    setSelectedBrigada((prev) => prev ? { ...prev, estado } : null);
  };

  return (
    <div className="space-y-6 animate-fade-in py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#0F6E56] flex items-center justify-center shadow-md shadow-[#0F6E56]/20">
              <Users className="h-5 w-5 text-white" />
            </div>
            Brigadas
          </h1>
          <p className="text-xs text-slate-400 mt-1 ml-[52px]">Gestiona las brigadas de salud animal</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0c5945] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0F6E56]/15 transition-all hover:scale-[1.01]"
        >
          <Plus className="h-4 w-4" />
          Nueva Brigada
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Brigada List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent"></div>
            <p className="text-xs text-slate-400 font-medium animate-pulse">Cargando brigadas...</p>
          </div>
        </div>
      ) : brigadas.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No hay brigadas registradas</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">Crea tu primera brigada para gestionar campañas de salud animal.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F6E56] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0c5945] transition-colors shadow-md shadow-[#0F6E56]/15"
          >
            <Plus className="h-4 w-4" />
            Crear Brigada
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {brigadas.map((brigada) => {
            const estado = ESTADO_CONFIG[brigada.estado] || ESTADO_CONFIG.planificada;
            return (
              <div
                key={brigada.id}
                onClick={() => setSelectedBrigada(brigada)}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#0F6E56]/20 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center shrink-0">
                    <Activity className="h-5 w-5 text-[#0F6E56]" />
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${estado.classes}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${estado.dot}`} />
                    {estado.label}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-800 text-sm mb-1 group-hover:text-[#0F6E56] transition-colors line-clamp-1">{brigada.nombre}</h3>

                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(brigada.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {brigada.ubicacion.ciudad}
                    {brigada.ubicacion.direccion && <span className="text-slate-400">· {brigada.ubicacion.direccion}</span>}
                  </div>
                  {brigada.totalConsultas !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Activity className="h-3.5 w-3.5 text-slate-400" />
                      {brigada.totalConsultas} consultas realizadas
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Brigada Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-slate-800">Nueva Brigada</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { name: 'nombre', label: 'Nombre de la Brigada', placeholder: 'Ej. Brigada Norte 2025', required: true },
                { name: 'fecha', label: 'Fecha', placeholder: '', type: 'date', required: true },
                { name: 'ciudad', label: 'Ciudad', placeholder: 'Ej. Bogotá', required: true },
                { name: 'direccion', label: 'Dirección (Opcional)', placeholder: 'Ej. Cra 7 # 32-16' },
              ].map(({ name, label, placeholder, type, required }) => (
                <div key={name}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={type || 'text'}
                    name={name}
                    value={(form as any)[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    className="w-full px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] focus:bg-white outline-none transition-all"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-[#0F6E56] hover:bg-[#0c5945] rounded-xl shadow-md shadow-[#0F6E56]/15 transition-all disabled:opacity-50">
                  {submitting ? 'Creando...' : 'Crear Brigada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brigada Detail Modal */}
      {selectedBrigada && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-slate-800 line-clamp-1">{selectedBrigada.nombre}</h2>
              <button onClick={() => setSelectedBrigada(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                {new Date(selectedBrigada.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                {selectedBrigada.ubicacion.ciudad}
                {selectedBrigada.ubicacion.direccion && ` · ${selectedBrigada.ubicacion.direccion}`}
              </div>
              {selectedBrigada.totalConsultas !== undefined && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Activity className="h-4 w-4 text-slate-400" />
                  {selectedBrigada.totalConsultas} consultas realizadas
                </div>
              )}
            </div>

            {/* Estado actions */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cambiar Estado</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ESTADO_CONFIG) as Array<keyof typeof ESTADO_CONFIG>).map((key) => {
                  const cfg = ESTADO_CONFIG[key];
                  const isActive = selectedBrigada.estado === key;
                  return (
                    <button
                      key={key}
                      onClick={() => selectedBrigada.id && handleEstado(selectedBrigada.id, key)}
                      className={`py-2.5 text-[10px] font-extrabold uppercase rounded-xl border transition-all flex items-center justify-center gap-1 ${isActive ? `${cfg.classes} ring-2 ring-offset-1 ring-current` : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
                    >
                      {isActive && <CheckCircle2 className="h-3 w-3" />}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brigadas;
export { Brigadas };
