import { Link } from 'react-router-dom';
import type { Paciente } from '../types';
import { Phone, User, Calendar, ArrowRight } from 'lucide-react';

interface PacienteCardProps {
  paciente: Paciente;
}

const PacienteCard: React.FC<PacienteCardProps> = ({ paciente }) => {
  const { id, nombre, especie, raza, sexo, propietario, fechaNacimiento } = paciente;

  // Compute species styling and emoji/icon
  const getSpeciesConfig = (esp: typeof especie) => {
    switch (esp) {
      case 'perro':
        return { emoji: '🐶', label: 'Perro', bg: 'bg-amber-50 text-amber-800 border-amber-100' };
      case 'gato':
        return { emoji: '🐱', label: 'Gato', bg: 'bg-purple-50 text-purple-800 border-purple-100' };
      case 'ave':
        return { emoji: '🦜', label: 'Ave', bg: 'bg-sky-50 text-sky-800 border-sky-100' };
      case 'reptil':
        return { emoji: '🦎', label: 'Reptil', bg: 'bg-emerald-50 text-emerald-800 border-emerald-100' };
      default:
        return { emoji: '🐾', label: 'Otro', bg: 'bg-slate-50 text-slate-800 border-slate-100' };
    }
  };

  const speciesConfig = getSpeciesConfig(especie);

  // Calculate approximate age
  const getAge = (birthDateString?: string) => {
    if (!birthDateString) return 'Edad desconocida';
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

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header: Name and Species Badge */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-lg group-hover:text-[#0F6E56] transition-colors">
              {nombre}
            </h3>
            {raza && <p className="text-xs text-slate-400 font-medium">{raza}</p>}
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${speciesConfig.bg}`}>
            <span>{speciesConfig.emoji}</span>
            <span>{speciesConfig.label}</span>
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 py-3 border-y border-slate-50 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-400">Sexo:</span>
            <span className="capitalize font-medium text-slate-700">{sexo}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{getAge(fechaNacimiento)}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 mt-0.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-400">Propietario:</span>
            <span className="font-medium text-slate-700 truncate max-w-[140px]">{propietario.nombre}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <a 
              href={`tel:${propietario.telefono}`}
              className="font-medium text-slate-700 hover:text-[#0F6E56] hover:underline"
            >
              {propietario.telefono}
            </a>
          </div>
        </div>
      </div>

      {/* Action link */}
      <Link
        to={`/pacientes/${id}`}
        className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-50 hover:bg-[#0F6E56]/10 text-slate-700 hover:text-[#0F6E56] py-2.5 text-xs font-bold transition-all"
      >
        Ver Expediente
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
};

export default PacienteCard;
export { PacienteCard };
