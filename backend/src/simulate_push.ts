import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';


dotenv.config({ path: path.join(__dirname, '../.env') });

import User from './models/user.model';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecounan');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const sendPushNotification = async (expoPushToken: string, title: string, body: string) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const receipt = await response.json();
    console.log('Push sent receipt:', receipt);
  } catch (error) {
    console.error('Error sending push:', error);
  }
};

const runSimulation = async () => {
  await connectDB();

  const email = 'jomwestt@icloud.com';
  
  
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`User ${email} not found`);
    process.exit(1);
  }

  
  user.ecoPoints = (user.ecoPoints || 0) + 500;
  await user.save();
  console.log(`Added 500 points to ${email}. Total points: ${user.ecoPoints}`);

  const token = user.expoPushToken;
  if (!token) {
    console.error(`User ${email} does not have an expoPushToken.`);
    process.exit(1);
  }

  console.log(`Found Expo Push Token for user: ${token}`);
  console.log('Starting push notification simulation...');

  let count = 0;
  const maxPushes = 5;

  const pushInterval = setInterval(async () => {
    count++;
    console.log(`[${new Date().toISOString()}] Sending push notification ${count}/${maxPushes}`);
    
    await sendPushNotification(
      token, 
      '¡Puntos nuevos!', 
      `Felicidades, has sumado 500 puntos. Tu saldo es ${user.ecoPoints} pts.`
    );

    if (count >= maxPushes) {
      console.log('Simulation complete. Exiting.');
      clearInterval(pushInterval);
      process.exit(0);
    }
  }, 120000); 

  
  count++;
  console.log(`[${new Date().toISOString()}] Sending push notification ${count}/${maxPushes} (immediate)`);
  await sendPushNotification(
    token, 
    '¡Puntos nuevos!', 
    `Felicidades, has sumado 500 puntos. Tu saldo es ${user.ecoPoints} pts.`
  );
  
  if (count >= maxPushes) {
     console.log('Simulation complete. Exiting.');
     clearInterval(pushInterval);
     process.exit(0);
  }
};

runSimulation();
