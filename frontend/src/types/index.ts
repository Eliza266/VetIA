// ─── VETERINARIO ───────────────────────────────────────────
export interface Veterinario {
  uid: string;
  nombre: string;
  email: string;
  foto?: string;
  telefono?: string;
  whatsapp?: string;
  ciudad?: string;
  sede?: string;
  veterinaria?: string;
  matriculaProfesional?: string;
  creadoEn: Date;
}

// ─── PROPIETARIO ───────────────────────────────────────────
export interface Propietario {
  nombre: string;
  telefono: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  documentoTipo?: string;
  documentoNumero?: string;
}

// ─── PACIENTE ──────────────────────────────────────────────
export interface Paciente {
  id?: string;
  nombre: string;
  especie: 'perro' | 'gato' | 'ave' | 'reptil' | 'otro';
  raza?: string;
  fechaNacimiento?: string;
  sexo: 'macho' | 'hembra';
  estadoReproductivo: 'entero' | 'castrado' | 'esterilizado';
  color?: string;
  chip?: string;
  foto?: string;
  origen?: string;
  notasGenerales?: string;
  ultimoPeso?: number;
  ultimaTalla?: number;
  veterinarioId: string;
  entidadId?: string;
  propietario: Propietario;
  creadoEn: Date;
}

// ─── SIGNOS VITALES ────────────────────────────────────────
export interface SignosVitales {
  peso?: number;
  temperatura?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  condicionCorporal?: 1 | 2 | 3 | 4 | 5;
  mucosas?: string;
  deshidratacion?: string;
  pulso?: string;
}

// ─── MEDICAMENTO SUGERIDO ──────────────────────────────────
export interface MedicamentoSugerido {
  nombre: string;
  dosis: string;
  via: string;
  frecuencia: string;
  duracion: string;
  indicacion: string;
}

// ─── SOAP ──────────────────────────────────────────────────
export interface SOAP {
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
  medicamentosSugeridos?: MedicamentoSugerido[];
}

// ─── CONSULTA ──────────────────────────────────────────────
export interface Consulta {
  id?: string;
  numeroHC?: string;
  pacienteId: string;
  veterinarioId: string;
  brigadaId?: string;
  citaId?: string;
  fechaHora: Date;
  motivo?: string;
  prioridad?: 'urgente' | 'rutina' | 'seguimiento' | 'brigada';
  signosVitales?: SignosVitales;
  audioUrl?: string;
  transcripcion?: string;
  soap?: SOAP;
  estado: 'procesando' | 'borrador' | 'aprobada' | 'error';
  ubicacion?: {
    direccion?: string;
    lat?: number;
    lng?: number;
  };
  creadoEn: Date;
}

// ─── CITA ──────────────────────────────────────────────────
export interface Cita {
  id?: string;
  pacienteId: string;
  nombrePaciente: string;
  veterinarioId: string;
  fecha: string;
  horaInicio: string;
  duracion: number;
  motivo: string;
  estado: 'programada' | 'realizada' | 'cancelada' | 'no_asistio';
  consultaId?: string;
  creadoEn: Date;
}

// ─── BRIGADA ───────────────────────────────────────────────
export interface Brigada {
  id?: string;
  nombre: string;
  fecha: string;
  ubicacion: {
    direccion: string;
    ciudad: string;
    lat?: number;
    lng?: number;
  };
  veterinarioIds: string[];
  entidadId?: string;
  estado: 'planificada' | 'en_curso' | 'finalizada';
  totalConsultas?: number;
  creadoEn: Date;
}

// ─── CONTADOR HC ───────────────────────────────────────────
export interface ContadorHC {
  ultimo: number;
}
