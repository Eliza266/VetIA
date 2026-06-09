import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePacientes } from '../hooks/usePacientes';
import { useConsultas } from '../hooks/useConsultas';
import type { Paciente } from '../types';
import AudioRecorder from '../components/AudioRecorder';
import { ArrowLeft, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

const NuevaConsulta: React.FC = () => {
  const { id: pacienteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { getPaciente, loading: loadingPaciente } = usePacientes();
  const { crearConsulta, procesarAudioConsulta, error: apiError } = useConsultas();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPaciente = async () => {
      if (pacienteId) {
        const data = await getPaciente(pacienteId);
        setPaciente(data);
      }
    };
    loadPaciente();
  }, [pacienteId, getPaciente]);

  const handleAudioRecorded = async (audioBlob: Blob) => {
    if (!pacienteId) return;
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create a consultation document in Firestore to obtain a unique ID
      const newConsultaId = await crearConsulta(pacienteId);
      if (!newConsultaId) {
        throw new Error('No se pudo crear la consulta en la base de datos.');
      }

      // 2. Upload, transcribe and generate SOAP structure
      const success = await procesarAudioConsulta(newConsultaId, audioBlob);
      
      if (success) {
        // Redirect to details of this consultation
        navigate(`/pacientes/${pacienteId}/consultas/${newConsultaId}`);
      } else {
        throw new Error('El procesamiento del audio o SOAP falló. Consulta los logs.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error durante el procesamiento. Por favor intenta grabar de nuevo.');
      setIsProcessing(false);
    }
  };

  if (loadingPaciente) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent"></div>
          <p className="text-xs text-slate-500 font-medium">Cargando datos del paciente...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Paciente no encontrado</h3>
        <p className="text-sm text-slate-500 mb-6">No pudimos cargar la información del paciente para esta consulta.</p>
        <Link to="/pacientes" className="px-4 py-2.5 rounded-xl bg-[#0F6E56] text-white text-sm font-bold">
          Volver a Pacientes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Link
          to={`/pacientes/${paciente.id}`}
          className="p-2 bg-white rounded-xl border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-[#0F6E56] transition-colors"
          title="Volver al expediente"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Nueva Consulta</h1>
          <p className="text-xs text-slate-500">
            Grabación de audio de consulta para <span className="font-semibold text-slate-700">{paciente.nombre}</span>
          </p>
        </div>
      </div>

      {/* Error alert */}
      {(error || apiError) && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error:</span> {error || apiError}
          </div>
        </div>
      )}

      {/* Audio Recorder Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <AudioRecorder onAudioRecorded={handleAudioRecorded} isProcessing={isProcessing} />
        </div>
        
        {/* Instructions Card */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
            <HelpCircle className="h-4 w-4 text-[#0F6E56]" />
            ¿Cómo funciona?
          </h3>
          
          <ul className="space-y-3.5 text-xs text-slate-500">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 text-[10px] font-bold text-[#0F6E56] shrink-0">1</span>
              <span>Presiona el micrófono para iniciar la grabación de audio.</span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 text-[10px] font-bold text-[#0F6E56] shrink-0">2</span>
              <span>Habla con naturalidad describiendo los síntomas, tu examen físico y plan de tratamiento.</span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 text-[10px] font-bold text-[#0F6E56] shrink-0">3</span>
              <span>Presiona el botón de detener al terminar la consulta.</span>
            </li>
            <li className="flex gap-2 font-medium text-slate-700">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Nuestra IA generará las secciones SOAP de forma estructurada e inmediata.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NuevaConsulta;
export { NuevaConsulta };
