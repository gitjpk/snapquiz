import { z } from "zod";

/**
 * Auth validation schemas for host password protection
 * Reference: specs/002-host-password-protection/contracts/openapi.yaml
 */

// Password validation rules (FR-008: minimum 8 characters)
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((val) => val.trim().length > 0, {
    message: "Password cannot be empty or whitespace only",
  });

// Setup request - initial password creation
export const setupRequestSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetupRequest = z.infer<typeof setupRequestSchema>;

// Login request
export const loginRequestSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

// Change password request
export const changePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

// Auth response
export const authResponseSchema = z.object({
  success: z.boolean(),
  expiresAt: z.string().datetime().optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// Status response
export const statusResponseSchema = z.object({
  isSetup: z.boolean(),
  isAuthenticated: z.boolean(),
});

export type StatusResponse = z.infer<typeof statusResponseSchema>;

// Error response
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Helper to format Zod errors into API error response
 */
export function formatZodError(error: z.ZodError): ErrorResponse {
  return {
    error: "VALIDATION_ERROR",
    message: error.errors[0]?.message || "Validation failed",
    details: error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  };
}
