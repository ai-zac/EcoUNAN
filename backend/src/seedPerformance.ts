import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(__dirname, '../.env') });

import User, { IUser } from './models/user.model';
import Recycle from './models/recycle.model';
import Reward from './models/reward.model';
import Redemption from './models/redemption.model';
import Goal from './models/goal.model';
import GoalClaim from './models/goalClaim.model';
import Notification from './models/notification.model';

const FACULTIES_DATA = [
  {
    faculty: 'Ciencias e Ingeniería',
    careers: ['Ingeniería en Sistemas', 'Ingeniería Industrial', 'Ingeniería Civil', 'Ingeniería Electrónica', 'Arquitectura']
  },
  {
    faculty: 'Ciencias Médicas',
    careers: ['Medicina General', 'Enfermería', 'Odontología', 'Optometría Médica']
  },
  {
    faculty: 'Ciencias Económicas y Administrativas',
    careers: ['Administración de Empresas', 'Contaduría Pública y Finanzas', 'Economía', 'Mercadotecnia']
  },
  {
    faculty: 'Humanidades y Ciencias Jurídicas',
    careers: ['Derecho', 'Ciencias Políticas', 'Comunicación para el Desarrollo', 'Psicología']
  },
  {
    faculty: 'Ciencias de la Educación e Idiomas',
    careers: ['Lengua y Literatura Hispánicas', 'Inglés', 'Pedagogía', 'Informática Educativa']
  }
];

const FIRST_NAMES = [
  'Carlos', 'María', 'José', 'Ana', 'Luis', 'Sofia', 'Diego', 'Valeria', 'Fernando', 'Camila',
  'Javier', 'Andrea', 'Gabriel', 'Daniela', 'Mateo', 'Lucia', 'Alejandro', 'Isabella', 'Ricardo', 'Elena',
  'Manuel', 'Paula', 'Andrés', 'Natalia', 'Sebastián', 'Mariana', 'Roberto', 'Adriana', 'Kevin', 'Fernanda',
  'David', 'Claudia', 'Felipe', 'Gabriela', 'Eduardo', 'Patricia', 'Héctor', 'Vanessa', 'Jorge', 'Diana',
  'Alonso', 'Paola', 'Cristian', 'Beatriz', 'Oscar', 'Karla', 'Sergio', 'Monica', 'Iván', 'Lorena'
];

const LAST_NAMES = [
  'González', 'Rodríguez', 'López', 'Martínez', 'Pérez', 'Gómez', 'Sánchez', 'Díaz', 'Hernández', 'Álvarez',
  'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez',
  'Serrano', 'Blanco', 'Molina', 'Morales', 'Suárez', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio',
  'Marín', 'Sanz', 'Núñez', 'Iglesias', 'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano',
  'Guerrero', 'Cano', 'Prieto', 'Méndez', 'Cruz', 'Calvo', 'Gallego', 'Vidal', 'León', 'Herrera'
];

const MATERIALS = ['pet', 'aluminio', 'papel', 'carton', 'plastico'] as const;

function randomElement<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function randomDateInPastDays(days: number): Date {
  const now = Date.now();
  const past = now - Math.random() * days * 24 * 60 * 60 * 1000;
  return new Date(past);
}

