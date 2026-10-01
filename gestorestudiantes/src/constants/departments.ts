export const DEPARTMENTS = {
  "Ciencias Económicas y Administrativas": [
    "Administración de Empresas",
    "Contaduría Pública y Finanzas",
    "Economía",
    "Mercadotecnia"
  ],
  "Ciencias de la Educación y Humanidades": [
    "Trabajo Social",
    "Psicología",
    "Informática Educativa — Perfil Docente",
    "Educación Física y Deportes — Perfil Docente",
    "Ciencias Naturales",
    "Ciencias Sociales",
    "Física-Matemática",
    "Inglés",
    "Lengua y Literatura Hispánicas",
    "Diseño Gráfico y Multimedia — Perfil No Docente"
  ],
  "Ciencia, Tecnología y Salud": [
    "Ingeniería Agroindustrial",
    "Ingeniería en Sistemas de Información",
    "Ingeniería Agronómica",
    "Enfermería",
    "Bioanálisis Clínico"
  ]
};

export type DepartmentKey = keyof typeof DEPARTMENTS;
