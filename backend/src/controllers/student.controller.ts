import { Request, Response } from 'express';
import { Estudiante } from '../models/student.model';
import { Profesor } from '../models/professor.model';
import { studentConnection } from '../config/studentDb';

const SEED_DATA = [
  {
    nombre: 'Franklin',
    apellido: 'Escoto',
    studentId: '2022-00452',
    faculty: 'Ciencia, Tecnología y Salud',
    carrera: 'Ingeniería en Sistemas de Información',
    correo: 'franklin.escoto@unan.edu.ni',
    telefono: '+505 8899-1122',
    semestre: 'IV Año',
    fotoUrl: '',
  },
  {
    nombre: 'Valeria',
    apellido: 'Mendoza',
    studentId: '2023-01893',
    faculty: 'Ciencia, Tecnología y Salud',
    carrera: 'Ingeniería Agroindustrial',
    correo: 'valeria.mendoza@unan.edu.ni',
    telefono: '+505 8765-4321',
    semestre: 'III Año',
    fotoUrl: '',
  },
  {
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    studentId: '2021-00214',
    faculty: 'Ciencia, Tecnología y Salud',
    carrera: 'Ingeniería en Sistemas de Información',
    correo: 'carlos.rodriguez@unan.edu.ni',
    telefono: '+505 8123-4567',
    semestre: 'V Año',
    fotoUrl: '',
  },
  {
    nombre: 'María José',
    apellido: 'López',
    studentId: '2024-03482',
    faculty: 'Ciencias Económicas y Administrativas',
    carrera: 'Administración de Empresas',
    correo: 'mariajose.lopez@unan.edu.ni',
    telefono: '+505 8989-7654',
    semestre: 'II Año',
    fotoUrl: '',
  },
  {
    nombre: 'Kevin',
    apellido: 'Gutiérrez',
    studentId: '2022-00871',
    faculty: 'Ciencia, Tecnología y Salud',
    carrera: 'Bioanálisis Clínico',
    correo: 'kevin.gutierrez@unan.edu.ni',
    telefono: '+505 8456-7890',
    semestre: 'IV Año',
    fotoUrl: '',
  },
  {
    nombre: 'Andrea',
    apellido: 'Martínez',
    studentId: '2023-02110',
    faculty: 'Ciencias de la Educación y Humanidades',
    carrera: 'Diseño Gráfico y Multimedia — Perfil No Docente',
    correo: 'andrea.martinez@unan.edu.ni',
    telefono: '+505 8654-3210',
    semestre: 'III Año',
    fotoUrl: '',
  },
];

const FIRST_NAMES = [
  'Carlos', 'María', 'José', 'Ana', 'Luis', 'Sofia', 'Diego', 'Valeria', 'Fernando', 'Camila',
  'Javier', 'Andrea', 'Gabriel', 'Daniela', 'Mateo', 'Lucia', 'Alejandro', 'Isabella', 'Ricardo', 'Elena',
  'Manuel', 'Paula', 'Andrés', 'Natalia', 'Sebastián', 'Mariana', 'Roberto', 'Adriana', 'Kevin', 'Fernanda',
  'David', 'Claudia', 'Felipe', 'Gabriela', 'Eduardo', 'Patricia', 'Héctor', 'Vanessa', 'Jorge', 'Diana',
  'Alonso', 'Paola', 'Cristian', 'Beatriz', 'Oscar', 'Karla', 'Sergio', 'Mónica', 'Iván', 'Lorena',
  'Franklin', 'Giselle', 'Marlon', 'Rocío', 'Brayan', 'Yolanda', 'Emilio', 'Clarisa', 'Nestor', 'Fatima'
];

const LAST_NAMES = [
  'González', 'Rodríguez', 'López', 'Martínez', 'Pérez', 'Gómez', 'Sánchez', 'Díaz', 'Hernández', 'Álvarez',
  'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez',
  'Serrano', 'Blanco', 'Molina', 'Morales', 'Suárez', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio',
  'Marín', 'Sanz', 'Núñez', 'Iglesias', 'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano',
  'Guerrero', 'Cano', 'Prieto', 'Méndez', 'Cruz', 'Calvo', 'Gallego', 'Vidal', 'León', 'Herrera',
  'Escoto', 'Mendoza', 'Mayorga', 'Centeno', 'Baltodano', 'Téllez', 'Altamirano', 'Jarquín', 'Chavarría', 'Rizo'
];

const FACULTIES_AND_CAREERS = [
  {
    faculty: 'Ciencia, Tecnología y Salud',
    careers: [
      'Ingeniería en Sistemas de Información',
      'Ingeniería Agroindustrial',
      'Bioanálisis Clínico',
      'Medicina General',
      'Enfermería',
      'Farmacia',
      'Optometría Médica',
    ],
  },
  {
    faculty: 'Ciencias Económicas y Administrativas',
    careers: [
      'Administración de Empresas',
      'Contaduría Pública y Finanzas',
      'Economía',
      'Mercadotecnia',
      'Banca y Finanzas',
      'Turismo Sostenible',
    ],
  },
  {
    faculty: 'Ciencias de la Educación y Humanidades',
    careers: [
      'Diseño Gráfico y Multimedia — Perfil No Docente',
      'Pedagogía con Mención en Educación Infantil',
      'Lengua y Literatura Hispánicas',
      'Inglés',
      'Psicología',
      'Trabajo Social',
    ],
  },
];

