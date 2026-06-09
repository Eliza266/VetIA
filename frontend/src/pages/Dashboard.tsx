import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePacientes } from '../hooks/usePacientes';
import { useConsultas } from '../hooks/useConsultas';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Plus, 
  TrendingUp, 
  Play
} from 'lucide-react';
import type { Consulta, Paciente } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { pacientes, loading: loadingPacientes } = usePacientes();
  const { fetchTodasConsultas } = useConsultas();
  
  const [todasConsultas, setTodasConsultas] = useState<Consulta[]>([]);
  const [loadingGeneral, setLoadingGeneral] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (user) {
        setLoadingGeneral(true);
        const list = await fetchTodasConsultas();
        setTodasConsultas(list || []);
        setLoadingGeneral(false);
      }
    };
    loadDashboardData();
  }, [user, fetchTodasConsultas]);

  // Statistics calculations
  const totalPacientes = pacientes.length;
  const totalConsultas = todasConsultas.length;
  const consultasProcesadas = todasConsultas.filter(c => c.estado === 'aprobada' || c.soap).length;
  // Consultas pendientes (unused local removed)

  // Find patient name for a consultation
  const getPatientName = (pacienteId: string) => {
    const p = pacientes.find(pat => pat.id === pacienteId);
    return p ? p.nombre : 'Paciente desconocido';
  };

  const getPatientSpecies = (pacienteId: string): Paciente['especie'] => {
    const p = pacientes.find(pat => pat.id === pacienteId);
    return p ? p.especie : 'otro';
  };

  if (loadingPacientes || loadingGeneral) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0F6E56] text-white p-6 sm:p-8 shadow-lg shadow-[#0F6E56]/10">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] rounded-full bg-white/5 blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full">
              Panel de control
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-2 mb-1">
              Hola, Dr. {user?.nombre || 'Veterinario'}
            </h1>
            <p className="text-emerald-100 text-sm">
              ¿Listo para simplificar tus consultas de hoy? Graba y deja que la IA haga el resto.
            </p>
          </div>
          
          <div className="flex gap-3 shrink-0">
            <Link
              to="/pacientes/nuevo"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0F6E56] hover:bg-emerald-50 transition-colors shadow-md shadow-black/5"
            >
              <Plus className="h-4 w-4" />
              Nuevo Paciente
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-[#0F6E56] shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pacientes</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalPacientes}</h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consultas Totales</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalConsultas}</h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SOAP con IA</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{consultasProcesadas}</h3>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Eficiencia de IA</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {totalConsultas > 0 ? `${Math.round((consultasProcesadas / totalConsultas) * 100)}%` : '0%'}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Recent Consultations & Patients Quick Finder */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Consultations Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Consultas Recientes</h2>
                <p className="text-xs text-slate-400">Últimas consultas clínicas realizadas</p>
              </div>
            </div>
            
            {todasConsultas.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Aún no has registrado ninguna consulta. Ve a la sección de pacientes para iniciar una.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todasConsultas.slice(0, 5).map((consulta) => {
                  const patientName = getPatientName(consulta.pacienteId);
                  const species = getPatientSpecies(consulta.pacienteId);
                  
                  return (
                    <div key={consulta.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {species === 'perro' ? '🐶' : species === 'gato' ? '🐱' : species === 'ave' ? '🦜' : species === 'reptil' ? '🦎' : '🐾'}
                        </span>
                        <div>
                          <Link to={`/pacientes/${consulta.pacienteId}`} className="font-semibold text-sm text-slate-800 hover:text-[#0F6E56] hover:underline">
                            {patientName}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>{new Date(consulta.fechaHora).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(consulta.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Status badge */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          consulta.estado === 'aprobada' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : consulta.estado === 'procesando'
                            ? 'bg-amber-50 text-amber-700 animate-pulse'
                            : consulta.estado === 'error'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {consulta.estado === 'aprobada' ? 'Completado' : consulta.estado === 'procesando' ? 'Procesando' : consulta.estado === 'error' ? 'Error' : 'Borrador'}
                        </span>
                        
                        <Link
                          to={`/pacientes/${consulta.pacienteId}/consultas/${consulta.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-[#0F6E56] hover:bg-[#0F6E56]/5 text-slate-400 hover:text-[#0F6E56] transition-all"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Recent Patients */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Pacientes Recientes</h2>
              <Link to="/pacientes" className="text-xs font-bold text-[#0F6E56] hover:underline">
                Ver todos
              </Link>
            </div>

            {pacientes.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-sm">
                No tienes pacientes asignados todavía.
              </p>
            ) : (
              <div className="space-y-4">
                {pacientes.slice(0, 3).map((paciente) => (
                  <div key={paciente.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl">
                        {paciente.especie === 'perro' ? '🐶' : paciente.especie === 'gato' ? '🐱' : paciente.especie === 'ave' ? '🦜' : paciente.especie === 'reptil' ? '🦎' : '🐾'}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-snug">{paciente.nombre}</h4>
                        <p className="text-xs text-slate-400 capitalize">{paciente.sexo} • {paciente.raza || 'Mestizo'}</p>
                      </div>
                    </div>
                    <Link
                      to={`/pacientes/${paciente.id}`}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#0F6E56] hover:border-[#0F6E56] transition-colors shadow-sm"
                      title="Ver expediente"
                    >
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Arrow icon fallback if lucide ArrowRight is imported differently
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default Dashboard;
export { Dashboard };
