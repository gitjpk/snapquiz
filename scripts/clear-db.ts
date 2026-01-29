import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting all data...');
  
  await prisma.response.deleteMany();
  await prisma.score.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.answerOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  
  console.log('All quizzes and related data deleted!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
