import 'dotenv/config';
import app from './app';
import connectDB from './config/db';

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀  PureRaise API running on http://localhost:${PORT}`);
      console.log(`📦  Environment: ${process.env.NODE_ENV ?? 'development'}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n⚡  ${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅  HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌  Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
