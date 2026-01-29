/**
 * Unified Parsing Interface
 * Reference: specs/004-ai-quiz-generation/research.md
 */

export {
  parseDocument,
  validateFile,
  truncateContent,
  type ParsedDocument,
  type ParseDocumentError,
} from "./document";

export {
  extractUrlContent,
  validateUrl,
  checkRobotsTxt,
  truncateUrlContent,
  type ExtractedContent,
  type ExtractionError,
} from "./url";