async function runSeed() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('🌱 ECO-UNAN: SEED DE ALTO VOLUMEN Y RENDIMIENTO');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('✅ Conectado a MongoDB Atlas con éxito.');

  console.log('🔐 Generando salt y hash estándar para usuarios de prueba...');
  const commonPasswordHash = await bcrypt.hash('password123', 10);

  const existingUsers = await User.find({}).lean();
  const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
  console.log(`ℹ️ Usuarios existentes encontrados: ${existingUsers.length} (serán preservados al 100%).`);

  // Identificar validadores (brigadistas y admins)
  let brigadistasAndAdmins = existingUsers.filter(u => u.role === 'brigadista' || u.role === 'admin' || u.role === 'superadmin');

  // Si no hay brigadistas o admin, crearlos
  if (brigadistasAndAdmins.length === 0) {
    const defaultStaff = await User.create([
      {
        name: 'Admin Central EcoUNAN',
        email: 'admin@ecounan.edu.ni',
        password: commonPasswordHash,
        role: 'admin',
        faculty: 'Ciencias e Ingeniería',
        career: 'Ingeniería en Sistemas',
      },
      {
        name: 'Brigadista Ambiental 01',
        email: 'brigada01@ecounan.edu.ni',
        password: commonPasswordHash,
        role: 'brigadista',
        faculty: 'Ciencias Médicas',
      }
    ]);
    brigadistasAndAdmins = defaultStaff.map(s => s.toObject());
  }

  // 2. Generar 200 nuevos estudiantes sintéticos
  console.log('👥 Generando 200 nuevos estudiantes sintéticos...');
  const newUsersToInsert: any[] = [];
  const targetNewUsers = 200;

  for (let i = 1; i <= targetNewUsers; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const secondLast = randomElement(LAST_NAMES);
    const fullName = `${firstName} ${lastName} ${secondLast}`;
    const emailNum = String(i).padStart(3, '0');
    const email = `estudiante${emailNum}@unan.edu.ni`;

    if (existingEmails.has(email)) continue;

    const facGroup = randomElement(FACULTIES_DATA);
    const career = randomElement(facGroup.careers);
    const year = randomElement([2021, 2022, 2023, 2024, 2025]);
    const studentId = `${year}-${randomInt(10000, 99999)}${String.fromCharCode(65 + randomInt(0, 25))}`;

    newUsersToInsert.push({
      name: fullName,
      email,
      password: commonPasswordHash,
      role: 'user',
      isActive: true,
      ecoPoints: 0,
      lifetimePoints: 0,
      faculty: facGroup.faculty,
      career,
      studentId,
      createdAt: randomDateInPastDays(180),
      updatedAt: new Date()
    });
  }

  if (newUsersToInsert.length > 0) {
    await User.insertMany(newUsersToInsert, { ordered: false });
    console.log(`✅ ${newUsersToInsert.length} estudiantes insertados.`);
  }

  // Cargar todos los usuarios actualizados
  const allUsers = await User.find({}).lean();
  const allStudentUsers = allUsers.filter(u => u.role === 'user');
  const allStaff = allUsers.filter(u => u.role === 'brigadista' || u.role === 'admin' || u.role === 'superadmin');

  console.log(`📊 Pool total de usuarios disponibles: ${allUsers.length} (${allStudentUsers.length} estudiantes, ${allStaff.length} validadores).`);

  // 3. Recompensas (Rewards)
  console.log('🎁 Verificando y poblando catálogo de Recompensas...');
  const initialRewards = [
    { title: 'Bono Cafetería Central ($3)', description: 'Válido para almuerzos o desayunos en el comedor universitario.', pointsCost: 300, stock: 50, iconName: 'Coffee', iconColor: '#B45309', iconBg: '#FEF3C7' },
    { title: 'Bono Cafetería Central ($5)', description: 'Canjeable por alimentos en cualquiera de los módulos de la UNAN.', pointsCost: 500, stock: 30, iconName: 'Coffee', iconColor: '#B45309', iconBg: '#FEF3C7' },
    { title: 'Termo Reutilizable EcoUNAN', description: 'Termo de acero inoxidable con grabado láser oficial EcoUNAN.', pointsCost: 750, stock: 25, iconName: 'CupSoda', iconColor: '#1D4ED8', iconBg: '#DBEAFE' },
    { title: 'Camiseta Oficial Algodón Reciclado', description: 'Edición limitada Brigada Ecológica UNAN 2026.', pointsCost: 1000, stock: 20, iconName: 'Shirt', iconColor: '#0F766E', iconBg: '#CCFBF1' },
    { title: 'Kit Libreta y Bolígrafo de Bambú', description: 'Cuaderno cosido de papel reciclado y lapicero biodegradable.', pointsCost: 250, stock: 60, iconName: 'BookOpen', iconColor: '#15803D', iconBg: '#DCFCE7' },
    { title: 'Memoria USB 32GB Ecológica', description: 'Memoria con carcasa de madera de pino certificada FSC.', pointsCost: 1200, stock: 15, iconName: 'Cpu', iconColor: '#4F46E5', iconBg: '#EEF2FF' },
    { title: 'Gorra Deportiva EcoUNAN', description: 'Gorra ajustable elaborada con tela RPET de botellas recicladas.', pointsCost: 600, stock: 25, iconName: 'Smile', iconColor: '#C026D3', iconBg: '#FAE8FF' },
    { title: 'Descuento 10% Matrícula Semestral', description: 'Aplica a la arancel de matrícula del siguiente semestre lectivo.', pointsCost: 3500, stock: -1, iconName: 'GraduationCap', iconColor: '#7C3AED', iconBg: '#EDE9FE' },
    { title: 'Pase Libre Parqueo Universitario (1 Mes)', description: 'Acceso vehicular sin costo en estacionamientos del campus.', pointsCost: 1800, stock: 10, iconName: 'Car', iconColor: '#EA580C', iconBg: '#FFEDD5' },
    { title: 'Kit de Stickers Ecológicos para Laptop', description: 'Colección de 6 calcomanías con temáticas medioambientales UNAN.', pointsCost: 150, stock: 100, iconName: 'Tag', iconColor: '#16A34A', iconBg: '#DCFCE7' }
  ];

  for (const rew of initialRewards) {
    await Reward.findOneAndUpdate(
      { title: rew.title },
      { $setOnInsert: rew },
      { upsert: true }
    );
  }
  const allRewards = await Reward.find({ isActive: true }).lean();
  console.log(`✅ Catálogo de recompensas listo con ${allRewards.length} productos.`);

  // 4. Metas y Desafíos (Goals)
  console.log('🎯 Verificando y poblando Desafíos y Metas...');
  const initialGoals = [
    { title: 'Semana del Plástico Cero', description: 'Registra al menos 3 reciclajes de PET o plástico esta semana.', targetRecycles: 3, rewardPoints: 150, endDate: new Date(Date.now() + 15 * 86400000), isActive: true },
    { title: 'Desafío Mensual 15kg', description: 'Supera los 15 kg totales de material reciclado este mes.', targetRecycles: 8, rewardPoints: 500, endDate: new Date(Date.now() + 30 * 86400000), isActive: true },
    { title: 'Interfacultades Verde 2026', description: 'Participa activamente en la gran colecta interuniversitaria.', targetRecycles: 15, rewardPoints: 1200, endDate: new Date(Date.now() + 60 * 86400000), isActive: true },
    { title: 'Reto Rápido de Papel y Cartón', description: 'Lleva papel de archivo o cartón a los centros de acopio.', targetRecycles: 4, rewardPoints: 200, endDate: new Date(Date.now() + 7 * 86400000), isActive: true }
  ];

  for (const g of initialGoals) {
    await Goal.findOneAndUpdate(
      { title: g.title },
      { $setOnInsert: g },
      { upsert: true }
    );
  }
  const allGoals = await Goal.find({ isActive: true }).lean();
  console.log(`✅ ${allGoals.length} Metas activas disponibles.`);

  // 5. Generar 2,500 registros de reciclaje masivos con distribución realista
  console.log('♻️ Generando 2,500 registros de reciclaje para estresar índices y agregaciones...');
  const recyclesToInsert: any[] = [];
  const targetRecycles = 2500;

  // Seguimiento de puntos para balancear usuarios
  const userPointsMap = new Map<string, { current: number; lifetime: number }>();
  allUsers.forEach(u => {
    userPointsMap.set(u._id.toString(), {
      current: u.ecoPoints || 0,
      lifetime: u.lifetimePoints || u.ecoPoints || 0
    });
  });

  for (let i = 0; i < targetRecycles; i++) {
    const student = randomElement(allStudentUsers);
    const validator = randomElement(allStaff);
    const createdAt = randomDateInPastDays(180);

    // Número de ítems (1 a 3 materiales por entrega)
    const numItems = randomInt(1, 3);
    const items: any[] = [];
    let totalWeight = 0;
    let totalPoints = 0;

    const usedMats = new Set<string>();
    for (let j = 0; j < numItems; j++) {
      let mat = randomElement(MATERIALS);
      while (usedMats.has(mat)) {
        mat = randomElement(MATERIALS);
      }
      usedMats.add(mat);

      const weight = randomFloat(0.5, 8.5, 1);
      const pointsEarned = Math.floor(weight * 10);
      totalWeight += weight;
      totalPoints += pointsEarned;

      items.push({
        materialType: mat,
        weight,
        pointsEarned
      });
    }

    // Estado con proporción: 82% validated, 12% pending, 6% rejected
    const roll = Math.random();
    let status: 'validated' | 'pending' | 'rejected' = 'validated';
    if (roll > 0.94) {
      status = 'rejected';
    } else if (roll > 0.82) {
      status = 'pending';
    }

    const validationMode = Math.random() > 0.4 ? 'photo' : 'inperson';
    const proofImage = validationMode === 'photo' ? `/uploads/evidence_seed_${randomInt(1, 20)}.jpg` : undefined;

    recyclesToInsert.push({
      user: student._id,
      items,
      totalWeight: Math.round(totalWeight * 10) / 10,
      totalPoints,
      status,
      validationMode,
      proofImage,
      description: `Entrega de reciclaje en centro de acopio (${items.map(it => it.materialType).join(', ')})`,
      validatedBy: status !== 'pending' ? validator._id : undefined,
      createdAt,
      updatedAt: createdAt
    });

    // Si fue validado, acumular puntos en el usuario
    if (status === 'validated') {
      const stats = userPointsMap.get(student._id.toString())!;
      stats.current += totalPoints;
      stats.lifetime += totalPoints;
    }
  }

  // Insertar en lotes de 1000 para optimizar memoria
  const CHUNK_SIZE = 1000;
  for (let c = 0; c < recyclesToInsert.length; c += CHUNK_SIZE) {
    const chunk = recyclesToInsert.slice(c, c + CHUNK_SIZE);
    await Recycle.insertMany(chunk, { ordered: false });
    console.log(`   -> Insertados ${c + chunk.length} / ${recyclesToInsert.length} reciclajes...`);
  }
  console.log('✅ 2,500 reciclajes insertados con éxito.');

  // 6. Generar 400 canjes (Redemptions)
  console.log('🎫 Generando 400 canjes de recompensas...');
  const redemptionsToInsert: any[] = [];
  const targetRedemptions = 400;

  for (let i = 0; i < targetRedemptions; i++) {
    const student = randomElement(allStudentUsers);
    const rew = randomElement(allRewards);
    const validator = randomElement(allStaff);
    const createdAt = randomDateInPastDays(90);

    const roll = Math.random();
    let status: 'completed' | 'pending' | 'cancelled' = 'completed';
    if (roll > 0.85) {
      status = 'pending';
    } else if (roll > 0.75) {
      status = 'cancelled';
    }

    const qrCodeData = `ECO_REDEEM_${crypto.randomBytes(12).toString('hex').toUpperCase()}`;

    redemptionsToInsert.push({
      user: student._id,
      reward: rew._id,
      pointsSpent: rew.pointsCost,
      status,
      qrCodeData,
      validatedBy: status === 'completed' ? validator._id : undefined,
      createdAt,
      updatedAt: createdAt
    });

    // Descontar puntos de ecoPoints (pero no de lifetimePoints) si completado o pendiente
    if (status === 'completed' || status === 'pending') {
      const stats = userPointsMap.get(student._id.toString())!;
      if (stats.current >= rew.pointsCost) {
        stats.current -= rew.pointsCost;
      }
    }
  }

  await Redemption.insertMany(redemptionsToInsert, { ordered: false });
  console.log('✅ 400 canjes de recompensas creados con códigos QR únicos indexados.');

  // 7. Generar Reclamos de Metas (GoalClaims) respetando índice único { goal: 1, user: 1 }
  console.log('🏆 Generando 350 reclamos de metas (GoalClaims)...');
  const goalClaimsToInsert: any[] = [];
  const claimedPairSet = new Set<string>();

  for (let i = 0; i < 350; i++) {
    const student = randomElement(allStudentUsers);
    const g = randomElement(allGoals);
    const pairKey = `${g._id.toString()}_${student._id.toString()}`;

    if (claimedPairSet.has(pairKey)) continue;
    claimedPairSet.add(pairKey);

    const claimedAt = randomDateInPastDays(60);
    goalClaimsToInsert.push({
      goal: g._id,
      user: student._id,
      pointsAwarded: g.rewardPoints,
      claimedAt,
      createdAt: claimedAt,
      updatedAt: claimedAt
    });

    const stats = userPointsMap.get(student._id.toString())!;
    stats.current += g.rewardPoints;
    stats.lifetime += g.rewardPoints;
  }

  if (goalClaimsToInsert.length > 0) {
    await GoalClaim.insertMany(goalClaimsToInsert, { ordered: false });
    console.log(`✅ ${goalClaimsToInsert.length} reclamos de metas insertados.`);
  }

  // 8. Generar Notificaciones
  console.log('🔔 Generando 600 notificaciones de sistema y actividad...');
  const notifsToInsert: any[] = [
    {
      user: null,
      title: '¡Gran Campaña de Reciclaje UNAN 2026! 🌿',
      message: 'Lleva tus botellas PET a los quioscos centrales y obtén doble puntaje los días viernes.',
      isRead: false,
      createdAt: new Date()
    },
    {
      user: null,
      title: 'Actualización en el Catálogo de Recompensas 🎁',
      message: 'Nuevos termos de acero y libretas ecológicas disponibles para canje.',
      isRead: false,
      createdAt: new Date(Date.now() - 86400000)
    }
  ];

  for (let i = 0; i < 500; i++) {
    const student = randomElement(allStudentUsers);
    const notifType = randomElement([
      { title: '¡Puntos acreditados! ⭐', msg: 'Tu entrega de reciclaje ha sido aprobada por un brigadista.' },
      { title: 'Meta completada 🎯', msg: 'Has alcanzado el objetivo de la semana. ¡Reclama tus puntos en la pestaña de metas!' },
      { title: 'Subiste de Rango 🎖️', msg: '¡Felicidades! Has alcanzado un nuevo nivel ecológico en el ranking de la universidad.' },
      { title: 'Cupón generado exitosamente 🎫', msg: 'Muestra tu código QR en la cafetería o punto de canje para reclamar tu premio.' }
    ]);

    notifsToInsert.push({
      user: student._id,
      title: notifType.title,
      message: notifType.msg,
      isRead: Math.random() > 0.4,
      createdAt: randomDateInPastDays(45)
    });
  }

  await Notification.insertMany(notifsToInsert, { ordered: false });
  console.log('✅ 500+ notificaciones insertadas.');

  // 9. Sincronizar ecoPoints y lifetimePoints en User de forma masiva
  console.log('🔄 Sincronizando puntos de estudiantes con bulkWrite...');
  const bulkUserOps = [];
  for (const [userId, stats] of userPointsMap.entries()) {
    bulkUserOps.push({
      updateOne: {
        filter: { _id: new Types.ObjectId(userId) },
        update: {
          $set: {
            ecoPoints: Math.max(0, stats.current),
            lifetimePoints: Math.max(0, stats.lifetime)
          }
        }
      }
    });
  }

  if (bulkUserOps.length > 0) {
    await User.bulkWrite(bulkUserOps);
    console.log(`✅ ${bulkUserOps.length} usuarios sincronizados con sus puntos reales calculados.`);
  }

  // 10. Resumen final de la base de datos
  const [totalU, totalRec, totalRew, totalRed, totalG, totalGC, totalN] = await Promise.all([
    User.countDocuments(),
    Recycle.countDocuments(),
    Reward.countDocuments(),
    Redemption.countDocuments(),
    Goal.countDocuments(),
    GoalClaim.countDocuments(),
    Notification.countDocuments()
  ]);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('====================================================');
  console.log(`🎉 POBLADO COMPLETADO EXITOSAMENTE EN ${elapsed}s`);
  console.log('====================================================');
  console.log(`📊 TOTALES EN LA BASE DE DATOS:`);
  console.log(`   - Usuarios (Users):         ${totalU}`);
  console.log(`   - Reciclajes (Recycles):     ${totalRec}`);
  console.log(`   - Recompensas (Rewards):    ${totalRew}`);
  console.log(`   - Canjes (Redemptions):     ${totalRed}`);
  console.log(`   - Metas (Goals):            ${totalG}`);
  console.log(`   - Reclamos (GoalClaims):    ${totalGC}`);
  console.log(`   - Notificaciones (Notifs):  ${totalN}`);
  console.log('====================================================');
  console.log('🔑 CREDENCIALES DE PRUEBA:');
  console.log('   - Tu cuenta personal: Frank west (franklinescoto286@gmail.com)');
  console.log('   - Admin:              admin@ecounan.edu.ni / password123');
  console.log('   - Brigadista:         brigada@ecounan.edu.ni / Brigada2026!');
  console.log('   - Estudiante demo:    ana@demo.com / password123');
  console.log('   - 200 Nuevos alumnos: estudiante001@unan.edu.ni a estudiante200@unan.edu.ni (password123)');
  console.log('====================================================');

  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch(err => {
  console.error('❌ Error durante el poblado de datos:', err);
  process.exit(1);
});
