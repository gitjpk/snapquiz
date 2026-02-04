import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware for host route protection
 * 
 * Protects all /host/* routes and /presenter/* routes
 * Redirects to /login if not authenticated
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and API routes
  // API routes handle their own authentication
  // Skip document upload endpoint to avoid body size issues
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/play") ||
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if this is a protected host route
  const isHostRoute = pathname.startsWith("/host") || pathname.startsWith("/presenter");
  
  if (!isHostRoute) {
    return NextResponse.next();
  }

  // Check authentication status via API
  // Always use localhost for internal API calls to avoid issues with ngrok/proxies
  const port = process.env.PORT || "3000";
  const statusUrl = `http://localhost:${port}/api/auth/status`;
  
  try {
    const response = await fetch(statusUrl, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      // API error, redirect to login as fallback
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const status = await response.json();

    // If not authenticated, redirect to login
    if (!status.isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      // Optionally preserve the original URL for redirect after login
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated, allow access
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware auth check failed:", error);
    // On error, redirect to login as fallback
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     * - API routes (they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
