/**
 * MSAL (Microsoft Authentication Library) configuration for Microsoft Entra ID OAuth
 * Reference: specs/005-multi-host-accounts/research.md
 *
 * Security:
 * - Server-side OAuth (client secret stays on server)
 * - Authorization Code flow with PKCE
 * - HTTP-only cookies for session tokens
 */

import { ConfidentialClientApplication, Configuration, AuthorizationCodeRequest, AuthorizationUrlRequest } from "@azure/msal-node";

// Validate required environment variables
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// MSAL configuration (lazy loaded to allow env vars to be set)
let msalInstance: ConfidentialClientApplication | null = null;

function getMsalConfig(): Configuration {
  return {
    auth: {
      clientId: getEnvVar("AZURE_AD_CLIENT_ID"),
      clientSecret: getEnvVar("AZURE_AD_CLIENT_SECRET"),
      authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || "common"}`,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (!containsPii && process.env.NODE_ENV === "development") {
            console.log(`MSAL [${level}]: ${message}`);
          }
        },
        piiLoggingEnabled: false,
        logLevel: 2, // Info
      },
    },
  };
}

/**
 * Get or create the MSAL client application instance
 */
export function getMsalClient(): ConfidentialClientApplication {
  if (!msalInstance) {
    msalInstance = new ConfidentialClientApplication(getMsalConfig());
  }
  return msalInstance;
}

/**
 * OAuth scopes requested from Microsoft
 * - openid: Required for ID token
 * - profile: Display name
 * - email: Email address
 */
export const OAUTH_SCOPES = ["openid", "profile", "email"];

/**
 * Generate the Microsoft login URL for OAuth redirect
 * @param redirectUri - The callback URL after authentication
 * @param state - CSRF protection state parameter
 * @returns Authorization URL to redirect the user to
 */
export async function getAuthorizationUrl(
  redirectUri: string,
  state: string
): Promise<string> {
  const client = getMsalClient();

  const authCodeUrlRequest: AuthorizationUrlRequest = {
    scopes: OAUTH_SCOPES,
    redirectUri,
    state,
  };

  return client.getAuthCodeUrl(authCodeUrlRequest);
}

/**
 * Exchange authorization code for tokens
 * @param code - Authorization code from Microsoft callback
 * @param redirectUri - Must match the one used in getAuthorizationUrl
 * @returns Token response with ID token containing user claims
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<MicrosoftUserInfo> {
  const client = getMsalClient();

  const tokenRequest: AuthorizationCodeRequest = {
    code,
    scopes: OAUTH_SCOPES,
    redirectUri,
  };

  const response = await client.acquireTokenByCode(tokenRequest);

  // Extract user info from ID token claims
  const account = response.account;
  if (!account) {
    throw new Error("No account information in token response");
  }

  // Get the oid claim (Microsoft Object ID) - unique and stable
  // idTokenClaims is an object with claims from the ID token
  const claims = response.idTokenClaims as Record<string, unknown>;
  const oid = claims.oid as string;
  
  if (!oid) {
    throw new Error("No oid claim in ID token - cannot identify user");
  }

  return {
    microsoftId: oid,
    email: account.username || (claims.email as string) || (claims.preferred_username as string) || "",
    displayName: account.name || (claims.name as string) || null,
  };
}

/**
 * User information extracted from Microsoft ID token
 */
export interface MicrosoftUserInfo {
  microsoftId: string; // Microsoft oid claim (primary identifier)
  email: string;       // User's email address
  displayName: string | null; // Display name (may be null)
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  // Generate 32 random bytes as hex string
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if MSAL is configured (environment variables are set)
 */
export function isMsalConfigured(): boolean {
  return !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET
  );
}
