import 'dotenv/config';
import { studentConnection } from './config/studentDb';
import { Estudiante } from './models/student.model';

const SEED_DATA = [
  {
    nombre: 'Franklin',
    apellido: 'Escoto',
    carrera: 'Ingeniería en Sistemas de Información',
    correo: 'franklin.escoto@unan.edu.ni',
    telefono: '+505 8899-1122',
    semestre: 'IV Año',
    fotoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Valeria',
    apellido: 'Mendoza',
    carrera: 'Ingeniería Ambiental',
    correo: 'valeria.mendoza@unan.edu.ni',
    telefono: '+505 8765-4321',
    semestre: 'III Año',
    fotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    carrera: 'Ingeniería en Computación',
    correo: 'carlos.rodriguez@unan.edu.ni',
    telefono: '+505 8123-4567',
    semestre: 'V Año',
    fotoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'María José',
    apellido: 'López',
    carrera: 'Administración de Empresas',
    correo: 'mariajose.lopez@unan.edu.ni',
    telefono: '+505 8989-7654',
    semestre: 'II Año',
    fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Kevin',
    apellido: 'Gutiérrez',
    carrera: 'Ingeniería Electrónica',
    correo: 'kevin.gutierrez@unan.edu.ni',
    telefono: '+505 8456-7890',
    semestre: 'IV Año',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Andrea',
    apellido: 'Martínez',
    carrera: 'Diseño Gráfico',
    correo: 'andrea.martinez@unan.edu.ni',
    telefono: '+505 8654-3210',
    semestre: 'III Año',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
];

async function seed() {
  try {
    console.log('Esperando conexión con gestor_estudiantes...');
    await new Promise((resolve) => {
      if (studentConnection.readyState === 1) resolve(true);
      else studentConnection.once('connected', () => resolve(true));
    });

    console.log('Limpiando colección anterior de estudiantes en gestor_estudiantes...');
    await Estudiante.deleteMany({});

    console.log('Insertando estudiantes de demostración...');
    const result = await Estudiante.insertMany(SEED_DATA);
    console.log(`¡Éxito! Se insertaron ${result.length} estudiantes en la base de datos gestor_estudiantes.`);
    process.exit(0);
  } catch (error) {
    console.error('Error al poblar la base de datos:', error);
    process.exit(1);
  }
}

seed();
