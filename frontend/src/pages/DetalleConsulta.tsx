import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useConsultas } from '../hooks/useConsultas';
import { usePacientes } from '../hooks/usePacientes';
import type { Consulta, Paciente, SOAP } from '../types';
import SoapViewer from '../components/SoapViewer';
import { 
  ArrowLeft, 
  FileAudio, 
  FileText, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

const DetalleConsulta: React.FC = () => {
  const { pacienteId, consultaId } = useParams<{ pacienteId: string; consultaId: string }>();
  
  const { getPaciente } = usePacientes();
  const { getConsulta, actualizarConsulta, error: apiError } = useConsultas();

  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (consultaId && pacienteId) {
        setLoading(true);
        try {
          const consData = await getConsulta(consultaId);
          setConsulta(consData);
          
          const pacData = await getPaciente(pacienteId);
          setPaciente(pacData);
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Error al cargar los detalles de la consulta.');
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [consultaId, pacienteId]);

  const handleSaveSoap = async (updatedSoap: SOAP) => {
    if (!consultaId) return;
    try {
      const ok = await actualizarConsulta(consultaId, { soap: updatedSoap });
      if (ok) {
        setConsulta((prev) => prev ? { ...prev, soap: updatedSoap } : null);
      } else {
        throw new Error('No se pudo guardar la nota en la base de datos.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al actualizar la nota SOAP.');
    }
  };

  const handleApprove = async () => {
    if (!consultaId) return;
    setIsApproving(true);
    setError(null);
    try {
      const ok = await actualizarConsulta(consultaId, { estado: 'aprobada' });
      if (ok) {
        setConsulta((prev) => prev ? { ...prev, estado: 'aprobada' } : null);
      } else {
        throw new Error('No se pudo cambiar el estado de la consulta.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al aprobar la consulta.');
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Cargando consulta...</p>
        </div>
      </div>
    );
  }

  if (error || !consulta || !paciente) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Error al cargar consulta</h3>
        <p className="text-sm text-slate-500 mb-6">{error || apiError || 'No se encontró el registro clínico.'}</p>
        <Link to="/pacientes" className="px-4 py-2.5 rounded-xl bg-[#0F6E56] text-white text-sm font-bold">
          Volver a Pacientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/pacientes/${paciente.id}`}
            className="p-2 bg-white rounded-xl border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-[#0F6E56] transition-colors"
            title="Volver al expediente"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Consulta Médica</h1>
            <p className="text-xs text-slate-500">
              Paciente: <span className="font-bold text-slate-700">{paciente.nombre}</span> • Expediente #{paciente.id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        {consulta.estado !== 'aprobada' && consulta.soap && (
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0c5945] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0F6E56]/15 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isApproving ? 'Aprobando...' : 'Aprobar Consulta'}
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Audio and Transcription */}
        <div className="space-y-6 lg:col-span-1">
          {/* Audio player card */}
          {consulta.audioUrl && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
                <FileAudio className="h-4.5 w-4.5 text-[#0F6E56]" />
                Grabación de Audio
              </h3>
              
              <audio 
                src={consulta.audioUrl} 
                controls 
                className="w-full focus:outline-none"
              />
            </div>
          )}

          {/* Transcription Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
              <FileText className="h-4.5 w-4.5 text-[#0F6E56]" />
              Transcripción Original
            </h3>

            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 max-h-[300px] overflow-y-auto">
              {consulta.transcripcion ? (
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {consulta.transcripcion}
                </p>
              ) : (
                <p className="text-xs italic text-slate-400">
                  No hay transcripción disponible para esta consulta.
                </p>
              )}
            </div>
          </div>

          {/* Consultation Metadata Info Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">Detalles del Registro</h3>
            <div className="space-y-2.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Fecha y Hora</span>
                <span className="font-semibold text-slate-700">
                  {new Date(consulta.fechaHora).toLocaleDateString()} a las {new Date(consulta.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Estado del Reporte</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  consulta.estado === 'aprobada' 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : consulta.estado === 'procesando'
                    ? 'bg-amber-50 text-amber-700'
                    : consulta.estado === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {consulta.estado === 'aprobada' ? 'Aprobada' : consulta.estado === 'procesando' ? 'Procesando' : consulta.estado === 'error' ? 'Error' : 'Borrador'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - SOAP note (SoapViewer) */}
        <div className="lg:col-span-2">
          {consulta.estado === 'procesando' ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent mx-auto"></div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Procesando nota SOAP</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  La Inteligencia Artificial está analizando la transcripción clínica. La nota se estructurará automáticamente en breve.
                </p>
              </div>
            </div>
          ) : (
            <SoapViewer soap={consulta.soap} onSave={handleSaveSoap} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleConsulta;
export { DetalleConsulta };
