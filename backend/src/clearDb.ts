import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const clearDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('ERROR: MONGO_URI no está definido en el archivo .env');
      process.exit(1);
    }

    console.log('Conectando a MongoDB Atlas (ecounan)...');
    await mongoose.connect(mongoUri);
    console.log('¡Conectado exitosamente!');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No se pudo acceder a la instancia de la base de datos');
    }

    const collections = await db.listCollections().toArray();
    console.log('\n--- ESTADO ANTERIOR DE COLECCIONES EN "ecounan" ---');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`- Colección "${col.name}": ${count} documentos`);
    }

    console.log('\nEliminando documentos de todas las colecciones...');
    for (const col of collections) {
      // No eliminamos colecciones de sistema si hubiera
      if (col.name.startsWith('system.')) continue;
      const res = await db.collection(col.name).deleteMany({});
      console.log(`✔ Limpiada colección "${col.name}": ${res.deletedCount} documentos eliminados.`);
    }

    console.log('\n--- ESTADO ACTUAL (ecounan) ---');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`- Colección "${col.name}": ${count} documentos`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Base de datos "ecounan" vaciada con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('Error al vaciar la base de datos:', error);
    process.exit(1);
  }
};

clearDatabase();
