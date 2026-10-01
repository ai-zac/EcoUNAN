import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
import User from './models/user.model';

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecounan');
    
    const email = 'admin@ecounan.com';
    const existing = await User.findOne({ email });
    
    if (existing) {
      console.log('El administrador ya existe:');
      console.log('Email:', email);
      console.log('Contraseña: (la que hayas definido al registrarlo)');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Admin Principal',
      email: email,
      password: 'adminpassword123', 
      role: 'admin'
    });

    console.log('¡Administrador creado con éxito!');
    console.log('---------------------------');
    console.log('Email:', admin.email);
    console.log('Contraseña:', 'adminpassword123');
    console.log('Rol:', admin.role);
    console.log('---------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
