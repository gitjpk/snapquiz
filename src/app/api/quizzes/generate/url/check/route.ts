/**
 * URL Check Endpoint - Validate and Preview URL Content
 * Reference: specs/004-ai-quiz-generation/spec.md (US3)
 */

import { NextRequest, NextResponse } from "next/server";
import { extractUrlContent, validateUrl } from "@/lib/parsing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    const validationError = validateUrl(url);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    // Extract content (this also checks robots.txt)
    const result = await extractUrlContent(url);

    if ("code" in result) {
      // Extraction error
      const statusCodes: Record<string, number> = {
        BLOCKED: 403,
        TIMEOUT: 504,
        NO_CONTENT: 422,
        FETCH_ERROR: 502,
        INVALID_URL: 400,
      };

      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: statusCodes[result.code] || 500 }
      );
    }

    // Success - return preview info
    return NextResponse.json({
      title: result.title,
      wordCount: result.wordCount,
      excerpt: result.excerpt,
    });
  } catch (error) {
    console.error("URL check error:", error);
    return NextResponse.json(
      { error: "Failed to check URL" },
      { status: 500 }
    );
  }
}