const SEMESTRES = ['I Año', 'II Año', 'III Año', 'IV Año', 'V Año'];

function cleanStringForEmail(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export const studentController = {
  registerDocente: async (req: Request, res: Response) => {
    try {
      const { nombre, usuario, password } = req.body;

      if (!nombre || !usuario || !password) {
        return res.status(400).json({
          success: false,
          error: 'Nombre, usuario/correo y contraseña son obligatorios',
        });
      }

      const usuarioClean = usuario.trim().toLowerCase();
      const existing = await Profesor.findOne({ usuario: usuarioClean });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Ya existe una cuenta docente con este usuario o correo',
        });
      }

      const profesor = await Profesor.create({
        nombre: nombre.trim(),
        usuario: usuarioClean,
        password: password.trim(),
        rol: 'Docente / Administrador',
      });

      return res.status(201).json({
        success: true,
        mensaje: 'Cuenta docente creada exitosamente',
        usuario: {
          id: profesor._id,
          nombre: profesor.nombre,
          usuario: profesor.usuario,
          rol: profesor.rol,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { usuario, password } = req.body;

      if (!usuario || !password) {
        return res.status(400).json({
          success: false,
          error: 'Debe ingresar usuario y contraseña',
        });
      }

      const userLower = usuario.trim().toLowerCase();

      const profesor = await Profesor.findOne({ usuario: userLower }).select('+password');
      if (profesor) {
        const isMatch = await profesor.matchPassword(password);
        if (isMatch) {
          return res.json({
            success: true,
            mensaje: 'Inicio de sesión exitoso',
            token: `token-profesor-${profesor._id}`,
            usuario: {
              id: profesor._id,
              nombre: profesor.nombre,
              usuario: profesor.usuario,
              rol: profesor.rol,
            },
          });
        }
      }

      if ((userLower === 'admin' || userLower === 'docente') && password === 'admin123') {
        return res.json({
          success: true,
          mensaje: 'Inicio de sesión exitoso',
          token: 'token-gestor-admin-demo',
          usuario: {
            id: 'admin-default',
            nombre: 'Docente Supervisor',
            usuario: 'admin',
            rol: 'Profesor / Administrador',
          },
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas. Verifica tu usuario y contraseña.',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  uploadPhoto: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se recibió ninguna imagen',
        });
      }

      const photoUrl = `/uploads/${req.file.filename}`;
      return res.json({
        success: true,
        mensaje: 'Fotografía subida exitosamente',
        url: photoUrl,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  getEstudiantes: async (req: Request, res: Response) => {
    try {
      const { q, faculty, career } = req.query;
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
      const skip = (page - 1) * limit;

      let filter: any = {};

      if (q && typeof q === 'string' && q.trim().length > 0) {
        const regex = new RegExp(q.trim(), 'i');
        filter.$or = [
          { nombre: regex },
          { apellido: regex },
          { studentId: regex },
          { carrera: regex },
          { correo: regex },
          { telefono: regex },
        ];
      }

      if (faculty && typeof faculty === 'string' && faculty !== 'Todas') {
        filter.faculty = faculty.trim();
      }

      if (career && typeof career === 'string' && career !== 'Todas') {
        filter.carrera = career.trim();
      }

      const [total, docs] = await Promise.all([
        Estudiante.countDocuments(filter),
        Estudiante.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const estudiantes = docs.map((doc: any) => ({
        ...doc,
        id: doc._id.toString(),
      }));

      const totalPages = Math.ceil(total / limit);

      return res.json({
        success: true,
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
        data: estudiantes,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  getStats: async (_req: Request, res: Response) => {
    try {
      const total = await Estudiante.countDocuments({});
      return res.json({
        success: true,
        totalStudents: total,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  getEstudianteById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const estudiante = await Estudiante.findById(id);

      if (!estudiante) {
        return res.status(404).json({
          success: false,
          error: 'Estudiante no encontrado',
        });
      }

      return res.json({
        success: true,
        data: estudiante,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  createEstudiante: async (req: Request, res: Response) => {
    try {
      const { nombre, apellido, studentId, faculty, carrera, correo, telefono, fotoUrl, semestre } = req.body;

      if (!nombre || !carrera || !correo || !telefono) {
        return res.status(400).json({
          success: false,
          error: 'Nombre, carrera, correo y teléfono son obligatorios',
        });
      }

      const correoClean = correo.trim().toLowerCase();
      const existente = await Estudiante.findOne({ correo: correoClean });
      if (existente) {
        return res.status(409).json({
          success: false,
          error: 'Ya existe un estudiante registrado con este correo institucional',
        });
      }

      const nuevoEstudiante = await Estudiante.create({
        nombre: nombre.trim(),
        apellido: apellido?.trim() || '',
        studentId: studentId?.trim() || '',
        faculty: faculty?.trim() || 'Ciencia, Tecnología y Salud',
        carrera: carrera.trim(),
        correo: correoClean,
        telefono: telefono.trim(),
        fotoUrl: fotoUrl?.trim() || '',
        semestre: semestre?.trim() || 'I Semestre',
      });

      return res.status(201).json({
        success: true,
        mensaje: 'Estudiante registrado correctamente en la base de datos',
        data: nuevoEstudiante,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  updateEstudiante: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { nombre, apellido, studentId, faculty, carrera, correo, telefono, fotoUrl, semestre } = req.body;

      const estudiante = await Estudiante.findById(id);
      if (!estudiante) {
        return res.status(404).json({
          success: false,
          error: 'Estudiante no encontrado',
        });
      }

      if (correo && correo.trim().toLowerCase() !== estudiante.correo) {
        const duplicado = await Estudiante.findOne({
          correo: correo.trim().toLowerCase(),
          _id: { $ne: id },
        });
        if (duplicado) {
          return res.status(409).json({
            success: false,
            error: 'El correo electrónico ya está registrado por otro estudiante',
          });
        }
        estudiante.correo = correo.trim().toLowerCase();
      }

      if (nombre) estudiante.nombre = nombre.trim();
      if (apellido !== undefined) estudiante.apellido = apellido.trim();
      if (studentId !== undefined) estudiante.studentId = studentId.trim();
      if (faculty !== undefined) estudiante.faculty = faculty.trim();
      if (carrera) estudiante.carrera = carrera.trim();
      if (telefono) estudiante.telefono = telefono.trim();
      if (fotoUrl !== undefined) estudiante.fotoUrl = fotoUrl.trim();
      if (semestre) estudiante.semestre = semestre.trim();

      await estudiante.save();

      return res.json({
        success: true,
        mensaje: 'Información del estudiante actualizada con éxito',
        data: estudiante,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  deleteEstudiante: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const estudiante = await Estudiante.findByIdAndDelete(id);

      if (!estudiante) {
        return res.status(404).json({
          success: false,
          error: 'Estudiante no encontrado',
        });
      }

      return res.json({
        success: true,
        mensaje: 'Estudiante eliminado satisfactoriamente de la base de datos',
        data: estudiante,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  seedEstudiantes: async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      const requestedCount = Math.min(Math.max(Number(req.body.count) || 6, 1), 10000);
      const clearExisting = req.body.clearExisting !== false;

      if (studentConnection.readyState !== 1) {
        await new Promise((resolve, reject) => {
          if (studentConnection.readyState === 1) return resolve(true);
          const t = setTimeout(() => reject(new Error('No se pudo conectar a la base de datos gestor_estudiantes')), 12000);
          studentConnection.once('connected', () => {
            clearTimeout(t);
            resolve(true);
          });
        });
      }

      if (clearExisting) {
        await Estudiante.deleteMany({});
      }

      const studentsToInsert: any[] = [];
      const baseYear = 2024;
      const timestampSalt = Date.now().toString(36);

      for (let i = 0; i < requestedCount; i++) {
        if (i < SEED_DATA.length && clearExisting) {
          studentsToInsert.push(SEED_DATA[i]);
          continue;
        }

        const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
        const facultyGroup = FACULTIES_AND_CAREERS[i % FACULTIES_AND_CAREERS.length];
        const career = facultyGroup.careers[Math.floor(i / 3) % facultyGroup.careers.length];
        const semester = SEMESTRES[i % SEMESTRES.length];

        const padId = String(i + 1).padStart(5, '0');
        const studentId = `${baseYear}-${padId}`;
        const emailUser = `${cleanStringForEmail(firstName)}.${cleanStringForEmail(lastName)}.${timestampSalt}${i + 1}`;
        const correo = `${emailUser}@unan.edu.ni`;
        const phoneSuffix = String(10000000 + ((i * 739) % 89999999)).slice(0, 8);
        const telefono = `+505 ${phoneSuffix.slice(0, 4)}-${phoneSuffix.slice(4)}`;

        studentsToInsert.push({
          nombre: firstName,
          apellido: lastName,
          studentId,
          faculty: facultyGroup.faculty,
          carrera: career,
          correo,
          telefono,
          semestre: semester,
          fotoUrl: '',
        });
      }

      const CHUNK_SIZE = 1000;
      for (let i = 0; i < studentsToInsert.length; i += CHUNK_SIZE) {
        const chunk = studentsToInsert.slice(i, i + CHUNK_SIZE);
        await Estudiante.insertMany(chunk, { ordered: false });
      }

      const totalInDb = await Estudiante.countDocuments({});
      const durationMs = Date.now() - startTime;

      return res.json({
        success: true,
        mensaje: `Se insertaron ${studentsToInsert.length.toLocaleString()} estudiantes en MongoDB`,
        data: {
          inserted: studentsToInsert.length,
          total: totalInDb,
          timeMs: durationMs,
        },
        inserted: studentsToInsert.length,
        total: totalInDb,
        timeMs: durationMs,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
