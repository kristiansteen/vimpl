import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function testConnection() {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Defined' : 'Not defined');

    try {
        await prisma.$connect();
        console.log('Successfully connected to the database!');

        const boardCount = await prisma.board.count();
        console.log(`Connection test successful. Current board count: ${boardCount}`);

    } catch (error) {
        console.error('Database connection failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
