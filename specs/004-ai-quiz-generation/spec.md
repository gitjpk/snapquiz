# Feature Specification: AI Quiz Generation Assistant

**Feature Branch**: `004-ai-quiz-generation`  
**Created**: 2026-01-27  
**Status**: Draft  
**Input**: User description: "Snapquiz doit pouvoir générer lui même un quiz en lui fournissant un sujet, un document ou une URL et en précisant un nombre de questions à générer. Le host pourra ensuite modifier le temps de chaque question. Cette option sera disponible sous forme d'un assistant dans la page de création de quiz en plus de la possibilité de créer un quiz de façon classique en saisissant les questions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Quiz from Topic (Priority: P1)

A host wants to quickly create a quiz by simply providing a topic/subject. The AI assistant generates a complete quiz with multiple-choice questions based on the provided topic.

**Why this priority**: This is the core value proposition - allowing hosts to create quizzes in seconds instead of minutes. Most common use case for rapid quiz creation.

**Independent Test**: Host enters "World War II History" as topic, specifies 5 questions, clicks generate. System produces 5 multiple-choice questions with 4 options each. Host can review, edit time limits, and save the quiz.

**Acceptance Scenarios**:

1. **Given** a host is on the quiz creation page, **When** they select "AI Assistant" mode and enter a topic "French Revolution" with 5 questions, **Then** the system generates 5 relevant multiple-choice questions with correct answers marked.

2. **Given** the AI has generated questions, **When** the host reviews them, **Then** each question has a default time limit that the host can modify (10-120 seconds range).

3. **Given** the AI generates questions, **When** the host is not satisfied with a question, **Then** they can edit the question text, options, or correct answer before saving.

4. **Given** the AI is generating questions, **When** the process is in progress, **Then** the host sees a loading indicator and can cancel the operation.

---

### User Story 2 - Generate Quiz from Document (Priority: P2)

A host wants to create a quiz from existing content by uploading a document (PDF, TXT, DOCX, PPTX). The AI analyzes the document and generates questions based on its content.

**Why this priority**: Enables quiz creation from existing educational materials, course content, or training documents - high value for educators and trainers.

**Independent Test**: Host uploads a 2-page PDF about climate change, specifies 8 questions. System extracts content, generates 8 relevant questions covering key concepts from the document.

**Acceptance Scenarios**:

1. **Given** a host selects document upload mode, **When** they upload a valid PDF/TXT/DOCX/PPTX file (max 10MB), **Then** the system accepts the file and shows upload confirmation.

2. **Given** a document is uploaded, **When** the host specifies the number of questions and clicks generate, **Then** the AI creates questions based on the document content.

3. **Given** an unsupported file format is uploaded, **When** the system validates it, **Then** an appropriate error message is displayed listing supported formats.

4. **Given** a document exceeds the size limit, **When** upload is attempted, **Then** the system rejects it with a clear error message.

---

### User Story 3 - Generate Quiz from URL (Priority: P3)

A host wants to create a quiz from web content by providing a URL. The AI fetches and analyzes the webpage content to generate relevant questions.

**Why this priority**: Convenient for creating quizzes from online articles, Wikipedia pages, or educational websites without manual copy-paste.

**Independent Test**: Host enters a Wikipedia URL about "Solar System", specifies 6 questions. System fetches page content, generates 6 questions about planets, orbits, and solar system facts.

**Acceptance Scenarios**:

1. **Given** a host selects URL mode, **When** they enter a valid accessible URL, **Then** the system fetches and displays a content preview.

2. **Given** a URL is provided, **When** the host specifies question count and generates, **Then** the AI creates questions based on the webpage content.

3. **Given** an invalid or inaccessible URL is entered, **When** the system tries to fetch it, **Then** an appropriate error message is displayed (e.g., "Could not access this URL").

4. **Given** a URL points to a page with insufficient text content, **When** generation is attempted, **Then** the system warns that there may not be enough content for the requested number of questions.

---

### User Story 4 - Edit Generated Quiz Time Limits (Priority: P1)

After the AI generates questions, the host needs to customize the time limit for each question based on difficulty or content length.

**Why this priority**: Critical for quiz quality - different questions require different amounts of time. A simple recall question needs less time than a complex analysis question.

**Independent Test**: After generating a 5-question quiz, host changes Q1 from 30s to 20s, Q3 from 30s to 60s, then saves. Saved quiz reflects the custom time limits.

**Acceptance Scenarios**:

1. **Given** questions are generated, **When** the host views them in edit mode, **Then** each question displays an editable time limit field.

2. **Given** a default time limit is shown, **When** the host clicks on it, **Then** they can select from preset options (15s, 20s, 30s, 45s, 60s, 90s, 120s) or enter a custom value.

