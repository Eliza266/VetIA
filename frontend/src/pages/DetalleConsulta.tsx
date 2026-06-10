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
  Pill
} from 'lucide-react';
import { jsPDF } from 'jspdf';

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
    
    // 1. Green header band
    pdf.setFillColor(15, 110, 86);
    pdf.rect(0, 0, pageWidth, 32, 'F');
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.text("VetIA", 14, 18);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Historia Clínica Veterinaria", 14, 26);
    
    pdf.setFontSize(9);
    pdf.text(`Exportado: ${new Date().toLocaleDateString('es-CO')}`, pageWidth - 14, 26, { align: 'right' });
    
    let y = 42;

    // Helper to check page overflow
    const checkPage = (needed: number) => {
      if (y + needed > 275) {
        pdf.addPage();
        y = 20;
      }
    };

    // 2. Veterinario section
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 110, 86);
    pdf.text("VETERINARIO", 14, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    pdf.text(`Dr(a). ${user.nombre}`, 14, y);
    y += 5;
    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(9);
    pdf.text(user.email, 14, y);
    y += 10;

    // Divider
    pdf.setDrawColor(220, 220, 220);
    pdf.line(14, y, pageWidth - 14, y);
    y += 8;

    // 3. Patient details in clean table format
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 110, 86);
    pdf.text("DATOS DEL PACIENTE", 14, y);
    y += 7;

    const patientFields = [
      ['Nombre', paciente.nombre],
      ['Especie', paciente.especie],
      ['Raza', paciente.raza || 'No reportada'],
      ['Sexo', paciente.sexo === 'macho' ? 'Macho' : 'Hembra'],
      ['Propietario', paciente.propietario.nombre],
      ['Teléfono', paciente.propietario.telefono]
    ];

    pdf.setFontSize(9);
    patientFields.forEach(([label, value]) => {
      checkPage(6);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 120, 120);
      pdf.text(`${label}:`, 14, y);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(60, 60, 60);
      pdf.text(value, 55, y);
      y += 5.5;
    });

    y += 5;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(14, y, pageWidth - 14, y);
    y += 8;

    // 4. Consultation date
    const fechaText = new Date(consulta.fechaHora).toLocaleDateString('es-CO') + ' ' + new Date(consulta.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 110, 86);
    pdf.text("CONSULTA", 14, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(`Fecha y Hora: ${fechaText}`, 14, y);
    y += 10;

    pdf.setDrawColor(220, 220, 220);
    pdf.line(14, y, pageWidth - 14, y);
    y += 8;

    // 5. SOAP sections
    const soap = consulta.soap || { subjetivo: '', objetivo: '', analisis: '', plan: '' };
    const soapSections = [
      { title: "SUBJETIVO (S)", text: soap.subjetivo },
      { title: "OBJETIVO (O)", text: soap.objetivo },
      { title: "ANÁLISIS (A)", text: soap.analisis },
      { title: "PLAN (P)", text: soap.plan }
    ];
    
    soapSections.forEach((section) => {
      checkPage(18);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(15, 110, 86);
      pdf.text(section.title, 14, y);
      y += 6;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      
      const lines = pdf.splitTextToSize(section.text || "No reportado en la consulta", pageWidth - 28);
      lines.forEach((line: string) => {
        checkPage(5);
        pdf.text(line, 14, y);
        y += 4.5;
      });
      
      y += 6;
    });

    // 6. Receta section with border box
    checkPage(25);
    pdf.setDrawColor(15, 110, 86);
    pdf.setLineWidth(0.5);
    
    const recetaY = y;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 110, 86);
    pdf.text("RECETA MÉDICA", 14, y);
    y += 7;
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    
    const planText = soap.plan || '';
    const medLines = planText.split('\n')
      .map(l => l.replace(/^[\s*\-•]+/, '').trim())
      .filter(l => l.split('|').length >= 3);
      
    if (medLines.length > 0) {
      medLines.forEach((medLine) => {
        checkPage(6);
        pdf.text(`• ${medLine}`, 16, y);
        y += 5.5;
      });
    } else {
      pdf.setFont("helvetica", "italic");
      pdf.text("No se prescribieron medicamentos en esta consulta.", 16, y);
      y += 5.5;
    }
    
    y += 3;
    // Draw the box around the recipe
    pdf.setDrawColor(15, 110, 86);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(12, recetaY - 5, pageWidth - 24, y - recetaY + 5, 3, 3, 'S');
    
    // 7. Footers on all pages
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(220, 220, 220);
      pdf.line(14, 282, pageWidth - 14, 282);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(140, 140, 140);
      pdf.text("Este documento fue generado digitalmente por VetIA", 14, 288);
      pdf.text(`${new Date().toLocaleDateString('es-CO')} — Dr(a). ${user.nombre}`, pageWidth / 2, 288, { align: 'center' });
      pdf.text(`Pág. ${i}/${pageCount}`, pageWidth - 14, 288, { align: 'right' });
    }
    
    const filename = `consulta_${paciente.nombre.toLowerCase().replace(/\s/g, '_')}_${new Date(consulta.fechaHora).toISOString().slice(0, 10)}.pdf`;
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
              Paciente: <span className="font-bold text-slate-700">{paciente.nombre}</span>
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
        {/* Left Column - Audio and Transcription */}
        <div className="space-y-6 lg:col-span-1">
          {/* Audio player card */}
          {consulta.audioUrl && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
                <FileAudio className="h-4 w-4 text-[#0F6E56]" />
                Grabación de Audio
              </h3>
              <audio src={consulta.audioUrl} controls className="w-full focus:outline-none" />
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

          {/* Consultation Metadata - no technical IDs */}
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
                  consulta.estado === 'aprobada' ? 'bg-emerald-50 text-emerald-700' 
                  : consulta.estado === 'procesando' ? 'bg-amber-50 text-amber-700'
                  : consulta.estado === 'error' ? 'bg-red-50 text-red-700'
                  : 'bg-slate-100 text-slate-600'
                }`}>
                  {consulta.estado === 'aprobada' ? 'Aprobada' : consulta.estado === 'procesando' ? 'Procesando' : consulta.estado === 'error' ? 'Error' : 'Borrador'}
                </span>
              </div>
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
              
              {/* IA Suggestions */}
              {consulta.soap?.medicamentosSugeridos && consulta.soap.medicamentosSugeridos.length > 0 && (consulta.estado === 'borrador' || consulta.estado === 'aprobada') && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
                    <Sparkles className="h-4 w-4 text-[#0F6E56]" />
                    Sugerencias de IA
                  </h3>
                  
                  <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-4 rounded-xl">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <span className="text-xs font-semibold text-amber-800">
                      Estas son sugerencias generadas por IA. El veterinario debe validar antes de prescribir.
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {consulta.soap.medicamentosSugeridos.map((med, index) => (
                      <div key={index} className="group bg-white hover:bg-slate-50/50 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 flex flex-col justify-between transition-all hover:shadow-sm">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center text-[#0F6E56] shrink-0">
                              <Pill className="h-5 w-5" />
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-base">{med.nombre}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Dosis</span>
                              <span className="text-slate-600 font-medium">{med.dosis}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Vía</span>
                              <span className="text-slate-600 font-medium">{med.via}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Frecuencia</span>
                              <span className="text-slate-600 font-medium">{med.frecuencia}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Duración</span>
                              <span className="text-slate-600 font-medium">{med.duracion}</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-xl leading-relaxed">
                            <span className="font-bold text-slate-600 block mb-0.5">Indicación:</span>
                            {med.indicacion}
                          </div>
                        </div>
                        
                        {consulta.estado === 'borrador' && (
                          <button
                            onClick={() => handleAddMedToPlan(med)}
                            className="mt-4 w-full py-2.5 bg-[#0F6E56]/10 hover:bg-[#0F6E56] text-[#0F6E56] hover:text-white rounded-xl text-xs font-bold transition-all border border-[#0F6E56]/20"
                          >
                            Agregar al Plan
                          </button>
                        )}
                      </div>
                    ))}
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
