import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePacientes } from '../hooks/usePacientes';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Cita, Paciente } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

const Agenda: React.FC = () => {
  const { user } = useAuth();
  const { pacientes, fetchPacientes } = usePacientes();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  
  // Create Form state
  const [pacienteId, setPacienteId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [duracion, setDuracion] = useState(30);
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const fetchCitas = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'citas'),
        where('veterinarioId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const list: Cita[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          pacienteId: data.pacienteId,
          nombrePaciente: data.nombrePaciente,
          veterinarioId: data.veterinarioId,
          fecha: data.fecha,
          horaInicio: data.horaInicio,
          duracion: Number(data.duracion),
          motivo: data.motivo,
          estado: data.estado,
          creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn)
        });
      });
      // Sort by start time
      list.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
      setCitas(list);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, [user]);

  // Calculate start of week (Monday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const startOfWeekDate = getStartOfWeek(currentDate);

  // Generate 7 days of the week
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeekDate);
    d.setDate(startOfWeekDate.getDate() + i);
    return d;
  });

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + 7);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!pacienteId) {
      setFormError('Por favor selecciona un paciente.');
      return;
    }
    
    setSubmitting(true);
    setFormError(null);

    const selectedPatient = pacientes.find(p => p.id === pacienteId);
    if (!selectedPatient) {
      setFormError('Paciente no válido.');
      setSubmitting(false);
      return;
    }

    const newCita: Omit<Cita, 'id'> = {
      pacienteId,
      nombrePaciente: selectedPatient.nombre,
      veterinarioId: user.uid,
      fecha,
      horaInicio,
      duracion,
      motivo,
      estado: 'programada',
      creadoEn: new Date()
    };

    try {
      await addDoc(collection(db, 'citas'), newCita);
      setShowCreateModal(false);
      // Reset form
      setPacienteId('');
      setMotivo('');
      setDuracion(30);
      setHoraInicio('09:00');
      // Refresh list
      await fetchCitas();
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setFormError(err.message || 'Error al agendar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'realizada' | 'cancelada') => {
    try {
      const docRef = doc(db, 'citas', id);
      await updateDoc(docRef, { estado: newStatus });
      setShowDetailModal(false);
      setSelectedCita(null);
      await fetchCitas();
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  // Helper to format date YYYY-MM-DD
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateString(new Date());

  // Check for upcoming appointments in the next 2 hours
  const upcomingAppointments = citas.filter((cita) => {
    if (cita.estado !== 'programada' || cita.fecha !== todayStr) return false;
    
    const now = new Date();
    const apptTime = new Date();
    const [h, m] = cita.horaInicio.split(':').map(Number);
    apptTime.setHours(h, m, 0, 0);
    
    const diffMs = apptTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours > 0 && diffHours <= 2;
  });

  return (
    <div className="space-y-6 animate-fade-in py-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-[#0F6E56]" />
            Agenda y Citas
          </h1>
          <p className="text-xs text-slate-500">
            Gestiona la programación semanal de consultas veterinarias.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button 
              onClick={handlePrevWeek}
              className="p-2.5 hover:bg-slate-50 text-slate-600 transition-colors border-r border-slate-200"
              title="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-4 py-2 text-xs font-bold text-[#0F6E56] hover:bg-slate-50 transition-colors border-r border-slate-200"
            >
              Hoy
            </button>
            <button 
              onClick={handleNextWeek}
              className="p-2.5 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0c5945] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0F6E56]/15 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* 2-Hour Alert Banner */}
      {upcomingAppointments.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 animate-pulse">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-amber-900">¡Citas próximas en menos de 2 horas!</h4>
            <div className="text-xs font-semibold mt-1 space-y-1">
              {upcomingAppointments.map((cita) => (
                <div key={cita.id}>
                  • Cita con <span className="font-bold">{cita.nombrePaciente}</span> programada para las <span className="font-bold">{cita.horaInicio}</span> ({cita.motivo})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Week Grid (7 columns) */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent"></div>
            <p className="text-sm font-semibold text-slate-500 animate-pulse">Cargando agenda...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayStr = formatDateString(day);
            const isToday = dayStr === todayStr;
            const dayAppointments = citas.filter(c => c.fecha === dayStr);

            return (
              <div 
                key={dayStr}
                className={`bg-white rounded-2xl border transition-all ${
                  isToday 
                    ? 'border-[#0F6E56] ring-1 ring-[#0F6E56]/20 shadow-md shadow-[#0F6E56]/5' 
                    : 'border-slate-100 shadow-sm'
                }`}
              >
                {/* Day Header */}
                <div className={`p-3 text-center border-b rounded-t-2xl ${
                  isToday 
                    ? 'bg-[#0F6E56]/5 border-[#0F6E56]/10' 
                    : 'bg-slate-50/50 border-slate-100'
                }`}>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </span>
                  <span className={`inline-block mt-0.5 text-base font-extrabold ${
                    isToday ? 'text-[#0F6E56] bg-[#0F6E56]/10 px-2.5 py-0.5 rounded-full' : 'text-slate-800'
                  }`}>
                    {day.getDate()}
                  </span>
                  <span className="block text-[9px] text-slate-400 font-medium">
                    {day.toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                </div>

                {/* Day Appointments Content */}
                <div className="p-3 space-y-3 min-h-[300px]">
                  {dayAppointments.length > 0 ? (
                    dayAppointments.map((cita) => {
                      // Status colors
                      const isRealizada = cita.estado === 'realizada';
                      const isCancelada = cita.estado === 'cancelada';
                      
                      return (
                        <div
                          key={cita.id}
                          onClick={() => {
                            setSelectedCita(cita);
                            setShowDetailModal(true);
                          }}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md ${
                            isToday && cita.estado === 'programada'
                              ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                              : isRealizada
                              ? 'bg-slate-50 border-slate-200 opacity-60'
                              : isCancelada
                              ? 'bg-red-50/30 border-red-100 line-through opacity-60'
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[#0F6E56]" />
                              {cita.horaInicio}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {cita.duracion}m
                            </span>
                          </div>
                          
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {cita.nombrePaciente}
                          </h4>
                          
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {cita.motivo}
                          </p>

                          <span className={`inline-block mt-2 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isRealizada 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : isCancelada 
                              ? 'bg-red-100 text-red-800' 
                              : isToday
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {cita.estado}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center py-12">
                      <p className="text-[10px] italic text-slate-300 text-center">Sin citas</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal - Nueva Cita */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#0F6E56]" />
                Agendar Nueva Cita
              </h3>
              <button 
                onClick={() => { setShowCreateModal(false); setFormError(null); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs bg-red-50 text-red-800 border border-red-100 mb-4">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-600" />
                <span className="font-semibold">{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Paciente */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Paciente</label>
                <select
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] outline-none bg-white"
                >
                  <option value="">Selecciona un paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.especie}) - Prop. {p.propietario.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Fecha */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] outline-none"
                  />
                </div>

                {/* Hora Inicio */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] outline-none"
                  />
                </div>
              </div>

              {/* Duración */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duración (minutos)</label>
                <select
                  value={duracion}
                  onChange={(e) => setDuracion(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] outline-none bg-white"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos (1 hora)</option>
                </select>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Motivo de Consulta</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  placeholder="Ej. Vacunación anual, revisión física, dolor de oído..."
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setFormError(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F6E56] hover:bg-[#0c5945] text-white rounded-xl text-sm font-bold shadow-md shadow-[#0F6E56]/15 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Agendando...' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Detalle Cita */}
      {showDetailModal && selectedCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">
                Detalle de Cita
              </h3>
              <button 
                onClick={() => { setShowDetailModal(false); setSelectedCita(null); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Paciente</span>
                <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-[#0F6E56]" />
                  {selectedCita.nombrePaciente}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fecha</span>
                  <span className="text-xs font-semibold text-slate-700">{selectedCita.fecha}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hora y Duración</span>
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {selectedCita.horaInicio} ({selectedCita.duracion} min)
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Motivo</span>
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl leading-relaxed">
                  {selectedCita.motivo}
                </p>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Estado de la Cita</span>
                <span className={`inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  selectedCita.estado === 'realizada' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : selectedCita.estado === 'cancelada' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {selectedCita.estado}
                </span>
              </div>

              {selectedCita.estado === 'programada' && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-6">
                  <button
                    onClick={() => handleUpdateStatus(selectedCita.id!, 'cancelada')}
                    className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancelar Cita
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedCita.id!, 'realizada')}
                    className="py-2.5 bg-[#0F6E56] hover:bg-[#0c5945] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0F6E56]/15 transition-all flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Realizada
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
export { Agenda };
