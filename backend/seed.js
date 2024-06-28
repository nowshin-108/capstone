import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userData = JSON.parse(fs.readFileSync(path.resolve(__dirname, './seeders/users.json'), 'utf8'));
const postData = JSON.parse(fs.readFileSync(path.resolve(__dirname, './seeders/posts.json'), 'utf8'));

const seedDatabase = async () => {
  try {
    await prisma.user.createMany({
      data: userData,
      skipDuplicates: true,
    });

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedDatabase();
