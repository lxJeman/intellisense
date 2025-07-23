# Implementation Plan

- [x] 1. Add language detection AI method

  - Create `detectLanguageWithAI(text)` method in GroqAPIWrapper class
  - Implement simple AI prompt that returns only language name as single word
  - Add error handling with fallback to "english" on failures
  - Add 5-second timeout for language detection calls
  - _Requirements: 1.1, 1.2, 1.4, 5.1, 5.2, 5.3_

- [ ] 2. Implement language detection caching system

  - Add `languageCache` Map property to GroqAPIWrapper class
  - Create `getCachedLanguage(text)` method for cache retrieval
  - Create `setCachedLanguage(text, language)` method for cache storage
  - Implement LRU cache eviction with 100 entry limit
  - Add session-based cache expiry (no persistent storage)
  - _Requirements: 4.2, 4.3_

- [ ] 3. Add debug logging for language detection

  - Log detected language to console for each detection call
  - Log cache hits and misses for language detection
  - Log fallback usage when AI detection fails
  - Log performance metrics (detection time)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Simplify grammar correction prompt

  - Update the system prompt in `correctSingleSentence()` method
  - Remove complex multilingual instructions
  - Add simple "CRITICAL: Respond in the SAME language as the input text" instruction
  - Add "DO NOT translate - keep the original language" instruction
  - Include detected language as hint parameter
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Integrate language detection into grammar correction flow

  - Modify `correctGrammar()` method to call language detection first
  - Pass detected language to `correctSingleSentence()` calls
  - Update existing language detection to use AI method instead of regex
  - Ensure language is detected once per text input, not per sentence
  - _Requirements: 1.1, 1.5, 4.3_

- [ ] 6. Update grammar correction response format

  - Add `languageSource` field to indicate "ai" or "fallback"
  - Update `detectedLanguage` field to use AI detection result
  - Maintain backward compatibility with existing response structure
  - Update debug logging to include language detection source
  - _Requirements: 2.5, 3.2_

- [ ] 7. Add comprehensive error handling

  - Handle network errors during language detection with fallback
  - Parse invalid AI responses and extract language names
  - Handle timeout scenarios for language detection
  - Ensure grammar correction continues even if language detection fails
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Create unit tests for language detection

  - Write tests for `detectLanguageWithAI()` with various languages
  - Test error handling and fallback scenarios
  - Test caching behavior (storage, retrieval, eviction)
  - Test timeout handling
  - _Requirements: 1.1, 1.2, 1.4, 4.2_

- [ ] 9. Create integration tests for complete flow

  - Test end-to-end flow: text input → language detection → grammar correction
  - Test with mixed language content
  - Test performance impact of additional AI call
  - Verify no unwanted translations occur
  - _Requirements: 2.4, 4.1, 4.4_

- [ ] 10. Add performance monitoring and optimization
  - Implement cache hit rate tracking for language detection
  - Add performance metrics logging (detection time, total time)
  - Optimize cache size and eviction strategy based on usage patterns
  - Monitor API call frequency and cache effectiveness
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
