import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useConsultas } from '../hooks/useConsultas';
import { usePacientes } from '../hooks/usePacientes';
import { useAuth } from '../hooks/useAuth';
import type { Consulta, Paciente, SOAP } from '../types';
import SoapViewer from '../components/SoapViewer';
import { 
  ArrowLeft, 
  FileAudio, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  Download,
  Sparkles,
  Pill,
  Stethoscope,
  Activity
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const PRIORIDAD_COLORS: Record<string, string> = {
  urgente: 'bg-red-50 text-red-700 border-red-200',
  rutina: 'bg-green-50 text-green-700 border-green-200',
  seguimiento: 'bg-blue-50 text-blue-700 border-blue-200',
  brigada: 'bg-orange-50 text-orange-700 border-orange-200'
};

const PRIORIDAD_LABELS: Record<string, string> = {
  urgente: 'Urgente',
  rutina: 'Rutina',
  seguimiento: 'Seguimiento',
  brigada: 'Brigada'
};

const DetalleConsulta: React.FC = () => {
  const { pacienteId, consultaId } = useParams<{ pacienteId: string; consultaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { getPaciente } = usePacientes();
  const { getConsulta, actualizarConsulta, eliminarConsulta, error: apiError } = useConsultas();

  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!consultaId || !pacienteId) return;
    const confirmDelete = window.confirm('¿Estás seguro de eliminar esta consulta? Esta acción no se puede deshacer.');
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const ok = await eliminarConsulta(consultaId);
      if (ok) {
        navigate(`/pacientes/${pacienteId}`);
      } else {
        throw new Error('No se pudo eliminar la consulta.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al eliminar la consulta.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMedToPlan = async (med: any) => {
    if (!consulta || !consulta.soap) return;
    
    const currentPlan = consulta.soap.plan || '';
    const medLine = `• ${med.nombre} | ${med.dosis} | ${med.via} | ${med.frecuencia} | ${med.duracion}`;
    const newPlan = currentPlan ? `${currentPlan}\n${medLine}` : medLine;
    
    await handleSaveSoap({
      ...consulta.soap,
      plan: newPlan
    });
  };

  const handleDownloadPDF = () => {
    if (!consulta || !paciente || !user) return;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 14;

    const checkPage = (needed: number) => {
      if (y + needed > 275) {
        pdf.addPage();
        y = 20;
      }
    };

    // --- ENCABEZADO (OFICIAL) ---
    pdf.setFillColor(15, 110, 86);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.text(user.veterinaria || "Clínica Veterinaria", 14, 16);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(user.sede ? `Sede: ${user.sede} - ${user.ciudad || ''}` : "Sede Principal", 14, 23);
    pdf.text(`Tel: ${user.telefono || user.whatsapp || 'No registrado'}`, 14, 28);
    
    // Prominent HC Number
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(`HISTORIA CLÍNICA N° ${consulta.numeroHC || 'S/N'}`, pageWidth - 14, 22, { align: 'right' });
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Fecha: ${new Date(consulta.fechaHora).toLocaleDateString('es-CO')}`, pageWidth - 14, 28, { align: 'right' });

    y = 45;

    // --- SECCIÓN I: DATOS PACIENTE ---
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 110, 86);
    pdf.text("I. DATOS DEL PACIENTE Y PROPIETARIO", 14, y);
    y += 6;

    // Table format for patient
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(245, 245, 245);
    pdf.rect(14, y, pageWidth - 28, 30);
    
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    
    // Row 1
    pdf.setFont("helvetica", "bold"); pdf.text("Nombre:", 16, y + 6);
    pdf.setFont("helvetica", "normal"); pdf.text(paciente.nombre, 35, y + 6);
    pdf.setFont("helvetica", "bold"); pdf.text("Especie:", 80, y + 6);
    pdf.setFont("helvetica", "normal"); pdf.text(paciente.especie, 98, y + 6);
    pdf.setFont("helvetica", "bold"); pdf.text("Raza:", 140, y + 6);
    pdf.setFont("helvetica", "normal"); pdf.text(paciente.raza || "N/A", 152, y + 6);
    
    // Row 2
    pdf.setFont("helvetica", "bold"); pdf.text("Sexo:", 16, y + 13);
    pdf.setFont("helvetica", "normal"); pdf.text(paciente.sexo, 35, y + 13);
    pdf.setFont("helvetica", "bold"); pdf.text("Color:", 80, y + 13);
    pdf.setFont("helvetica", "normal"); pdf.text(paciente.color || "N/A", 98, y + 13);
    pdf.setFont("helvetica", "bold"); pdf.text("Chip:", 140, y + 13);
    pdf.setFont("helvetica", "normal"); pdf.text(paciente.chip || "N/A", 152, y + 13);

    // Row 3
    pdf.setFont("helvetica", "bold"); pdf.text("Edad:", 16, y + 20);
    pdf.setFont("helvetica", "normal"); pdf.text(paciente.fechaNacimiento ? new Date().getFullYear() - new Date(paciente.fechaNacimiento).getFullYear() + " años" : "N/A", 35, y + 20);
    pdf.setFont("helvetica", "bold"); pdf.text("Peso:", 80, y + 20);
    pdf.setFont("helvetica", "normal"); pdf.text(consulta.signosVitales?.peso ? `${consulta.signosVitales.peso} kg` : "N/A", 98, y + 20);

    // Row 4 (Propietario)
    pdf.line(14, y + 23, pageWidth - 14, y + 23);
    pdf.setFont("helvetica", "bold"); pdf.text("Propietario:", 16, y + 28);
    pdf.setFont("helvetica", "normal"); pdf.text(paciente.propietario.nombre, 40, y + 28);
    pdf.setFont("helvetica", "bold"); pdf.text("Teléfono:", 100, y + 28);
    pdf.setFont("helvetica", "normal"); pdf.text(paciente.propietario.telefono, 120, y + 28);
    
    y += 38;

    // --- SECCIÓN II: DATOS CONSULTA ---
    checkPage(30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 110, 86);
    pdf.text("II. DATOS DE LA CONSULTA", 14, y);
    y += 6;

    pdf.rect(14, y, pageWidth - 28, 20);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    
    pdf.setFont("helvetica", "bold"); pdf.text("Fecha/Hora:", 16, y + 6);
    pdf.setFont("helvetica", "normal"); pdf.text(`${new Date(consulta.fechaHora).toLocaleString('es-CO')}`, 40, y + 6);
    pdf.setFont("helvetica", "bold"); pdf.text("Prioridad:", 100, y + 6);
    pdf.setFont("helvetica", "normal"); pdf.text(PRIORIDAD_LABELS[consulta.prioridad || 'rutina'], 120, y + 6);
    
    pdf.setFont("helvetica", "bold"); pdf.text("Motivo:", 16, y + 13);
    pdf.setFont("helvetica", "normal"); 
    const motivoLines = pdf.splitTextToSize(consulta.motivo || "No reportado", pageWidth - 45);
    pdf.text(motivoLines, 32, y + 13);
    
    y += 28;

    // --- SECCIÓN III: SIGNOS VITALES ---
    if (consulta.signosVitales && Object.keys(consulta.signosVitales).length > 0) {
      checkPage(20);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(15, 110, 86);
      pdf.text("III. EXAMEN FÍSICO / SIGNOS VITALES", 14, y);
      y += 6;

      pdf.rect(14, y, pageWidth - 28, 12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      
      let xOffset = 16;
      const vitales = [
        { label: "Peso", val: consulta.signosVitales.peso ? `${consulta.signosVitales.peso} kg` : null },
        { label: "Temp", val: consulta.signosVitales.temperatura ? `${consulta.signosVitales.temperatura} °C` : null },
        { label: "FC", val: consulta.signosVitales.frecuenciaCardiaca ? `${consulta.signosVitales.frecuenciaCardiaca} lpm` : null },
        { label: "FR", val: consulta.signosVitales.frecuenciaRespiratoria ? `${consulta.signosVitales.frecuenciaRespiratoria} rpm` : null },
        { label: "CC", val: consulta.signosVitales.condicionCorporal ? `${consulta.signosVitales.condicionCorporal}/5` : null }
      ].filter(v => v.val !== null);

      if (vitales.length > 0) {
        vitales.forEach((v) => {
          pdf.setFont("helvetica", "bold");
          pdf.text(`${v.label}:`, xOffset, y + 7);
          pdf.setFont("helvetica", "normal");
          pdf.text(v.val!, xOffset + pdf.getTextWidth(`${v.label}: `), y + 7);
          xOffset += 35;
        });
      } else {
        pdf.text("No registrados en esta consulta.", 16, y + 7);
      }
      y += 20;
    }

    // --- SECCIÓN IV: SOAP ---
    const soap = consulta.soap || { subjetivo: '', objetivo: '', analisis: '', plan: '' };
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 110, 86);
    pdf.text("IV. NOTA DE EVOLUCIÓN (SOAP)", 14, y);
    y += 8;

    const soapSections = [
      { title: "SUBJETIVO (S)", text: soap.subjetivo },
      { title: "OBJETIVO (O)", text: soap.objetivo },
      { title: "ANÁLISIS (A)", text: soap.analisis }
    ];
    
    soapSections.forEach((section) => {
      checkPage(15);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text(section.title, 14, y);
      y += 5;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      const lines = pdf.splitTextToSize(section.text || "No registrado", pageWidth - 28);
      lines.forEach((line: string) => {
        checkPage(5);
        pdf.text(line, 14, y);
        y += 4.5;
      });
      y += 4;
    });

    // --- SECCIÓN V: RECETA Y PLAN ---
    checkPage(30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 110, 86);
    pdf.text("V. PLAN MÉDICO / RECETA", 14, y);
    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    const planLines = pdf.splitTextToSize(soap.plan || "Sin plan médico registrado", pageWidth - 28);
    planLines.forEach((line: string) => {
      checkPage(5);
      pdf.text(line, 14, y);
      y += 4.5;
    });
    
    y += 15;

    // --- FIRMA Y PIE DE PÁGINA ---
    checkPage(40);
    y += 20; // Space for signature
    pdf.line(14, y, 80, y);
    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text(`Dr(a). ${user.nombre}`, 14, y);
    y += 4;
    pdf.setFont("helvetica", "normal");
    if (user.matriculaProfesional) {
      pdf.text(`Matrícula Profesional: ${user.matriculaProfesional}`, 14, y);
    }
    
    // Page footers
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(220, 220, 220);
      pdf.line(14, 282, pageWidth - 14, 282);
      
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      pdf.setTextColor(140, 140, 140);
      pdf.text("Generado por VetIA - Software Clínico Veterinario", 14, 288);
      pdf.text(`Impreso: ${new Date().toLocaleString('es-CO')}`, pageWidth / 2, 288, { align: 'center' });
      pdf.text(`Página ${i} de ${pageCount}`, pageWidth - 14, 288, { align: 'right' });
    }
    
    const filename = `HC_${consulta.numeroHC || 'SF'}_${paciente.nombre.replace(/\s/g, '_')}.pdf`;
    pdf.save(filename);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Cargando consulta...</p>
        </div>
      </div>
    );
  }

  if (error || !consulta || !paciente) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Error al cargar</h3>
        <p className="text-sm text-slate-500 mb-6">{error || apiError || 'No se encontró el registro clínico.'}</p>
        <Link to="/pacientes" className="px-4 py-2.5 rounded-xl bg-[#0F6E56] text-white text-sm font-bold">
          Volver a Pacientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation & Header */}
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
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-800">
                Historia Clínica {consulta.numeroHC && <span className="text-[#0F6E56]">#{consulta.numeroHC}</span>}
              </h1>
              {consulta.prioridad && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${PRIORIDAD_COLORS[consulta.prioridad]}`}>
                  {PRIORIDAD_LABELS[consulta.prioridad]}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Paciente: <Link to={`/pacientes/${paciente.id}`} className="font-bold text-[#0F6E56] hover:underline">{paciente.nombre}</Link> • {new Date(consulta.fechaHora).toLocaleString('es-CO')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          {consulta.estado === 'borrador' && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}

          {consulta.estado === 'aprobada' && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0F6E56]/10 hover:bg-[#0F6E56]/20 border border-[#0F6E56]/10 px-4 py-2.5 text-sm font-bold text-[#0F6E56] transition-all"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </button>
          )}

          {consulta.estado !== 'aprobada' && consulta.soap && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0c5945] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0F6E56]/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5" />
              {isApproving ? 'Aprobando...' : 'Aprobar Consulta'}
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Metadata, Vitals, Audio */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Motivo Card */}
          {consulta.motivo && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
                <Stethoscope className="h-4 w-4 text-[#0F6E56]" />
                Motivo de Consulta
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {consulta.motivo}
              </p>
            </div>
          )}

          {/* Vitals Table */}
          {consulta.signosVitales && Object.values(consulta.signosVitales).some(v => v) && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
                <Activity className="h-4 w-4 text-[#0F6E56]" />
                Signos Vitales
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-slate-100">
                    {consulta.signosVitales.peso && (
                      <tr className="bg-slate-50/50"><th className="px-3 py-2 text-slate-500 font-medium w-1/2">Peso</th><td className="px-3 py-2 font-bold text-slate-700">{consulta.signosVitales.peso} kg</td></tr>
                    )}
                    {consulta.signosVitales.temperatura && (
                      <tr><th className="px-3 py-2 text-slate-500 font-medium">Temperatura</th><td className="px-3 py-2 font-bold text-slate-700">{consulta.signosVitales.temperatura} °C</td></tr>
                    )}
                    {consulta.signosVitales.frecuenciaCardiaca && (
                      <tr className="bg-slate-50/50"><th className="px-3 py-2 text-slate-500 font-medium">F. Cardíaca</th><td className="px-3 py-2 font-bold text-slate-700">{consulta.signosVitales.frecuenciaCardiaca} lpm</td></tr>
                    )}
                    {consulta.signosVitales.frecuenciaRespiratoria && (
                      <tr><th className="px-3 py-2 text-slate-500 font-medium">F. Respiratoria</th><td className="px-3 py-2 font-bold text-slate-700">{consulta.signosVitales.frecuenciaRespiratoria} rpm</td></tr>
                    )}
                    {consulta.signosVitales.condicionCorporal && (
                      <tr className="bg-slate-50/50"><th className="px-3 py-2 text-slate-500 font-medium">Cond. Corporal</th><td className="px-3 py-2 font-bold text-slate-700">{consulta.signosVitales.condicionCorporal}/5</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audio player card */}
          {consulta.audioUrl && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
                <FileAudio className="h-4 w-4 text-[#0F6E56]" />
                Grabación de Audio
              </h3>
              <audio src={consulta.audioUrl} controls className="w-full focus:outline-none h-10" />
            </div>
          )}

          {/* Transcription Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
              <FileText className="h-4 w-4 text-[#0F6E56]" />
              Transcripción Original
            </h3>
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 max-h-[300px] overflow-y-auto">
              {consulta.transcripcion ? (
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{consulta.transcripcion}</p>
              ) : (
                <p className="text-xs italic text-slate-400">No hay transcripción disponible para esta consulta.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - SOAP note & Suggestions */}
        <div className="lg:col-span-2 space-y-6">
          {consulta.estado === 'procesando' ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent mx-auto"></div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Procesando nota SOAP</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  La Inteligencia Artificial está analizando la transcripción clínica.
                </p>
              </div>
            </div>
          ) : (
            <>
              <SoapViewer soap={consulta.soap} onSave={consulta.estado === 'borrador' ? handleSaveSoap : undefined} />
              
              {/* IA Suggestions (Compact Table) */}
              {consulta.soap?.medicamentosSugeridos && consulta.soap.medicamentosSugeridos.length > 0 && (consulta.estado === 'borrador' || consulta.estado === 'aprobada') && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
                    <Sparkles className="h-4 w-4 text-[#0F6E56]" />
                    Medicamentos Sugeridos por IA
                  </h3>
                  
                  <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-3 rounded-xl">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <span className="text-xs font-medium text-amber-800">
                      Sugerencias de IA. Validar antes de prescribir y agregar al plan.
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-xs text-left whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">Medicamento</th>
                          <th className="px-4 py-3">Dosis</th>
                          <th className="px-4 py-3">Vía</th>
                          <th className="px-4 py-3">Frecuencia</th>
                          <th className="px-4 py-3">Duración</th>
                          {consulta.estado === 'borrador' && <th className="px-4 py-3 text-center">Acción</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consulta.soap.medicamentosSugeridos.map((med, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Pill className="h-3 w-3 text-[#0F6E56]" />
                                <span className="font-bold text-slate-700">{med.nombre}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]" title={med.indicacion}>{med.indicacion}</div>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-600">{med.dosis}</td>
                            <td className="px-4 py-3 text-slate-600">{med.via}</td>
                            <td className="px-4 py-3 text-slate-600">{med.frecuencia}</td>
                            <td className="px-4 py-3 text-slate-600">{med.duracion}</td>
                            {consulta.estado === 'borrador' && (
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleAddMedToPlan(med)}
                                  className="p-1.5 bg-[#0F6E56]/10 text-[#0F6E56] hover:bg-[#0F6E56] hover:text-white rounded-lg transition-colors"
                                  title="Agregar al Plan"
                                >
                                  <FilePlus className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleConsulta;
export { DetalleConsulta };
