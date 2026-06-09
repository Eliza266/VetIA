import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePacientes } from '../hooks/usePacientes';
import PacienteCard from '../components/PacienteCard';
import { Search, Plus, Filter, AlertCircle } from 'lucide-react';

const Pacientes: React.FC = () => {
  const { pacientes, loading, error } = usePacientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEspecie, setSelectedEspecie] = useState<string>('todos');

  // Species filter options
  const especies = [
    { value: 'todos', label: 'Todos', emoji: '🐾' },
    { value: 'perro', label: 'Perros', emoji: '🐶' },
    { value: 'gato', label: 'Gatos', emoji: '🐱' },
    { value: 'ave', label: 'Aves', emoji: '🦜' },
    { value: 'reptil', label: 'Reptiles', emoji: '🦎' },
    { value: 'otro', label: 'Otros', emoji: '🦄' },
  ];

  // Filtering logic
  const filteredPacientes = pacientes.filter((paciente) => {
    const matchesSearch = 
      paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paciente.propietario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paciente.raza && paciente.raza.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesEspecie = selectedEspecie === 'todos' || paciente.especie === selectedEspecie;

    return matchesSearch && matchesEspecie;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Pacientes
          </h1>
          <p className="text-sm text-slate-500">
            Gestiona los expedientes clínicos de todas las mascotas registradas.
          </p>
        </div>
        
        <Link
          to="/pacientes/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0c5945] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0F6E56]/15 transition-all hover:scale-[1.01]"
        >
          <Plus className="h-4 w-4" />
          Nuevo Paciente
        </Link>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filter Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de mascota, propietario o raza..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] focus:bg-white outline-none transition-all"
          />
        </div>

        {/* Species selector tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {especies.map((esp) => (
            <button
              key={esp.value}
              onClick={() => setSelectedEspecie(esp.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                selectedEspecie === esp.value
                  ? 'bg-[#0F6E56] text-white border-[#0F6E56] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{esp.emoji}</span>
              <span>{esp.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Results Grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F6E56] border-t-transparent"></div>
            <p className="text-xs text-slate-400 font-medium animate-pulse">Buscando expedientes...</p>
          </div>
        </div>
      ) : filteredPacientes.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No se encontraron pacientes</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {searchTerm || selectedEspecie !== 'todos'
              ? 'Intenta cambiar los términos de búsqueda o filtros aplicados.'
              : 'Empieza registrando tu primer paciente para ver su ficha clínica.'}
          </p>
          {!searchTerm && selectedEspecie === 'todos' && (
            <Link
              to="/pacientes/nuevo"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F6E56] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0c5945] transition-colors shadow-md shadow-[#0F6E56]/15"
            >
              <Plus className="h-4 w-4" />
              Crear Ficha Médica
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPacientes.map((paciente) => (
            <PacienteCard key={paciente.id} paciente={paciente} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Pacientes;
export { Pacientes };
