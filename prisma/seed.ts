import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a demo host (using fake Microsoft ID for seeding)
  const host = await prisma.host.create({
    data: {
      microsoftId: "demo-microsoft-id-00000000-0000-0000-0000-000000000000",
      email: "demo@example.com",
      displayName: "Demo Host",
    },
  });

  // Create a sample quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: "General Knowledge Demo",
      description: "A sample quiz to demonstrate SnapQuiz features",
      ownerHostId: host.id,
      questions: {
        create: [
          {
            orderIndex: 0,
            prompt: "What is the capital of France?",
            timeLimitSeconds: 20,
            answerOptions: {
              create: [
                { orderIndex: 0, label: "London", isCorrect: false },
                { orderIndex: 1, label: "Paris", isCorrect: true },
                { orderIndex: 2, label: "Berlin", isCorrect: false },
                { orderIndex: 3, label: "Madrid", isCorrect: false },
              ],
            },
          },
          {
            orderIndex: 1,
            prompt: "Which planet is known as the Red Planet?",
            timeLimitSeconds: 15,
            answerOptions: {
              create: [
                { orderIndex: 0, label: "Venus", isCorrect: false },
                { orderIndex: 1, label: "Jupiter", isCorrect: false },
                { orderIndex: 2, label: "Mars", isCorrect: true },
                { orderIndex: 3, label: "Saturn", isCorrect: false },
              ],
            },
          },
          {
            orderIndex: 2,
            prompt: "What is 2 + 2?",
            timeLimitSeconds: 10,
            answerOptions: {
              create: [
                { orderIndex: 0, label: "3", isCorrect: false },
                { orderIndex: 1, label: "4", isCorrect: true },
                { orderIndex: 2, label: "5", isCorrect: false },
                { orderIndex: 3, label: "22", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
    include: {
      questions: {
        include: {
          answerOptions: true,
        },
      },
    },
  });

  console.log(`✅ Created demo quiz: "${quiz.title}" with ${quiz.questions.length} questions`);
  console.log(`   Quiz ID: ${quiz.id}`);

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