3. **Given** the host sets individual time limits, **When** they save the quiz, **Then** all custom time limits are preserved.

---

### Edge Cases

- What happens when the AI cannot generate the requested number of questions from limited source material?
  - System generates as many questions as possible and informs the host that only X questions could be created from the provided content.

- What happens when the topic is too vague or broad?
  - AI attempts generation with reasonable scope. Host can regenerate with more specific instructions.

- What happens when network/API errors occur during generation?
  - System shows friendly error message with retry option. Partial results are not lost if some questions were already generated.

- What happens when document parsing fails?
  - System informs user of parsing error and suggests trying a different format or smaller file.

- What happens when URL content is behind a paywall or login?
  - System detects access restriction and informs user that the content could not be accessed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an AI Assistant option alongside manual quiz creation on the quiz creation page.
- **FR-002**: System MUST allow hosts to generate quizzes from a text topic/subject.
- **FR-003**: System MUST allow hosts to generate quizzes from uploaded documents (PDF, TXT, DOCX, PPTX formats).
- **FR-004**: System MUST allow hosts to generate quizzes from a URL.
- **FR-005**: System MUST allow hosts to specify the desired number of questions (range: 1-20 questions).
- **FR-021**: System MUST allow hosts to select a global difficulty level (Easy, Medium, Hard) before generating questions.
- **FR-006**: System MUST generate multiple-choice questions with exactly 4 answer options each.
- **FR-007**: System MUST mark one correct answer per generated question.
- **FR-008**: System MUST assign a default time limit to each generated question (default: 30 seconds).
- **FR-009**: System MUST allow hosts to modify the time limit for each question individually (range: 10-120 seconds).
- **FR-010**: System MUST allow hosts to edit any generated question (text, options, correct answer) before saving.
- **FR-011**: System MUST show a loading/progress indicator during question generation.
- **FR-012**: System MUST allow hosts to cancel an in-progress generation.
- **FR-013**: System MUST validate uploaded documents (max 10MB, supported formats only).
- **FR-014**: System MUST validate URLs are accessible before attempting content extraction.
- **FR-015**: System MUST preserve the existing manual quiz creation workflow unchanged.
- **FR-016**: System MUST require host authentication to use the AI generation feature.
- **FR-017**: System MUST allow hosts to configure LLM settings (API endpoint, provider type: OpenAI/Anthropic, API key) in a settings page.
- **FR-018**: System MUST validate and test LLM connection when settings are saved, displaying success or error feedback.
- **FR-019**: System MUST auto-detect the model name/version from the configured API and display it to the host.
- **FR-020**: System MUST prompt host to configure LLM settings if not set when attempting to use AI generation wizard.
- **FR-022**: System MUST display token usage summary after quiz generation completes.

### Key Entities

- **GenerationSource**: Represents the input for AI generation - can be a topic (text), document (file), or URL. Contains source type, content/reference, and metadata.
- **GeneratedQuiz**: Temporary representation of AI-generated questions before being saved as a regular Quiz. Includes generated questions with default time limits.
- **Quiz**: Extended with optional `generatedFrom` metadata to track if a quiz was AI-assisted (for analytics).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Host can generate a 10-question quiz from a topic in under 30 seconds (excluding AI processing time).
- **SC-002**: AI-generated questions achieve 80%+ relevance rating when reviewed (questions directly relate to source material).
- **SC-003**: 90% of generated quizzes require fewer than 3 question edits before the host is satisfied.
- **SC-004**: Document upload and processing completes within 10 seconds for files under 5MB.
- **SC-005**: URL content extraction completes within 5 seconds for standard web pages.
- **SC-006**: Host can modify time limits for all questions and save within 1 minute of generation completing.
- **SC-007**: The AI Assistant mode is discoverable - 80% of hosts find and use it within their first quiz creation session.

## Assumptions

- Host configures their own LLM API connection (endpoint, provider type, API key) in settings.
- Document parsing libraries are available for PDF, DOCX, TXT, and PPTX extraction.
- Web scraping/fetching is permitted for the URLs users provide.
- Generated questions will be in the same language as the source material provided.

## Clarifications

### Session 2026-01-27

- Q: LLM Provider Strategy → A: User-configurable. Host provides API endpoint, provider type (Anthropic/OpenAI), and optional API key in settings. Prompt to configure if not set when launching wizard. Validate connection on save and auto-detect model.
- Q: Question Difficulty Levels → A: Global difficulty selector (Easy/Medium/Hard) for entire quiz generation.
- Q: Generation Cost Visibility → A: Post-generation summary showing tokens used after completion.
