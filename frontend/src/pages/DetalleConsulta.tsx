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
  Sparkles
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
    
    const doc = new jsPDF();
    
    // 1. Header (Green background header #0F6E56)
    doc.setFillColor(15, 110, 86);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("VetIA - Historia Clínica", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const exportDate = new Date().toLocaleDateString();
    doc.text(`Fecha de Exportación: ${exportDate}`, 150, 20);
    
    // 2. Veterinarian Details
    let currentY = 42;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 110, 86);
    doc.text("DATOS DEL VETERINARIO", 14, currentY);
    
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Nombre: ${user.nombre}`, 14, currentY);
    doc.text(`Email: ${user.email}`, 120, currentY);
    
    currentY += 10;
    
    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, currentY - 2, 196, currentY - 2);
    
    // 3. Patient Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 110, 86);
    doc.text("DATOS DEL PACIENTE", 14, currentY);
    
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Nombre: ${paciente.nombre}`, 14, currentY);
    doc.text(`Especie: ${paciente.especie}`, 70, currentY);
    doc.text(`Raza: ${paciente.raza || 'No reportada'}`, 120, currentY);
    doc.text(`Sexo: ${paciente.sexo === 'macho' ? 'Macho' : 'Hembra'}`, 170, currentY);
    
    currentY += 6;
    doc.text(`Propietario: ${paciente.propietario.nombre}`, 14, currentY);
    doc.text(`Teléfono: ${paciente.propietario.telefono}`, 120, currentY);
    
    currentY += 10;
    
    // Divider line
    doc.line(14, currentY - 2, 196, currentY - 2);
    
    // 4. Consultation Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 110, 86);
    doc.text("DETALLES DE LA CONSULTA", 14, currentY);
    
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const fechaText = new Date(consulta.fechaHora).toLocaleDateString() + ' ' + new Date(consulta.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    doc.text(`Fecha y Hora: ${fechaText}`, 14, currentY);
    doc.text(`ID Registro: ${consulta.id}`, 120, currentY);
    
    currentY += 10;
    
    // Divider line
    doc.line(14, currentY - 2, 196, currentY - 2);
    
    // 5. SOAP sections
    const soap = consulta.soap || { subjetivo: '', objetivo: '', analisis: '', plan: '' };
    const sections = [
      { title: "SUBJETIVO (S)", text: soap.subjetivo },
      { title: "OBJETIVO (O)", text: soap.objetivo },
      { title: "ANÁLISIS (A)", text: soap.analisis },
      { title: "PLAN (P)", text: soap.plan }
    ];
    
    sections.forEach((section) => {
      if (currentY > 260) {
        doc.addPage();
        currentY = 25;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 110, 86);
      doc.text(section.title, 14, currentY);
      
      currentY += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const lines = doc.splitTextToSize(section.text || "No reportado en la consulta", 182);
      lines.forEach((line: string) => {
        if (currentY > 280) {
          doc.addPage();
          currentY = 25;
        }
        doc.text(line, 14, currentY);
        currentY += 5;
      });
      
      currentY += 5;
    });
    
    currentY += 5;
    
    // Divider line
    if (currentY > 260) {
      doc.addPage();
      currentY = 25;
    }
    doc.line(14, currentY - 2, 196, currentY - 2);
    
    // 6. Receta Médica Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 110, 86);
    doc.text("RECETA MÉDICA", 14, currentY);
    
    currentY += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const planText = soap.plan || '';
    const medLines = planText.split('\n')
      .map(l => l.replace(/^[\s*\-•]+/, '').trim())
      .filter(l => l.split('|').length >= 3); // Must have at least name, dose, via, freq...
      
    if (medLines.length > 0) {
      medLines.forEach((medLine) => {
        if (currentY > 280) {
          doc.addPage();
          currentY = 25;
        }
        doc.text(`• ${medLine}`, 14, currentY);
        currentY += 6;
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.text("No se prescribieron medicamentos en esta consulta.", 14, currentY);
      currentY += 6;
    }
    
    // 7. Page footers for all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 282, 196, 282);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Documento generado por VetIA • Vet. ${user.nombre}`, 14, 288);
      doc.text(`Página ${i} de ${pageCount}`, 180, 288);
    }
    
    // Save the PDF
    const filename = `consulta_${paciente.nombre.toLowerCase()}_${new Date(consulta.fechaHora).toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
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
              Paciente: <span className="font-bold text-slate-700">{paciente.nombre}</span> • Expediente #{paciente.id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          {consulta.estado === 'borrador' && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2.5 text-sm font-bold text-red-600 transition-all disabled:opacity-50"
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
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0c5945] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0F6E56]/15 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
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

        {/* Right Column - SOAP note (SoapViewer) & Suggestions */}
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
            <>
              <SoapViewer soap={consulta.soap} onSave={consulta.estado === 'borrador' ? handleSaveSoap : undefined} />
              
              {/* Sugerencias de IA section */}
              {consulta.soap?.medicamentosSugeridos && consulta.soap.medicamentosSugeridos.length > 0 && (consulta.estado === 'borrador' || consulta.estado === 'aprobada') && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 mt-6">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
                    <Sparkles className="h-4.5 w-4.5 text-[#0F6E56]" />
                    Sugerencias de IA
                  </h3>
                  
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-xs font-semibold">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />
                    <span>Estas son sugerencias generadas por IA. El veterinario debe validar antes de prescribir.</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {consulta.soap.medicamentosSugeridos.map((med, index) => (
                      <div key={index} className="bg-slate-50/50 hover:bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-base mb-2">{med.nombre}</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                            <div><span className="font-semibold text-slate-600">Dosis:</span> {med.dosis}</div>
                            <div><span className="font-semibold text-slate-600">Vía:</span> {med.via}</div>
                            <div><span className="font-semibold text-slate-600">Frecuencia:</span> {med.frecuencia}</div>
                            <div><span className="font-semibold text-slate-600">Duración:</span> {med.duracion}</div>
                          </div>
                          <div className="text-xs text-slate-600 bg-white border border-slate-100 p-2.5 rounded-lg italic">
                            <span className="font-semibold text-slate-700 not-italic block mb-0.5">Indicación:</span>
                            {med.indicacion}
                          </div>
                        </div>
                        
                        {consulta.estado === 'borrador' && (
                          <button
                            onClick={() => handleAddMedToPlan(med)}
                            className="mt-4 w-full py-2 bg-[#0F6E56]/10 hover:bg-[#0F6E56] text-[#0F6E56] hover:text-white rounded-xl text-xs font-bold transition-all border border-[#0F6E56]/20"
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
