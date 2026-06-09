import React, { useState } from 'react';
import type { SOAP } from '../types';
import { Edit2, Save, X, BookOpen, Activity, FileSearch, Calendar } from 'lucide-react';

interface SoapViewerProps {
  soap?: SOAP;
  onSave?: (updatedSoap: SOAP) => Promise<void>;
}

const SoapViewer: React.FC<SoapViewerProps> = ({ soap, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editSoap, setEditSoap] = useState<SOAP>({
    subjetivo: soap?.subjetivo || '',
    objetivo: soap?.objetivo || '',
    analisis: soap?.analisis || '',
    plan: soap?.plan || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if prop changes
  React.useEffect(() => {
    if (soap) {
      setEditSoap({
        subjetivo: soap.subjetivo || '',
        objetivo: soap.objetivo || '',
        analisis: soap.analisis || '',
        plan: soap.plan || '',
      });
    }
  }, [soap]);

  if (!soap && !isEditing) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-slate-500 text-sm">No hay notas SOAP generadas para esta consulta.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditSoap((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(editSoap);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving SOAP:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (soap) {
      setEditSoap({
        subjetivo: soap.subjetivo || '',
        objetivo: soap.objetivo || '',
        analisis: soap.analisis || '',
        plan: soap.plan || '',
      });
    }
    setIsEditing(false);
  };

  const soapSections = [
    {
      key: 'subjetivo' as keyof SOAP,
      title: 'Subjetivo (S)',
      subtitle: 'Motivo de consulta, síntomas y anamnesis',
      icon: <BookOpen className="h-5 w-5 text-teal-600" />,
      bgColor: 'bg-teal-50/50',
      borderColor: 'border-teal-100',
    },
    {
      key: 'objetivo' as keyof SOAP,
      title: 'Objetivo (O)',
      subtitle: 'Examen físico, constantes vitales y peso',
      icon: <Activity className="h-5 w-5 text-indigo-600" />,
      bgColor: 'bg-indigo-50/50',
      borderColor: 'border-indigo-100',
    },
    {
      key: 'analisis' as keyof SOAP,
      title: 'Análisis (A)',
      subtitle: 'Diagnósticos presuntivos y diferenciales',
      icon: <FileSearch className="h-5 w-5 text-amber-600" />,
      bgColor: 'bg-amber-50/50',
      borderColor: 'border-amber-100',
    },
    {
      key: 'plan' as keyof SOAP,
      title: 'Plan (P)',
      subtitle: 'Tratamiento, recetas, pruebas y control',
      icon: <Calendar className="h-5 w-5 text-sky-600" />,
      bgColor: 'bg-sky-50/50',
      borderColor: 'border-sky-100',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/40 px-6 py-4">
        <div>
          <h3 className="font-bold text-slate-800">Nota Médica SOAP</h3>
          <p className="text-xs text-slate-500">Estructura clínica generada automáticamente por IA</p>
        </div>
        {onSave && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0c5945] transition-colors disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#0F6E56]/20 bg-[#0F6E56]/5 px-3 py-1.5 text-xs font-semibold text-[#0F6E56] hover:bg-[#0F6E56]/10 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Editar Nota
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {soapSections.map((sec) => (
          <div
            key={sec.key}
            className={`flex flex-col rounded-xl border p-4 transition-all ${sec.bgColor} ${sec.borderColor}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100">
                {sec.icon}
              </span>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{sec.title}</h4>
                <p className="text-[10px] text-slate-400 font-medium">{sec.subtitle}</p>
              </div>
            </div>
            
            {isEditing ? (
              <textarea
                name={sec.key}
                value={editSoap[sec.key]}
                onChange={handleChange}
                rows={5}
                className="w-full mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] outline-none transition-shadow resize-none"
                placeholder={`Detalles para el apartado ${sec.title}...`}
              />
            ) : (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-white/60 p-3 rounded-lg border border-white/80 flex-1">
                {editSoap[sec.key] || <span className="italic text-slate-400">Sin registrar</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoapViewer;
export { SoapViewer };
