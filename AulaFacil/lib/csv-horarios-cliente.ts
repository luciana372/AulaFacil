// Constantes compartidas entre el parser server-only (lib/csv-horarios.ts) y la UI de importación.
export const COLUMNAS_CSV = [
  "materia",
  "profesor_email",
  "carrera",
  "aula",
  "dia",
  "horaInicio",
  "horaFin",
] as const

export const EJEMPLO_CSV = `materia,profesor_email,carrera,aula,dia,horaInicio,horaFin
Historia Argentina,jorge.paredes@aulafacil.edu,Ingeniería,Aula 102,MARTES,08:00,09:30`
