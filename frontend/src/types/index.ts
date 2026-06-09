export interface Veterinario {
  uid: string;
  nombre: string;
  email: string;
  foto?: string;
  creadoEn: Date;
}

export interface Propietario {
  nombre: string;
  telefono: string;
  email?: string;
}

export interface Paciente {
  id?: string;
  nombre: string;
  especie: 'perro' | 'gato' | 'ave' | 'reptil' | 'otro';
  raza?: string;
  fechaNacimiento?: string;
  sexo: 'macho' | 'hembra';
  estadoReproductivo: 'entero' | 'castrado' | 'esterilizado';
  propietario: Propietario;
  notasGenerales?: string;
  veterinarioId: string;
  creadoEn: Date;
}

export interface SOAP {
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
}

export interface Consulta {
  id?: string;
  pacienteId: string;
  veterinarioId: string;
  fechaHora: Date;
  audioUrl?: string;
  transcripcion?: string;
  soap?: SOAP;
  estado: 'procesando' | 'borrador' | 'aprobada' | 'error';
  creadoEn: Date;
}
