import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/user.model';
import Reward from './models/reward.model';
import Recycle from './models/recycle.model';
import Goal from './models/goal.model';
import Notification from './models/notification.model';
import Redemption from './models/redemption.model';

dotenv.config();

const daysFromNow = (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const seedDatabase = async () => {
  try {
    console.log('Intentando conectar a MongoDB Atlas...');
    console.log('URI:', process.env.MONGO_URI?.replace(/:([^:@]+)@/, ':****@'));

    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Conexion exitosa a MongoDB!');

    
    console.log('Limpiando base de datos...');
    await Promise.all([
      User.deleteMany(),
      Reward.deleteMany(),
      Recycle.deleteMany(),
      Goal.deleteMany(),
      Notification.deleteMany(),
      Redemption.deleteMany(),
    ]);

    
    console.log('Creando usuarios...');
    await User.create([
      {
        name: 'Super Admin EcoUnan',
        email: 'superadmin@ecounan.edu.ni',
        password: 'SuperAdmin2026!',
        role: 'superadmin',
        ecoPoints: 0,
        faculty: 'REC',
      },
      {
        name: 'Admin EcoUnan',
        email: 'admin@ecounan.edu.ni',
        password: 'password123',
        role: 'admin',
        ecoPoints: 1000,
        faculty: 'REC',
        career: 'Administracion',
      },
      {
        name: 'Brigadista Verde',
        email: 'brigada@ecounan.edu.ni',
        password: 'Brigada2026!',
        role: 'brigadista',
        ecoPoints: 300,
        faculty: 'REC',
        career: 'Gestion Ambiental',
      },
      {
        name: 'Ana Lopez',
        email: 'ana@demo.com', studentId: '2026-10041A',
        password: 'password123',
        role: 'user',
        ecoPoints: 2450,
        faculty: 'FEC',
        career: 'Economia',
      },
      {
        name: 'Luis Perez',
        email: 'luis@demo.com', studentId: '2026-10052B',
        password: 'password123',
        role: 'user',
        ecoPoints: 1980,
        faculty: 'FCNM',
        career: 'Quimica',
      },
      {
        name: 'Maria Gonzalez',
        email: 'maria@demo.com', studentId: '2026-10063C',
        password: 'password123',
        role: 'user',
        ecoPoints: 1720,
        faculty: 'FAREM',
        career: 'Biologia',
      },
      {
        name: 'Carlos Ruiz',
        email: 'carlos@demo.com', studentId: '2026-10074D',
        password: 'password123',
        role: 'user',
        ecoPoints: 1350,
        faculty: 'FEC',
        career: 'Contaduria',
      },
      {
        name: 'Sofia Hernandez',
        email: 'sofia@demo.com', studentId: '2026-10085E',
        password: 'password123',
        role: 'user',
        ecoPoints: 980,
        faculty: 'FCyM',
        career: 'Medicina',
      },
      {
        name: 'Diego Martinez',
        email: 'diego@demo.com', studentId: '2026-10096F',
        password: 'password123',
        role: 'user',
        ecoPoints: 720,
        faculty: 'FIC',
        career: 'Ing. Civil',
      },
      {
        name: 'Valeria Cruz',
        email: 'valeria@demo.com', studentId: '2026-10107G',
        password: 'password123',
        role: 'user',
        ecoPoints: 450,
        faculty: 'FAREM',
        career: 'Agronomia',
      },
    ]);
    const users = await User.find({ role: 'user' });
    const admin = await User.findOne({ role: 'admin' });

    
    console.log('Creando recompensas...');
    await Reward.insertMany([
      {
        title: 'Bono de Cafeteria ($5)',
        description: 'Canjea tus puntos por un bono valido en la cafeteria central',
        pointsCost: 500,
        stock: 20,
        isActive: true,
        iconName: 'Coffee',
        iconColor: '#B45309',
        iconBg: '#FEF3C7',
      },
      {
        title: 'Camiseta Oficial EcoUnan',
        description: 'Camiseta ecologica edicion especial hecha con materiales reciclados',
        pointsCost: 1000,
        stock: 15,
        isActive: true,
        iconName: 'Shirt',
        iconColor: '#0F766E',
        iconBg: '#CCFBF1',
      },
      {
        title: 'Termo Reutilizable',
        description: 'Termo de acero inoxidable libre de plastico',
        pointsCost: 750,
        stock: 10,
        isActive: true,
        iconName: 'CupSoda',
        iconColor: '#1D4ED8',
        iconBg: '#DBEAFE',
      },
      {
        title: 'Descuento en Matricula (10%)',
        description: 'Aplica un descuento del 10% en tu proxima matricula universitaria',
        pointsCost: 5000,
        stock: -1,
        isActive: true,
        iconName: 'GraduationCap',
        iconColor: '#7C3AED',
        iconBg: '#EDE9FE',
      },
      {
        title: 'Kit de Libreta Ecologica',
        description: 'Libreta de papel reciclado + boligrafo de bambu',
        pointsCost: 300,
        stock: 25,
        isActive: true,
        iconName: 'BookOpen',
        iconColor: '#15803D',
        iconBg: '#DCFCE7',
      },
    ]);

    
    console.log('Creando metas...');
    await Goal.insertMany([
      {
        title: 'Semana del Plastico Cero',
        description: 'Registra al menos 3 reciclajes de plastico esta semana',
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
        description: 'La facultad con mas kg reciclados gana una actividad de cierre',
        targetRecycles: 50,
        rewardPoints: 2000,
        endDate: daysFromNow(60),
        isActive: true,
      },
    ]);

    
    console.log('Creando notificaciones...');
    const seedNotifications: any[] = [];
    for (const u of users) {
      seedNotifications.push(
        {
          user: u._id,
          title: '¡Bienvenido a EcoUNAN! 🌱',
          message: 'Gracias por sumarte. Escanea los QR de los centros de acopio autorizados para ganar puntos.',
          isRead: false,
        },
        {
          user: u._id,
          title: 'Nueva meta disponible 🎯',
          message: 'Participa en la Semana del Plástico Cero y gana 100 puntos extra.',
          isRead: false,
        },
        {
          user: u._id,
          title: 'Nuevas recompensas en la tienda 🎁',
          message: 'Ya disponibles: termos, camisetas ecológicas y kits de libretas.',
          isRead: false,
        }
      );
    }
    if (admin) {
      seedNotifications.push({
        user: admin._id,
        title: 'Panel de administrador listo ⚙️',
        message: 'Puedes validar reciclajes pendientes desde el panel de administración.',
        isRead: false,
      });
    }
    await Notification.insertMany(seedNotifications);



    
    console.log('Creando registros de reciclaje...');
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
        description: 'Reciclaje registrado (manual)',
      }))
    );

    console.log('Base de datos poblada exitosamente!');
    console.log('--------------------------------------------');
    console.log('Colecciones listas: users, rewards, goals, notifications, recycles');
    console.log('SuperAdmin: superadmin@ecounan.edu.ni / SuperAdmin2026!');
    console.log('Admin: admin@ecounan.edu.ni / password123');
    console.log('Brigadista: brigada@ecounan.edu.ni / Brigada2026!');
    console.log('Demo : ana@demo.com / password123 (y los demas @demo.com)');
    console.log('--------------------------------------------');
    process.exit(0);
  } catch (error: any) {
    console.error('Error conectando o poblando la base de datos:');
    console.error(error.message);
    if (error.message.includes('querySrv') || error.message.includes('ETIMEDOUT')) {
      console.error('\n--> CONSEJO: usa la URI sin SRV (shards explicitos) como la del .env actual');
    }
    process.exit(1);
  }
};

seedDatabase();
