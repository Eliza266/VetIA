import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePacientes } from '../hooks/usePacientes';
import { useConsultas } from '../hooks/useConsultas';
import type { Paciente, SignosVitales } from '../types';
import AudioRecorder from '../components/AudioRecorder';
import { ArrowLeft, AlertCircle, Sparkles, HelpCircle, Activity, Thermometer, Heart, Wind } from 'lucide-react';

const PRIORIDADES = [
  { value: 'urgente',    label: 'Urgente',     color: 'bg-red-50 text-red-700 border-red-200',     dot: 'bg-red-500' },
  { value: 'rutina',     label: 'Rutina',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'seguimiento',label: 'Seguimiento', color: 'bg-blue-50 text-blue-700 border-blue-200',  dot: 'bg-blue-500' },
  { value: 'brigada',    label: 'Brigada',     color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
];

const NuevaConsulta: React.FC = () => {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const navigate = useNavigate();

  const { getPaciente, loading: loadingPaciente } = usePacientes();
  const { crearConsulta, actualizarConsulta, procesarAudioConsulta, error: apiError } = useConsultas();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-consultation data
  const [motivo, setMotivo] = useState('');
  const [prioridad, setPrioridad] = useState<'urgente' | 'rutina' | 'seguimiento' | 'brigada'>('rutina');
  const [sv, setSv] = useState<SignosVitales>({});
  const [consultaIdCreada, setConsultaIdCreada] = useState<string | null>(null);
  const [datosSaved, setDatosSaved] = useState(false);
  const [savingDatos, setSavingDatos] = useState(false);

  useEffect(() => {
    const loadPaciente = async () => {
      if (pacienteId) {
        const data = await getPaciente(pacienteId);
        setPaciente(data);
      }
    };
    loadPaciente();
  }, [pacienteId, getPaciente]);

  const handleSvChange = (field: keyof SignosVitales, value: string) => {
    setSv((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : isNaN(Number(value)) ? value : Number(value),
    }));
  };

  const handleSaveDatos = async () => {
    if (!pacienteId || !motivo.trim()) {
      setError('El motivo de consulta es obligatorio.');
      return;
    }
    setError(null);
    setSavingDatos(true);
    try {
      const id = await crearConsulta(pacienteId);
      if (!id) throw new Error('No se pudo crear la consulta.');
      const updates: any = { motivo: motivo.trim(), prioridad };
      const cleanSv: SignosVitales = {};
      Object.entries(sv).forEach(([k, v]) => { if (v !== undefined && v !== '') cleanSv[k as keyof SignosVitales] = v as any; });
      if (Object.keys(cleanSv).length > 0) updates.signosVitales = cleanSv;
      await actualizarConsulta(id, updates);
      setConsultaIdCreada(id);
      setDatosSaved(true);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los datos.');
    } finally {
      setSavingDatos(false);
    }
  };

  const handleAudioRecorded = async (audioBlob: Blob) => {
    if (!pacienteId || !consultaIdCreada) return;
    setIsProcessing(true);
    setError(null);
    try {
      const success = await procesarAudioConsulta(consultaIdCreada, audioBlob);
      if (success) {
        navigate(`/pacientes/${pacienteId}/consultas/${consultaIdCreada}`);
      } else {
        throw new Error('El procesamiento del audio o SOAP falló.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error durante el procesamiento. Por favor intenta de nuevo.');
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
            Paciente: <span className="font-semibold text-slate-700">{paciente.nombre}</span>
            {paciente.especie && <span className="ml-1 text-slate-400">· {paciente.especie}</span>}
          </p>
        </div>
      </div>

      {/* Error alert */}
      {(error || apiError) && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div><span className="font-bold">Error:</span> {error || apiError}</div>
        </div>
      )}

      {/* STEP 1 — Pre-consultation data */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0F6E56]/10 text-[#0F6E56] text-xs font-bold">1</span>
            Datos de la Consulta
          </h2>
          {datosSaved && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">✓ Guardado</span>
          )}
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Motivo de Consulta <span className="text-red-500">*</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Describe el motivo principal de la consulta..."
            disabled={datosSaved}
            className="w-full px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] focus:bg-white outline-none transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prioridad</label>
          <div className="flex flex-wrap gap-2">
            {PRIORIDADES.map((p) => (
              <button
                key={p.value}
                type="button"
                disabled={datosSaved}
                onClick={() => setPrioridad(p.value as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  prioridad === p.value
                    ? `${p.color} ring-2 ring-offset-1 ring-current shadow-sm`
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${prioridad === p.value ? p.dot : 'bg-slate-300'}`} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Signos Vitales */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Signos Vitales <span className="text-slate-400 font-normal normal-case">(Opcionales)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { field: 'peso', label: 'Peso', unit: 'kg', icon: Activity, placeholder: '0.0' },
              { field: 'temperatura', label: 'Temperatura', unit: '°C', icon: Thermometer, placeholder: '38.5' },
              { field: 'frecuenciaCardiaca', label: 'FC', unit: 'L/min', icon: Heart, placeholder: '80' },
              { field: 'frecuenciaRespiratoria', label: 'FR', unit: 'R/min', icon: Wind, placeholder: '20' },
              { field: 'condicionCorporal', label: 'Condición Corporal', unit: '1–5', icon: Activity, placeholder: '3' },
            ].map(({ field, label, unit, placeholder }) => (
              <div key={field} className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={(sv as any)[field] ?? ''}
                    onChange={(e) => handleSvChange(field as keyof SignosVitales, e.target.value)}
                    disabled={datosSaved}
                    className="w-full px-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] focus:bg-white outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    min={0}
                    step={field === 'peso' || field === 'temperatura' ? 0.1 : 1}
                  />
                  <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!datosSaved && (
          <button
            type="button"
            onClick={handleSaveDatos}
            disabled={savingDatos || !motivo.trim()}
            className="w-full py-2.5 bg-[#0F6E56] hover:bg-[#0c5945] text-white text-sm font-bold rounded-xl shadow-md shadow-[#0F6E56]/15 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingDatos ? 'Guardando...' : '✓ Confirmar y continuar a grabación'}
          </button>
        )}
      </div>

      {/* STEP 2 — Audio recorder */}
      {datosSaved && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-3">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0F6E56]/10 text-[#0F6E56] text-xs font-bold">2</span>
                Grabación de Audio
              </h2>
            </div>
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
                <span>Habla con naturalidad describiendo síntomas, examen físico y plan de tratamiento.</span>
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
      )}
    </div>
  );
};

export default NuevaConsulta;
export { NuevaConsulta };
