const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    // Configuración optimizada sin opciones deprecadas
    await mongoose.connect(process.env.MONGODB_URI, {
      // Removidas las opciones deprecadas useNewUrlParser y useUnifiedTopology
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Atlas connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const disconnectMongoDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
  }
};

module.exports = {
  connectMongoDB,
  disconnectMongoDB,
  mongoose
}; 