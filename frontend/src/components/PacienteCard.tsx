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
        return { emoji: '🐶', label: 'Perro', bg: 'bg-amber-50 text-amber-800 border-amber-100', avatarBg: 'bg-amber-100 text-amber-800 ring-4 ring-amber-50' };
      case 'gato':
        return { emoji: '🐱', label: 'Gato', bg: 'bg-purple-50 text-purple-800 border-purple-100', avatarBg: 'bg-purple-100 text-purple-800 ring-4 ring-purple-50' };
      case 'ave':
        return { emoji: '🦜', label: 'Ave', bg: 'bg-sky-50 text-sky-800 border-sky-100', avatarBg: 'bg-sky-100 text-sky-800 ring-4 ring-sky-50' };
      case 'reptil':
        return { emoji: '🦎', label: 'Reptil', bg: 'bg-emerald-50 text-emerald-800 border-emerald-100', avatarBg: 'bg-emerald-100 text-emerald-800 ring-4 ring-emerald-50' };
      default:
        return { emoji: '🐾', label: 'Otro', bg: 'bg-slate-50 text-slate-800 border-slate-100', avatarBg: 'bg-slate-100 text-slate-800 ring-4 ring-slate-50' };
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

  const initial = nombre.trim().charAt(0).toUpperCase();

  return (
    <Link 
      to={`/pacientes/${id}`}
      className="group relative bg-white rounded-3xl border border-slate-150 p-6 shadow-sm hover:shadow-md hover:border-[#0F6E56]/40 transition-all duration-250 flex flex-col justify-between"
    >
      <div>
        {/* Header with Avatar and Species Badge */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`h-14 w-14 rounded-full flex items-center justify-center font-black text-xl shrink-0 ${speciesConfig.avatarBg}`}>
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-[#0F6E56] transition-colors truncate">
              {nombre}
            </h3>
            {raza ? (
              <p className="text-xs text-slate-400 font-semibold truncate">{raza}</p>
            ) : (
              <p className="text-xs text-slate-400 font-semibold">Raza no especificada</p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${speciesConfig.bg}`}>
            <span>{speciesConfig.emoji}</span>
            <span>{speciesConfig.label}</span>
          </span>
        </div>

        {/* Details grid - 2 columns */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 py-4 border-t border-b border-slate-100 text-xs text-slate-500 mb-4">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sexo</span>
            <span className="capitalize font-semibold text-slate-700">{sexo}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Edad</span>
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              {getAge(fechaNacimiento)}
            </span>
          </div>
          <div className="col-span-2">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Propietario</span>
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              {propietario.nombre}
            </span>
          </div>
          <div className="col-span-2" onClick={(e) => e.preventDefault()}>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teléfono</span>
            <a 
              href={`tel:${propietario.telefono}`}
              className="font-semibold text-[#0F6E56] hover:underline flex items-center gap-1.5"
            >
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              {propietario.telefono}
            </a>
          </div>
        </div>
      </div>

      {/* Action link */}
      <div
        className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-50 group-hover:bg-[#0F6E56]/10 text-slate-700 group-hover:text-[#0F6E56] py-2.5 text-xs font-bold transition-all"
      >
        Ver Expediente Completo
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
};

export default PacienteCard;
export { PacienteCard };
