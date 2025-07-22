# Improved Language Detection for Grammar Correction

## Introduction

The current grammar correction system is experiencing issues with incorrect language translations due to overly complex multilingual prompts. We need to implement a two-step AI approach: first detect the language with a separate AI call, then use that information to guide the grammar correction while maintaining simplicity and accuracy.

## Requirements

### Requirement 1: Separate Language Detection AI Call

**User Story:** As a user typing in any language, I want the system to accurately detect my language before attempting grammar correction, so that corrections are made in the correct language without false translations.

#### Acceptance Criteria

1. WHEN text is submitted for grammar correction THEN the system SHALL make a separate AI call to detect the language first
2. WHEN the language detection AI is called THEN it SHALL return ONLY the language name as a single word
3. WHEN the language detection completes THEN the system SHALL log the detected language to console for debugging
4. IF the language detection fails THEN the system SHALL default to "english" and continue processing
5. WHEN the language is detected THEN it SHALL be passed as context to the grammar correction AI

### Requirement 2: Simplified Grammar Correction with Language Hint

**User Story:** As a user, I want grammar corrections to be accurate and preserve my original language, so that I don't get unwanted translations or incorrect language corrections.

#### Acceptance Criteria

1. WHEN the grammar correction AI is called THEN it SHALL receive the detected language as a hint
2. WHEN the AI prompt is constructed THEN it SHALL emphasize that the language hint might be incorrect and the AI should use its own judgment first
3. WHEN grammar correction is performed THEN the AI SHALL prioritize its own language understanding over the provided hint
4. WHEN corrections are made THEN they SHALL preserve the original language and meaning
5. IF the language hint conflicts with the AI's understanding THEN the AI SHALL trust its own analysis

### Requirement 3: Debug Logging and Monitoring

**User Story:** As a developer, I want to see what language the system detects for each text input, so that I can monitor accuracy and debug issues.

#### Acceptance Criteria

1. WHEN language detection occurs THEN the system SHALL log the detected language to console
2. WHEN grammar correction occurs THEN the system SHALL log both the detected language and whether corrections were made
3. WHEN language detection fails THEN the system SHALL log the failure and fallback language used
4. WHEN debugging is enabled THEN additional details about the AI responses SHALL be logged

### Requirement 4: Performance Optimization

**User Story:** As a user, I want grammar correction to remain fast despite the additional language detection step, so that my typing experience is not degraded.

#### Acceptance Criteria

1. WHEN language detection is performed THEN it SHALL use minimal tokens and fast processing
2. WHEN the same language is detected repeatedly THEN the system SHALL cache the language for the session
3. WHEN processing multiple sentences THEN language detection SHALL only occur once per text input
4. WHEN language detection takes too long THEN the system SHALL timeout and proceed with default language

### Requirement 5: Fallback and Error Handling

**User Story:** As a user, I want grammar correction to work even if language detection fails, so that the system remains reliable.

#### Acceptance Criteria

1. WHEN language detection fails THEN the system SHALL default to "english" and continue
2. WHEN the language detection AI returns invalid output THEN the system SHALL parse it and extract a valid language name
3. WHEN network errors occur during language detection THEN the system SHALL proceed with grammar correction using default language
4. WHEN the detected language is unsupported THEN the system SHALL proceed with "english" as fallback

## Technical Considerations

- Language detection should be a lightweight, fast AI call
- The grammar correction prompt should be simplified to reduce multilingual pressure
- Caching should be implemented to avoid repeated language detection for similar text
- Error handling must ensure the system never fails completely due to language detection issues
- Debug logging should be comprehensive but not impact performance

## Success Criteria

- Grammar corrections preserve the original language without unwanted translations
- Language detection accuracy improves user experience
- System performance remains acceptable with the additional AI call
- Debug information helps identify and resolve language detection issues
- Fallback mechanisms ensure system reliability
