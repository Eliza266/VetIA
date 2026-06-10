import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePacientes } from '../hooks/usePacientes';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import type { Cita } from '../types';
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
  Stethoscope,
  XCircle,
  UserX
} from 'lucide-react';

const Agenda: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pacientes, fetchPacientes } = usePacientes();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date());
  const miniCalendarRef = useRef<HTMLDivElement>(null);
  
  const [pacienteId, setPacienteId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [duracion, setDuracion] = useState(30);
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (miniCalendarRef.current && !miniCalendarRef.current.contains(event.target as Node)) {
        setShowMiniCalendar(false);
      }
    };
    if (showMiniCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMiniCalendar]);

  const handleMiniPrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMiniCalendarMonth(new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth() - 1, 1));
  };

  const handleMiniNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMiniCalendarMonth(new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth() + 1, 1));
  };

  const handleSelectMiniDate = (day: Date) => {
    setCurrentDate(day);
    setShowMiniCalendar(false);
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const startOfWeekDate = getStartOfWeek(currentDate);

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

  const handleToday = () => setCurrentDate(new Date());

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!pacienteId) { setFormError('Por favor selecciona un paciente.'); return; }
    
    setSubmitting(true);
    setFormError(null);

    const selectedPatient = pacientes.find(p => p.id === pacienteId);
    if (!selectedPatient) { setFormError('Paciente no válido.'); setSubmitting(false); return; }

    try {
      await addDoc(collection(db, 'citas'), {
        pacienteId,
        nombrePaciente: selectedPatient.nombre,
        veterinarioId: user.uid,
        fecha,
        horaInicio,
        duracion,
        motivo,
        estado: 'programada',
        creadoEn: new Date()
      });
      setShowCreateModal(false);
      setPacienteId(''); setMotivo(''); setDuracion(30); setHoraInicio('09:00');
      await fetchCitas();
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setFormError(err.message || 'Error al agendar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'realizada' | 'cancelada' | 'no_asistio') => {
    try {
      const docRef = doc(db, 'citas', id);
      await updateDoc(docRef, { estado: newStatus });
      
      // If marked as "realizada", close modal and navigate to new consultation
      if (newStatus === 'realizada' && selectedCita) {
        setShowDetailModal(false);
        setSelectedCita(null);
        await fetchCitas();
        return;
      }
      
      setShowDetailModal(false);
      setSelectedCita(null);
      await fetchCitas();
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateString(new Date());

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

  // Week range label
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekLabel = `${weekStart.getDate()} ${weekStart.toLocaleDateString('es-ES', { month: 'short' })} — ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;

  const getBorderColor = (estado: string) => {
    switch (estado) {
      case 'programada': return 'border-l-[#0F6E56]';
      case 'realizada': return 'border-l-slate-300';
      case 'cancelada': return 'border-l-red-400';
      case 'no_asistio': return 'border-l-amber-400';
      default: return 'border-l-slate-200';
    }
  };

  // Mini calendar logic
  const miniYear = miniCalendarMonth.getFullYear();
  const miniMonth = miniCalendarMonth.getMonth();
  const miniFirstDay = new Date(miniYear, miniMonth, 1);
  const miniStartPadding = miniFirstDay.getDay() === 0 ? 6 : miniFirstDay.getDay() - 1;
  const miniDaysInMonth = new Date(miniYear, miniMonth + 1, 0).getDate();

  const miniDaysArray: (Date | null)[] = [];
  for (let i = 0; i < miniStartPadding; i++) {
    miniDaysArray.push(null);
  }
  for (let d = 1; d <= miniDaysInMonth; d++) {
    miniDaysArray.push(new Date(miniYear, miniMonth, d));
  }

  const miniCalendarHeaderLabel = miniCalendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#0F6E56] flex items-center justify-center shadow-md shadow-[#0F6E56]/20">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            Agenda de Citas
          </h1>
          <div className="flex flex-col gap-1 mt-1 ml-[52px]">
            <p className="text-xs text-slate-400 font-medium">{weekLabel}</p>
            
            {/* Quick navigation mini calendar */}
            <div className="relative inline-block self-start" ref={miniCalendarRef}>
              <button
                onClick={() => {
                  setMiniCalendarMonth(new Date(currentDate));
                  setShowMiniCalendar(!showMiniCalendar);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#0F6E56] hover:text-[#0c5945] font-bold transition-all bg-emerald-50/50 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/50 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>Navegación Rápida</span>
              </button>

              {showMiniCalendar && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-3xl border border-slate-100 shadow-2xl p-5 z-50 animate-fade-in space-y-4">
                  {/* Mini Calendar Header */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-extrabold text-slate-800 capitalize">
                      {miniCalendarHeaderLabel}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleMiniPrevMonth}
                        className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-colors border border-slate-50 cursor-pointer"
                        title="Mes anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleMiniNextMonth}
                        className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-colors border border-slate-50 cursor-pointer"
                        title="Mes siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Weekday columns */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, index) => (
                      <span key={index} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {miniDaysArray.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="h-8 w-8" />;
                      }

                      const dayStr = formatDateString(day);
                      const isToday = dayStr === todayStr;
                      const hasCita = citas.some((c) => c.fecha === dayStr);
                      const isSelected = formatDateString(currentDate) === dayStr;

                      return (
                        <button
                          key={dayStr}
                          type="button"
                          onClick={() => handleSelectMiniDate(day)}
                          className={`h-8 w-8 relative flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isToday
                              ? 'bg-[#0F6E56] text-white shadow-md shadow-[#0F6E56]/20'
                              : isSelected
                                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F6E56]'
                          }`}
                        >
                          <span>{day.getDate()}</span>
                          {hasCita && (
                            <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isToday ? 'bg-white' : 'bg-[#0F6E56]'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={handlePrevWeek} className="p-2.5 hover:bg-slate-50 text-slate-500 transition-colors border-r border-slate-100" title="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={handleToday} className="px-5 py-2 text-xs font-bold text-[#0F6E56] hover:bg-[#0F6E56]/5 transition-colors border-r border-slate-100">
              Hoy
            </button>
            <button onClick={handleNextWeek} className="p-2.5 hover:bg-slate-50 text-slate-500 transition-colors" title="Semana siguiente">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0c5945] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0F6E56]/20 transition-all hover:shadow-xl hover:shadow-[#0F6E56]/25"
          >
            <Plus className="h-4 w-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Upcoming notification */}
      {upcomingAppointments.length > 0 && (
        <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-5 rounded-2xl text-amber-900 shadow-sm">
          <div className="h-9 w-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm">¡Citas próximas en menos de 2 horas!</h4>
            <div className="text-xs font-medium mt-1.5 space-y-1 text-amber-800">
              {upcomingAppointments.map((cita) => (
                <div key={cita.id}>
                  • <span className="font-bold">{cita.nombrePaciente}</span> a las <span className="font-bold">{cita.horaInicio}</span> — {cita.motivo}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Week Grid */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent"></div>
            <p className="text-sm font-semibold text-slate-500 animate-pulse">Cargando agenda...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {weekDays.map((day) => {
              const dayStr = formatDateString(day);
              const isToday = dayStr === todayStr;
              const dayAppointments = citas.filter(c => c.fecha === dayStr);

              return (
                <div key={dayStr} className="min-h-[320px]">
                  {/* Day Header */}
                  <div className={`px-3 py-3 text-center border-b ${isToday ? 'bg-[#0F6E56]/[0.03]' : 'bg-slate-50/40'} border-slate-100`}>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </span>
                    <span className={`inline-flex items-center justify-center mt-1 text-sm font-extrabold ${
                      isToday 
                        ? 'bg-[#0F6E56] text-white h-8 w-8 rounded-full shadow-md shadow-[#0F6E56]/30' 
                        : 'text-slate-700'
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Appointments */}
                  <div className="p-2 space-y-2">
                    {dayAppointments.length > 0 ? (
                      dayAppointments.map((cita) => (
                        <div
                          key={cita.id}
                          onClick={() => { setSelectedCita(cita); setShowDetailModal(true); }}
                          className={`p-2.5 rounded-xl border-l-[3px] bg-white border border-slate-100 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${getBorderColor(cita.estado)} ${
                            cita.estado === 'cancelada' || cita.estado === 'no_asistio' ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3 text-[#0F6E56]" />
                            <span className="text-[10px] font-bold text-slate-700">{cita.horaInicio}</span>
                            <span className="text-[9px] text-slate-400 ml-auto">{cita.duracion}m</span>
                          </div>
                          <h4 className={`text-xs font-bold text-slate-800 truncate ${cita.estado === 'cancelada' ? 'line-through' : ''}`}>
                            {cita.nombrePaciente}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{cita.motivo}</p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center py-16">
                        <p className="text-[10px] italic text-slate-300">Sin citas</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal - Nueva Cita */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Agendar Nueva Cita</h3>
                <p className="text-xs text-slate-400 mt-0.5">Completa los datos para programar la consulta</p>
              </div>
              <button 
                onClick={() => { setShowCreateModal(false); setFormError(null); }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2.5 p-4 rounded-xl text-xs bg-red-50 text-red-700 border border-red-100 mb-6 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Paciente</label>
                <select
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10 outline-none bg-white transition-shadow"
                >
                  <option value="">Selecciona un paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.especie}) — {p.propietario.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10 outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10 outline-none transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duración</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuracion(d)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        duracion === d 
                          ? 'bg-[#0F6E56] text-white border-[#0F6E56] shadow-md shadow-[#0F6E56]/20' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motivo de Consulta</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  placeholder="Ej. Vacunación anual, revisión física, dolor de oído..."
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10 outline-none resize-none transition-shadow placeholder:text-slate-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setFormError(null); }}
                  className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-[#0F6E56] hover:bg-[#0c5945] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#0F6E56]/20 transition-all disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-800">Detalle de Cita</h3>
              <button 
                onClick={() => { setShowDetailModal(false); setSelectedCita(null); }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <div className="h-11 w-11 rounded-full bg-[#0F6E56]/10 flex items-center justify-center text-[#0F6E56]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paciente</span>
                  <span className="text-base font-extrabold text-slate-800">{selectedCita.nombrePaciente}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha</span>
                  <span className="text-sm font-bold text-slate-700">{selectedCita.fecha}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hora y Duración</span>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {selectedCita.horaInicio} ({selectedCita.duracion} min)
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Motivo</span>
                <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 p-4 rounded-xl leading-relaxed">
                  {selectedCita.motivo}
                </p>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado</span>
                <span className={`inline-block mt-1 text-[10px] font-extrabold uppercase px-3 py-1 rounded-lg ${
                  selectedCita.estado === 'realizada' ? 'bg-emerald-100 text-emerald-800' 
                  : selectedCita.estado === 'cancelada' ? 'bg-red-100 text-red-800' 
                  : selectedCita.estado === 'no_asistio' ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-50 text-blue-700'
                }`}>
                  {selectedCita.estado === 'no_asistio' ? 'No Asistió' : selectedCita.estado}
                </span>
              </div>

              {selectedCita.estado === 'programada' && (
                <div className="space-y-3 pt-5 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedCita.id!, 'cancelada')}
                      className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedCita.id!, 'no_asistio')}
                      className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      No Asistió
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedCita.id!, 'realizada')}
                      className="py-2.5 bg-[#0F6E56] hover:bg-[#0c5945] text-white rounded-xl text-[11px] font-bold shadow-md shadow-[#0F6E56]/15 transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Realizada
                    </button>
                  </div>
                </div>
              )}

              {selectedCita.estado === 'realizada' && (
                <div className="pt-5 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/pacientes/${selectedCita.pacienteId}/consultas/nueva`)}
                    className="w-full py-3 bg-[#0F6E56] hover:bg-[#0c5945] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#0F6E56]/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Iniciar Consulta
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
