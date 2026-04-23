import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: dbName || 'purerise',
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
    console.log(`📁  Database: ${conn.connection.db?.databaseName}`);

    // Ensure collections are created immediately (satisfies "auto-create" request)
    const models = mongoose.modelNames();
    for (const modelName of models) {
      const model = mongoose.model(modelName);
      await model.createCollection();
      console.log(`📦  Collection ensured: ${model.collection.name}`);
    }
  } catch (error) {
    console.error('❌  MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.info('🔄  MongoDB reconnected');
});

export default connectDB;
