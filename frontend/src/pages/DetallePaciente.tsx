import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePacientes } from '../hooks/usePacientes';
import { useConsultas } from '../hooks/useConsultas';
import type { Paciente, Consulta } from '../types';
import {
  ArrowLeft,
  Plus,
  Phone,
  Mail,
  User,
  FileText,
  ShieldAlert,
  Info,
  ChevronRight
} from 'lucide-react';

const DetallePaciente: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { getPaciente } = usePacientes();
  const { fetchConsultasPorPaciente } = useConsultas();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultasPaciente, setConsultasPaciente] = useState<Consulta[]>([]);
  const [loadingGeneral, setLoadingGeneral] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setLoadingGeneral(false);
        return;
      }
      setLoadingGeneral(true);
      try {
        const pacData = await getPaciente(id);
        if (pacData) {
          setPaciente(pacData);
          try {
            const consData = await fetchConsultasPorPaciente(id);
            setConsultasPaciente(consData || []);
          } catch {
            // Consultation fetch failed (e.g. missing index) — show empty list
            setConsultasPaciente([]);
          }
        }
      } finally {
        setLoadingGeneral(false);
      }
    };
    loadData();
  }, [id]);

  if (loadingGeneral) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Cargando historial clínico...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Expediente no encontrado</h3>
        <p className="text-sm text-slate-500 mb-6">El paciente solicitado no existe o no tienes los permisos para visualizarlo.</p>
        <Link to="/pacientes" className="px-4 py-2.5 rounded-xl bg-[#0F6E56] text-white text-sm font-bold">
          Volver a Pacientes
        </Link>
      </div>
    );
  }

  // Calculate approximate age
  const getAge = (birthDateString?: string) => {
    if (!birthDateString) return 'No registrada';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age === 0) {
      const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + today.getMonth() - birthDate.getMonth();
      return months <= 0 ? 'Recién nacido' : `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${age} ${age === 1 ? 'año' : 'años'}`;
  };

  const getSpeciesEmoji = (esp: Paciente['especie']) => {
    switch (esp) {
      case 'perro': return '🐶';
      case 'gato': return '🐱';
      case 'ave': return '🦜';
      case 'reptil': return '🦎';
      default: return '🐾';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/pacientes"
            className="p-2 bg-white rounded-xl border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-[#0F6E56] transition-colors"
            title="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getSpeciesEmoji(paciente.especie)}</span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">{paciente.nombre}</h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">Expediente Médico #{paciente.id?.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        <Link
          to={`/pacientes/${paciente.id}/consultas/nueva`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0c5945] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0F6E56]/15 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva Consulta
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Medical card & Owner card */}
        <div className="space-y-6">
          {/* Pet Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">Datos Fisiológicos</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50/50">
                <span className="text-slate-400 font-medium">Especie</span>
                <span className="font-bold text-slate-700 capitalize">{paciente.especie}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50/50">
                <span className="text-slate-400 font-medium">Raza</span>
                <span className="font-bold text-slate-700">{paciente.raza || 'Mestizo'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50/50">
                <span className="text-slate-400 font-medium">Sexo</span>
                <span className="font-bold text-slate-700 capitalize">{paciente.sexo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50/50">
                <span className="text-slate-400 font-medium">Reproducción</span>
                <span className="font-bold text-slate-700 capitalize">{paciente.estadoReproductivo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50/50">
                <span className="text-slate-400 font-medium">Edad</span>
                <span className="font-bold text-slate-700">{getAge(paciente.fechaNacimiento)}</span>
              </div>
              {paciente.fechaNacimiento && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Fecha Nac.</span>
                  <span className="font-bold text-slate-700">{new Date(paciente.fechaNacimiento).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Owner details card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">Información del Propietario</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nombre del Dueño</div>
                  <div className="text-sm font-bold text-slate-700">{paciente.propietario.nombre}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Teléfono</div>
                  <a href={`tel:${paciente.propietario.telefono}`} className="text-sm font-bold text-[#0F6E56] hover:underline">
                    {paciente.propietario.telefono}
                  </a>
                </div>
              </div>

              {paciente.propietario.email && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Correo Electrónico</div>
                    <a href={`mailto:${paciente.propietario.email}`} className="text-sm font-bold text-slate-700 hover:underline truncate block max-w-[180px]">
                      {paciente.propietario.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* General Notes Card */}
          {paciente.notasGenerales && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 text-amber-700">
                <Info className="h-4 w-4" />
                Alertas / Notas Clínicas
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                {paciente.notasGenerales}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Timeline / Clinical Consultations History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-6">Historial de Consultas Clínicas</h3>

            {consultasPaciente.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm">No hay consultas registradas en este expediente.</p>
                <p className="text-xs text-slate-400 mt-1">Haz clic en "Nueva Consulta" para iniciar una evaluación clínica.</p>
              </div>
            ) : (
              <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-8">
                {consultasPaciente.map((consulta) => (
                  <div key={consulta.id} className="relative group">
                    {/* Circle icon on the timeline */}
                    <span className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${consulta.estado === 'aprobada'
                        ? 'bg-emerald-500'
                        : consulta.estado === 'procesando'
                          ? 'bg-amber-500 animate-pulse'
                          : consulta.estado === 'error'
                            ? 'bg-red-500'
                            : 'bg-slate-400'
                      }`}></span>

                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 group-hover:bg-slate-50 group-hover:border-slate-200 transition-all">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">
                            {new Date(consulta.fechaHora).toLocaleDateString()}
                          </span>
                          <span className="text-slate-300 text-xs">•</span>
                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(consulta.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* State indicator tag */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${consulta.estado === 'aprobada'
                            ? 'bg-emerald-50 text-emerald-700'
                            : consulta.estado === 'procesando'
                              ? 'bg-amber-50 text-amber-700 animate-pulse'
                              : consulta.estado === 'error'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                          {consulta.estado === 'aprobada' ? 'Completado' : consulta.estado === 'procesando' ? 'Procesando con IA' : consulta.estado === 'error' ? 'Error' : 'Borrador'}
                        </span>
                      </div>

                      {/* Snippet details */}
                      {consulta.soap ? (
                        <div className="space-y-1 mt-3">
                          <div className="text-xs text-slate-600 truncate">
                            <span className="font-semibold text-slate-700">S:</span> {consulta.soap.subjetivo}
                          </div>
                          <div className="text-xs text-slate-600 truncate">
                            <span className="font-semibold text-slate-700">A:</span> {consulta.soap.analisis}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-400 mt-2">
                          {consulta.estado === 'procesando' ? 'La IA está generando la nota...' : 'Consulta clínica vacía.'}
                        </p>
                      )}

                      <div className="flex justify-end mt-4 pt-3 border-t border-slate-100/50">
                        <Link
                          to={`/pacientes/${paciente.id}/consultas/${consulta.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0F6E56] hover:underline"
                        >
                          Ver Consulta
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
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

export default DetallePaciente;
export { DetallePaciente };
