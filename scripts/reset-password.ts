/**
 * Reset Password CLI Script
 * 
 * Usage:
 *   npx ts-node scripts/reset-password.ts
 *   npm run reset-password
 * 
 * This script allows resetting the host password when you've lost access.
 * It will prompt for a new password interactively.
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as readline from "readline";

const prisma = new PrismaClient();
const BCRYPT_COST_FACTOR = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log("\n🔐 SnapQuiz Password Reset Tool\n");

  try {
    // Check if credentials exist
    const credential = await prisma.hostCredential.findFirst();
    
    if (!credential) {
      console.log("❌ No host password has been configured yet.");
      console.log("   Please run the application and set up the password via /setup\n");
      process.exit(1);
    }

    console.log("⚠️  This will reset the host password for the quiz application.");
    console.log("   All existing sessions will be invalidated.\n");

    const confirm = await prompt("Are you sure you want to continue? (yes/no): ");
    
    if (confirm.toLowerCase() !== "yes") {
      console.log("\n❌ Password reset cancelled.\n");
      process.exit(0);
    }

    // Get new password
    let newPassword: string;
    while (true) {
      newPassword = await prompt("\nEnter new password (min 8 characters): ");
      
      if (!newPassword.trim()) {
        console.log("❌ Password cannot be empty or whitespace only.");
        continue;
      }

      if (newPassword.length < 8) {
        console.log("❌ Password must be at least 8 characters.");
        continue;
      }

      const confirmPassword = await prompt("Confirm new password: ");
      
      if (newPassword !== confirmPassword) {
        console.log("❌ Passwords do not match. Please try again.");
        continue;
      }

      break;
    }

    console.log("\n⏳ Resetting password...");

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update the credential
    await prisma.hostCredential.update({
      where: { id: credential.id },
      data: { passwordHash },
    });

    // Revoke all existing sessions
    const revokedCount = await prisma.hostSession.updateMany({
      where: { revokedAt: null },
      data: { revokedAt: new Date() },
    });

    console.log("\n✅ Password reset successfully!");
    console.log(`   ${revokedCount.count} session(s) were invalidated.\n`);
    console.log("   You can now log in with your new password at /login\n");

  } catch (error) {
    console.error("\n❌ Error resetting password:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
