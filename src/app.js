import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.routes.js';
import securityMiddleware from '#middleware/security.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.use(securityMiddleware);

app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.status(200).send('Hello from API');
});

app.get('/health', (req, res) => {
  logger.info('Health check endpoint accessed');
  res.status(200).send({status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime()});
});

app.get('/api', (req, res) => {
  logger.info('API root endpoint accessed');
  res.status(200).send('Welcome to the API root');
});

app.use('/api/auth', authRoutes);
export default app;