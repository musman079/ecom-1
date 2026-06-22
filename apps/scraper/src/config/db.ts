import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load the .env from the web app or custom .env
dotenv.config({ path: path.resolve(__dirname, '../../../../apps/web/.env') });

export const connectDB = async () => {
  try {
    const mongoUrl = process.env.DATABASE_URL || process.env.MONGODB_URL;
    if (!mongoUrl) {
      throw new Error('MongoDB URL not found in environment variables');
    }
    
    await mongoose.connect(mongoUrl);
    console.log('MongoDB connected successfully for Scraper pipeline');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
