import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/user.model';
import Reward from './models/reward.model';
import Recycle from './models/recycle.model';
import Goal from './models/goal.model';
import Notification from './models/notification.model';
import CampusBin from './models/campusBin.model';
import Redemption from './models/redemption.model';

dotenv.config();

const daysFromNow = (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const seedDatabase = async () => {
  try {
    console.log('⏳ Intentando conectar a MongoDB Atlas...');
    console.log('URI:', process.env.MONGO_URI?.replace(/:([^:@]+)@/, ':****@'));

    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✅ ¡Conexión exitosa a MongoDB!');

    // Limpiar datos existentes
    console.log('🧹 Limpiando base de datos...');
    await Promise.all([
      User.deleteMany(),
      Reward.deleteMany(),
      Recycle.deleteMany(),
      Goal.deleteMany(),
      Notification.deleteMany(),
      CampusBin.deleteMany(),
      Redemption.deleteMany(),
    ]);

    // ─── Usuarios (admin + demos para el ranking) ───
    console.log('👤 Creando usuarios...');
    await User.create([
      {
        name: 'Admin EcoUnan',
        email: 'admin@ecounan.edu.ni',
        password: 'password123',
        role: 'admin',
        ecoPoints: 1000,
        faculty: 'REC',
        career: 'Administración',
      },
      {
        name: 'Ana López',
        email: 'ana@demo.com',
        password: 'password123',
        role: 'user',
        ecoPoints: 2450,
        faculty: 'FEC',
        career: 'Economía',
      },
      {
        name: 'Luis Pérez',
        email: 'luis@demo.com',
        password: 'password123',
        role: 'user',
        ecoPoints: 1980,
        faculty: 'FCNM',
        career: 'Química',
      },
      {
        name: 'María González',
        email: 'maria@demo.com',
        password: 'password123',
        role: 'user',
        ecoPoints: 1720,
        faculty: 'FAREM',
        career: 'Biología',
      },
      {
        name: 'Carlos Ruiz',
        email: 'carlos@demo.com',
        password: 'password123',
        role: 'user',
        ecoPoints: 1350,
        faculty: 'FEC',
        career: 'Contaduría',
      },
      {
        name: 'Sofía Hernández',
        email: 'sofia@demo.com',
        password: 'password123',
        role: 'user',
        ecoPoints: 980,
        faculty: 'FCyM',
        career: 'Medicina',
      },
      {
        name: 'Diego Martínez',
        email: 'diego@demo.com',
        password: 'password123',
        role: 'user',
        ecoPoints: 720,
        faculty: 'FIC',
        career: 'Ing. Civil',
      },
      {
        name: 'Valeria Cruz',
        email: 'valeria@demo.com',
        password: 'password123',
        role: 'user',
        ecoPoints: 450,
        faculty: 'FAREM',
        career: 'Agronomía',
      },
    ]);
    const users = await User.find({ role: 'user' });
    const admin = await User.findOne({ role: 'admin' });

    // ─── Recompensas (con íconos que espera la app) ───
    console.log('🎁 Creando recompensas...');
    await Reward.insertMany([
      {
        title: 'Bono de Cafetería ($5)',
        description: 'Canjea tus puntos por un bono válido en la cafetería central',
        pointsCost: 500,
        stock: 20,
        isActive: true,
        iconName: 'Coffee',
        iconColor: '#B45309',
        iconBg: '#FEF3C7',
      },
      {
        title: 'Camiseta Oficial EcoUnan',
        description: 'Camiseta ecológica edición especial hecha con materiales reciclados',
        pointsCost: 1000,
        stock: 15,
        isActive: true,
        iconName: 'Shirt',
        iconColor: '#0F766E',
        iconBg: '#CCFBF1',
      },
      {
        title: 'Termo Reutilizable',
        description: 'Termo de acero inoxidable libre de plástico',
        pointsCost: 750,
        stock: 10,
        isActive: true,
        iconName: 'CupSoda',
        iconColor: '#1D4ED8',
        iconBg: '#DBEAFE',
      },
      {
        title: 'Descuento en Matrícula (10%)',
        description: 'Aplica un descuento del 10% en tu próxima matrícula universitaria',
        pointsCost: 5000,
        stock: -1,
        isActive: true,
        iconName: 'GraduationCap',
        iconColor: '#7C3AED',
        iconBg: '#EDE9FE',
      },
      {
        title: 'Kit de Libreta Ecológica',
        description: 'Libreta de papel reciclado + bolígrafo de bambú',
        pointsCost: 300,
        stock: 25,
        isActive: true,
        iconName: 'BookOpen',
        iconColor: '#15803D',
        iconBg: '#DCFCE7',
      },
    ]);

    // ─── Metas / Goals (no hay endpoint para crearlas: solo el seed las llena) ───
    console.log('🎯 Creando metas...');
    await Goal.insertMany([
      {
        title: 'Semana del Plástico Cero',
        description: 'Registra al menos 3 reciclajes de plástico esta semana',
        targetRecycles: 3,
        rewardPoints: 100,
        endDate: daysFromNow(7),
        isActive: true,
      },
      {
        title: 'Meta Mensual: 10 kg',
        description: 'Acumula 10 kg de material reciclado durante el mes y gana puntos extra',
        targetRecycles: 10,
        rewardPoints: 500,
        endDate: daysFromNow(30),
        isActive: true,
      },
      {
        title: 'Reto por Facultades',
        description: 'La facultad con más kg reciclados gana una actividad de cierre',
        targetRecycles: 50,
        rewardPoints: 2000,
        endDate: daysFromNow(60),
        isActive: true,
      },
    ]);

    // ─── Notificaciones globales (visibles para todos) ───
    console.log('🔔 Creando notificaciones...');
    await Notification.insertMany([
      {
        user: null,
        title: '¡Bienvenido a EcoUnan! 🌱',
        message: 'Gracias por sumarte. Escanea los QR de los basureros inteligentes para ganar puntos.',
        isRead: false,
      },
      {
        user: null,
        title: 'Nueva meta disponible',
        message: 'Participa en la Semana del Plástico Cero y gana 100 puntos extra.',
        isRead: false,
      },
      {
        user: null,
        title: 'Nuevas recompensas en la tienda',
        message: 'Ya disponibles: termos, camisetas ecológicas y kits de libretas.',
        isRead: false,
      },
      {
        user: (admin?._id ?? null),
        title: 'Panel de administrador listo',
        message: 'Puedes validar reciclajes pendientes desde el panel de administración.',
        isRead: false,
      },
    ]);

    // ─── Basureros inteligentes del campus (con QR válidos para scanQR) ───
    console.log('🗑️ Creando basureros del campus...');
    const binQr = (material: string, weight: number) =>
      JSON.stringify({ type: 'eco-unan-qr', material, weight });

    await CampusBin.insertMany([
      { name: 'Basurero Plásticos FAREM', locationDescription: 'Entrada principal FAREM, frente a cafetería', binType: 'plastic', qrCode: binQr('pet', 2), status: 'active' },
      { name: 'Basurero Aluminio FEC', locationDescription: 'Pasillo central FEC, segundo piso', binType: 'metal', qrCode: binQr('aluminio', 1), status: 'active' },
      { name: 'Basurero Papel Biblioteca', locationDescription: 'Junto a la entrada de la biblioteca central', binType: 'paper', qrCode: binQr('papel', 3), status: 'active' },
      { name: 'Basurero Mixto Cancha', locationDescription: 'Esquina noroeste de la cancha multiuso', binType: 'mixed', qrCode: binQr('carton', 2), status: 'active' },
    ]);

    // ─── Historial de reciclajes (registros válidos para historial y dashboard) ───
    console.log('♻️ Creando registros de reciclaje...');
    const recycleDocs = [
      { u: 0, material: 'pet' as const, w: 2.5, d: 6 },
      { u: 0, material: 'aluminio' as const, w: 1.2, d: 4 },
      { u: 1, material: 'papel' as const, w: 4.0, d: 5 },
      { u: 1, material: 'plastico' as const, w: 3.2, d: 3 },
      { u: 2, material: 'carton' as const, w: 5.5, d: 4 },
      { u: 3, material: 'pet' as const, w: 1.8, d: 2 },
      { u: 4, material: 'aluminio' as const, w: 2.0, d: 2 },
      { u: 5, material: 'papel' as const, w: 3.5, d: 1 },
      { u: 6, material: 'plastico' as const, w: 1.5, d: 1 },
    ];

    await Recycle.insertMany(
      recycleDocs.map((r) => ({
        user: users[r.u % users.length]._id,
        items: [
          {
            materialType: r.material,
            weight: r.w,
            pointsEarned: Math.floor(r.w * 10),
          },
        ],
        totalWeight: r.w,
        totalPoints: Math.floor(r.w * 10),
        status: r.d <= 1 ? 'pending' : 'validated',
        description: 'Reciclaje registrado en basurero inteligente',
      }))
    );

    console.log('🚀 ¡Base de datos poblada exitosamente!');
    console.log('────────────────────────────────────────────');
    console.log('Colecciones listas: users, rewards, goals, notifications, campusbins, recycles');
    console.log('Admin: admin@ecounan.edu.ni / password123');
    console.log('Demo : ana@demo.com / password123 (y los demás @demo.com)');
    console.log('────────────────────────────────────────────');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error conectando o poblando la base de datos:');
    console.error(error.message);
    if (error.message.includes('querySrv') || error.message.includes('ETIMEDOUT')) {
      console.error('\n--> CONSEJO: usa la URI sin SRV (shards explícitos) como la del .env actual');
    }
    process.exit(1);
  }
};

seedDatabase();
