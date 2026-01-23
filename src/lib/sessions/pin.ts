import prisma from "@/lib/db/client";

/**
 * Generate a unique 6-digit PIN for a live session.
 * PINs must be unique among active (lobby/in_progress) sessions.
 */
export async function generateUniquePin(): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pin = generateRandomPin();

    // Check if PIN is already in use by an active session
    const existingSession = await prisma.liveSession.findFirst({
      where: {
        pin,
        status: {
          in: ["lobby", "in_progress"],
        },
      },
      select: { id: true },
    });

    if (!existingSession) {
      return pin;
    }
  }

  throw new Error(
    "Failed to generate unique PIN after maximum attempts. Please try again."
  );
}

/**
 * Generate a random 6-digit PIN.
 * Avoids confusing patterns like all zeros or sequential numbers.
 */
export function generateRandomPin(): string {
  // Generate a random number between 100000 and 999999
  const pin = Math.floor(100000 + Math.random() * 900000).toString();

  // Avoid potentially confusing patterns
  if (isConfusingPattern(pin)) {
    return generateRandomPin();
  }

  return pin;
}

/**
 * Check if a PIN follows a confusing pattern that should be avoided.
 */
export function isConfusingPattern(pin: string): boolean {
  // All same digits (e.g., 111111)
  if (/^(\d)\1{5}$/.test(pin)) {
    return true;
  }

  // Sequential ascending (e.g., 123456)
  if (pin === "123456" || pin === "234567" || pin === "345678" || 
      pin === "456789" || pin === "567890") {
    return true;
  }

  // Sequential descending (e.g., 654321)
  if (pin === "654321" || pin === "765432" || pin === "876543" || 
      pin === "987654" || pin === "098765") {
    return true;
  }

  // Common "bad" patterns
  if (pin === "000000" || pin === "123123" || pin === "696969") {
    return true;
  }

  return false;
}

/**
 * Validate PIN format.
 */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}
