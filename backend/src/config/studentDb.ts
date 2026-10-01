import 'dotenv/config';
import mongoose, { Connection } from 'mongoose';

const fallbackUri = process.env.MONGO_URI
  ? process.env.MONGO_URI.replace('/ecounan?', '/gestor_estudiantes?')
  : 'mongodb://localhost:27017/gestor_estudiantes';

const studentUri = process.env.STUDENT_MONGO_URI || fallbackUri;

export const studentConnection: Connection = mongoose.createConnection(studentUri, {
  maxPoolSize: 20,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 15000,
});

studentConnection.on('connected', () => {
  console.log(`[DB GestorEstudiantes] Conexión establecida a la base de datos independiente: gestor_estudiantes`);
});

studentConnection.on('error', (err) => {
  console.error(`[DB GestorEstudiantes Error] Error en conexión a gestor_estudiantes:`, err.message);
});
