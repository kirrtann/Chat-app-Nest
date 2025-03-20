import * as dotenv from 'dotenv';
import * as path from 'path';

// Explicitly load the correct env file
dotenv.config({ path: path.resolve(__dirname, '../../config/env/localhost.env') });

export const configuration = () => ({
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
});
