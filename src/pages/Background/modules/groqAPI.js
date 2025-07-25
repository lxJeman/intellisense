/**
 * Groq API Wrapper Module
 * Structured interface for AI operations with manual language selection
 */

import Groq from 'groq-sdk';
import secrets from 'secrets';

class GroqAPIWrapper {
  constructor() {
    this.groq = null;
    this.isInitialized = false;
    this.requestCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.rateLimitDelay = 3000; // 3 seconds
    this.userLanguage = 'English'; // Default language
    this.init();
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  init() {
    try {
      if (!secrets.AI_API_KEY) {
        console.error('❌ Groq API key not configured');
        return;
      }

      this.groq = new Groq({
        apiKey: secrets.AI_API_KEY,
      });

      this.isInitialized = true;
      console.log('✅ Groq API client initialized');

      // Load user's preferred language
      this.loadUserLanguage();
    } catch (error) {
      console.error('❌ Failed to initialize Groq API:', error);
    }
  }

  // ========================================
  // LANGUAGE MANAGEMENT
  // ========================================

  /**
   * Get available languages for user selection
   */
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Spanish', flag: '🇪🇸' },
      { code: 'fr', name: 'French', flag: '🇫🇷' },
      { code: 'de', name: 'German', flag: '🇩🇪' },
      { code: 'it', name: 'Italian', flag: '🇮🇹' },
      { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
      { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
      { code: 'ru', name: 'Russian', flag: '🇷🇺' },
      { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
      { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
      { code: 'ko', name: 'Korean', flag: '🇰🇷' },
      { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
      { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
      { code: 'th', name: 'Thai', flag: '🇹🇭' },
      { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
      { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
      { code: 'pl', name: 'Polish', flag: '🇵🇱' },
      { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
      { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
      { code: 'da', name: 'Danish', flag: '🇩🇰' },
      { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    ];
  }

  /**
   * Set user's preferred language
   */
  async setUserLanguage(languageCode) {
    const languages = this.getAvailableLanguages();
    const selectedLang = languages.find((lang) => lang.code === languageCode);

    if (selectedLang) {
      this.userLanguage = selectedLang.name;

      // Save to Chrome storage
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await chrome.storage.local.set({
            userSelectedLanguage: languageCode,
          });
        }
        console.log(`🌐 User language set to: ${this.userLanguage}`);
      } catch (error) {
        console.error('❌ Failed to save language preference:', error);
      }
    }
  }

  /**
   * Load user's preferred language
   */
  async loadUserLanguage() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['userSelectedLanguage']);
        if (result.userSelectedLanguage) {
          const languages = this.getAvailableLanguages();
          const selectedLang = languages.find(
            (lang) => lang.code === result.userSelectedLanguage
          );
          if (selectedLang) {
            this.userLanguage = selectedLang.name;
            console.log(`🌐 Loaded user language: ${this.userLanguage}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to load language preference:', error);
    }
  }

  /**
   * Get current user language
   */
  getCurrentLanguage() {
    return this.userLanguage;
  }

  // ========================================
  // TEXT PROCESSING UTILITIES
  // ========================================

  /**
   * Split text into sentences
   */
  splitIntoSentences(text) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Simple sentence splitting
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => sentence.trim().length > 0)
      .map((sentence) => sentence.trim());

    return sentences;
  }

  // ========================================
  // GRAMMAR CORRECTION
  // ========================================

  /**
   * Correct a single sentence using user's preferred language
   */
  async correctSingleSentence(sentence) {
    if (!this.isInitialized) {
      throw new Error('Groq API not initialized');
    }

    const completion = await this.groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: `You are a grammar correction assistant. Your task is to:
1. Fix grammar errors and spelling mistakes
2. Improve sentence structure and clarity
3. Maintain the original meaning and tone
4. Correct and translate text to ${this.userLanguage}
5. If input is in different language, translate to ${this.userLanguage}
6. Return ONLY the corrected text in ${this.userLanguage}, no explanations
7. Keep the same writing style and formality level

Target Language: ${this.userLanguage}`,
        },
        {
          role: 'user',
          content: sentence,
        },
      ],
      max_tokens: Math.min(500, sentence.length * 3),
      temperature: 0.1,
    });

    return completion.choices[0]?.message?.content?.trim() || sentence;
  }

  /**
   * Main grammar correction method
   */
  async correctGrammar(text) {
    if (!this.isInitialized) {
      throw new Error('Groq API not initialized');
    }

    if (!text || text.trim().length < 3) {
      return { corrected: text, original: text, hasChanges: false };
    }

    try {
      console.log(
        `🔧 Grammar correction for: "${text.substring(0, 50)}..." → ${
          this.userLanguage
        }`
      );

      // Split text into sentences
      const sentences = this.splitIntoSentences(text);
      console.log(`📝 Split into ${sentences.length} sentences`);

      if (sentences.length === 0) {
        return { corrected: text, original: text, hasChanges: false };
      }

      const correctedSentences = [];
      let hasAnyChanges = false;

      // Process each sentence
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];

        try {
          const correctedSentence = await this.correctSingleSentence(sentence);
          correctedSentences.push(correctedSentence);

          if (correctedSentence !== sentence) {
            hasAnyChanges = true;
            console.log(
              `✏️ Sentence corrected: "${sentence}" → "${correctedSentence}"`
            );
          }
        } catch (error) {
          console.error(`❌ Failed to correct sentence: "${sentence}"`, error);
          correctedSentences.push(sentence); // Keep original on error
        }
      }

      // Reconstruct the text
      const correctedText = correctedSentences.join(' ');

      const result = {
        corrected: correctedText,
        original: text,
        hasChanges: hasAnyChanges,
        targetLanguage: this.userLanguage,
        sentenceCount: sentences.length,
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      console.log(
        `✅ Grammar correction completed: ${
          hasAnyChanges ? 'Changes made' : 'No changes'
        } → ${this.userLanguage}`
      );
      return result;
    } catch (error) {
      console.error('❌ Grammar correction failed:', error);
      throw error;
    }
  }

  // ========================================
  // AUTOCOMPLETE
  // ========================================

  /**
   * Generate autocomplete suggestions in user's preferred language
   */
  async getAutocompleteSuggestions(text, context = '') {
    if (!this.isInitialized) {
      throw new Error('Groq API not initialized');
    }

    if (!text || text.trim().length < 2) {
      return { suggestions: [] };
    }

    const cacheKey = this.getCacheKey(text + context, 'autocomplete');
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    try {
      console.log(
        `💡 Generating autocomplete for: "${text.substring(0, 30)}..." → ${
          this.userLanguage
        }`
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are an intelligent autocomplete assistant. Your task is to:
1. Provide EXACTLY 3 different completions for the given text
2. Each completion should be concise and contextually appropriate (max 10-15 words)
3. Format each completion with HTML tags for easy parsing: <option1>completion text</option1>
4. Complete the current sentence or thought naturally with variety
5. Maintain the same writing style and tone
6. Provide completions in ${this.userLanguage}
7. If input is in different language, translate to ${this.userLanguage}
8. Make each completion unique and offer different directions/styles
9. Return ONLY the 3 tagged completions, no explanations

Format example:
<option1>first completion here</option1>
<option2>second completion here</option2>
<option3>third completion here</option3>

Target Language: ${this.userLanguage}`,
          },
          {
            role: 'user',
            content: `Context: ${context}
Current text: ${text}
Provide 3 completions in ${this.userLanguage}:`,
          },
        ],
        max_tokens: 300,
        temperature: 0.5,
      });

      const responseText =
        completion.choices[0]?.message?.content?.trim() || '';

      // Parse the HTML-tagged responses
      const suggestions = [];
      const optionRegex = /<option(\d+)>(.*?)<\/option\1>/g;
      let match;

      while ((match = optionRegex.exec(responseText)) !== null) {
        const suggestion = match[2].trim();
        if (suggestion && suggestion.length <= 100) {
          suggestions.push(suggestion);
        }
      }

      // Fallback parsing if HTML tags are not properly formatted
      if (suggestions.length === 0) {
        const lines = responseText.split('\n').filter((line) => line.trim());
        for (let i = 0; i < Math.min(3, lines.length); i++) {
          let suggestion = lines[i]
            .replace(/^["'[\]{}]/g, '')
            .replace(/["'[\]{}]$/g, '')
            .replace(
              /^(Here is|The completion is|Suggestion:|Option \d+:|\d+\.)\s*/i,
              ''
            )
            .replace(/<\/?option\d*>/g, '')
            .trim();

          if (suggestion && suggestion.length <= 100) {
            suggestions.push(suggestion);
          }
        }
      }

      // Ensure we have at least one suggestion
      if (suggestions.length === 0) {
        return {
          suggestions: [],
          original: text,
          context,
          targetLanguage: this.userLanguage,
          model: 'llama3-8b-8192',
          timestamp: Date.now(),
        };
      }

      const result = {
        suggestions: suggestions.slice(0, 3), // Ensure max 3 suggestions
        original: text,
        context,
        targetLanguage: this.userLanguage,
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      this.setCachedResponse(cacheKey, result);
      console.log(
        `✅ Autocomplete generated in ${this.userLanguage}:`,
        result.suggestions.length,
        'options'
      );

      return result;
    } catch (error) {
      console.error('❌ Autocomplete generation failed:', error);
      throw error;
    }
  }

  // ========================================
  // QUICK SPELLING CORRECTOR
  // ========================================

  /**
   * Quick spelling correction - preserves format, case, and structure
   * Only fixes spelling mistakes, doesn't change grammar or style
   */
  async quickSpellingCorrection(text) {
    if (!this.isInitialized) {
      throw new Error('Groq API not initialized');
    }

    if (!text || text.trim().length < 2) {
      return { corrected: text, original: text, hasChanges: false };
    }

    // Try Chrome's built-in spell checker first if available
    const chromeResult = await this.tryChromiumSpellCheck(text);
    if (chromeResult) {
      return chromeResult;
    }

    // Fallback to Groq API for spelling correction
    const cacheKey = this.getCacheKey(text, 'spelling');
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    try {
      console.log(
        `🔤 Quick spelling correction for: "${text.substring(0, 50)}..."`
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a spelling correction assistant. Your task is to:
1. ONLY fix spelling mistakes - do NOT change grammar, punctuation, or sentence structure
2. Preserve the original formatting, capitalization, and case exactly
3. Do NOT change the meaning, style, or tone
4. Do NOT add or remove words unless they are clearly misspelled
5. Do NOT translate - keep the same language as input
6. Return ONLY the corrected text with spelling fixes, no explanations
7. If no spelling errors are found, return the text exactly as provided

CRITICAL: Only fix obvious spelling mistakes. Preserve everything else exactly.`,
          },
          {
            role: 'user',
            content: `Fix only spelling mistakes in this text, preserve everything else exactly: ${text}`,
          },
        ],
        max_tokens: Math.min(400, text.length * 2),
        temperature: 0.1, // Very low temperature for consistent spelling fixes
      });

      const correctedText =
        completion.choices[0]?.message?.content?.trim() || text;

      // Clean up any AI response artifacts
      let cleanedText = correctedText
        .replace(
          /^(Here is the corrected text:\s*["']?|The corrected text is:\s*["']?)/i,
          ''
        )
        .replace(/["']?\s*$/, '');

      // If the correction is drastically different, likely an error - use original
      if (Math.abs(cleanedText.length - text.length) > text.length * 0.3) {
        console.log('⚠️ Spelling correction too different, using original');
        cleanedText = text;
      }

      const hasChanges = cleanedText !== text;

      const result = {
        corrected: cleanedText,
        original: text,
        hasChanges: hasChanges,
        method: 'groq',
        targetLanguage: this.userLanguage,
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      this.setCachedResponse(cacheKey, result);
      console.log(
        `✅ Quick spelling correction completed: ${
          hasChanges ? 'Changes made' : 'No changes'
        }`
      );

      return result;
    } catch (error) {
      console.error('❌ Quick spelling correction failed:', error);
      return { corrected: text, original: text, hasChanges: false };
    }
  }

  /**
   * Try to use Chrome's built-in spell checker if available
   */
  async tryChromiumSpellCheck(text) {
    try {
      // Check if Chrome spell check API is available
      if (
        typeof chrome !== 'undefined' &&
        chrome.runtime &&
        chrome.runtime.getManifest
      ) {
        // This is a placeholder for Chrome's spell check API
        // Chrome doesn't expose a direct spell check API to extensions
        // But we can simulate it or use other browser APIs if available
        console.log('🔍 Chrome spell check not directly available');
        return null;
      }
      return null;
    } catch (error) {
      console.log('🔍 Chrome spell check not available, using Groq fallback');
      return null;
    }
  }

  // ========================================
  // SENTENCE CONTINUATION
  // ========================================

  /**
   * Generate sentence continuations after user completes a sentence
   */
  async getSentenceContinuations(completedText, context = '') {
    if (!this.isInitialized) {
      throw new Error('Groq API not initialized');
    }

    if (!completedText || completedText.trim().length < 5) {
      return { continuations: [] };
    }

    const cacheKey = this.getCacheKey(completedText + context, 'continuation');
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    try {
      console.log(
        `🧠 Generating continuations for: "${completedText.substring(
          0,
          50
        )}..." → ${this.userLanguage}`
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are an intelligent writing assistant that helps users continue their thoughts. Your task is to:
1. Provide EXACTLY 3 different sentence continuations based on the completed text
2. Each continuation should be a complete sentence (15-25 words ideal)
3. Format each continuation with HTML tags: <continuation1>sentence here</continuation1>
4. Make continuations logical, coherent, and contextually appropriate
5. Offer different directions: elaboration, contrast, example, or next logical step
6. Maintain the same writing style, tone, and formality level
7. Write continuations in ${this.userLanguage}
8. If input is in different language, provide continuations in ${this.userLanguage}
9. Return ONLY the 3 tagged continuations, no explanations

Format example:
<continuation1>This elaborates on the previous point with more detail.</continuation1>
<continuation2>However, there's another perspective to consider here.</continuation2>
<continuation3>For example, we could implement this approach instead.</continuation3>

Target Language: ${this.userLanguage}`,
          },
          {
            role: 'user',
            content: `Context: ${context}
Completed text: ${completedText}
Provide 3 sentence continuations in ${this.userLanguage}:`,
          },
        ],
        max_tokens: 400,
        temperature: 0.6,
      });

      const responseText =
        completion.choices[0]?.message?.content?.trim() || '';

      // Parse the HTML-tagged responses
      const continuations = [];
      const continuationRegex = /<continuation(\d+)>(.*?)<\/continuation\1>/g;
      let match;

      while ((match = continuationRegex.exec(responseText)) !== null) {
        const continuation = match[2].trim();
        if (continuation && continuation.length <= 200) {
          continuations.push(continuation);
        }
      }

      // Fallback parsing if HTML tags are not properly formatted
      if (continuations.length === 0) {
        const lines = responseText.split('\n').filter((line) => line.trim());
        for (let i = 0; i < Math.min(3, lines.length); i++) {
          let continuation = lines[i]
            .replace(/^["'[\]{}]/g, '')
            .replace(/["'[\]{}]$/g, '')
            .replace(
              /^(Here is|The continuation is|Continuation:|Option \d+:|\d+\.)\s*/i,
              ''
            )
            .replace(/<\/?continuation\d*>/g, '')
            .trim();

          if (continuation && continuation.length <= 200) {
            continuations.push(continuation);
          }
        }
      }

      // Ensure we have at least one continuation
      if (continuations.length === 0) {
        return {
          continuations: [],
          original: completedText,
          context,
          targetLanguage: this.userLanguage,
          model: 'llama3-8b-8192',
          timestamp: Date.now(),
        };
      }

      const result = {
        continuations: continuations.slice(0, 3), // Ensure max 3 continuations
        original: completedText,
        context,
        targetLanguage: this.userLanguage,
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      this.setCachedResponse(cacheKey, result);
      console.log(
        `✅ Continuations generated in ${this.userLanguage}:`,
        result.continuations.length,
        'options'
      );

      return result;
    } catch (error) {
      console.error('❌ Sentence continuation generation failed:', error);
      throw error;
    }
  }

  // ========================================
  // SHORT AI ANSWERS
  // ========================================

  /**
   * Get short AI answer in user's preferred language
   */
  async getShortAIAnswer(text) {
    if (!this.isInitialized) {
      throw new Error('Groq API not initialized');
    }

    if (!text || text.trim().length < 3) {
      return {
        answer: 'Please provide a question or text to get an AI answer.',
      };
    }

    const cacheKey = this.getCacheKey(text, 'short_answer');
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    try {
      console.log(
        `🤖 Getting AI answer for: "${text.substring(0, 50)}..." → ${
          this.userLanguage
        }`
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant that provides concise, accurate answers. Your task is to:
1. Provide a direct, helpful answer to the user's question or request
2. Keep responses concise but informative (2-4 sentences ideal)
3. Be conversational and friendly
4. If it's a question, answer it directly
5. If it's a statement, provide relevant insights or suggestions
6. Respond in ${this.userLanguage}
7. If input is in different language, translate response to ${this.userLanguage}

Target Language: ${this.userLanguage}`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const answer =
        completion.choices[0]?.message?.content?.trim() ||
        'I apologize, but I could not generate a response for your request.';

      const result = {
        answer: answer,
        original: text,
        targetLanguage: this.userLanguage,
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      this.setCachedResponse(cacheKey, result);
      console.log(`✅ AI answer generated in ${this.userLanguage}`);

      return result;
    } catch (error) {
      console.error('❌ Short AI answer failed:', error);
      throw error;
    }
  }

  // ========================================
  // CACHE MANAGEMENT
  // ========================================

  getCacheKey(text, type = 'grammar') {
    return `${type}:${this.userLanguage}:${text.trim().toLowerCase()}`;
  }

  getCachedResponse(cacheKey) {
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(
        `📋 Using cached response for: ${cacheKey.substring(0, 50)}...`
      );
      return cached.response;
    }
    return null;
  }

  setCachedResponse(cacheKey, response) {
    this.requestCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    });

    // Clean up old cache entries (keep last 100)
    if (this.requestCache.size > 100) {
      const entries = Array.from(this.requestCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 20 entries
      for (let i = 0; i < 20; i++) {
        this.requestCache.delete(entries[i][0]);
      }
    }
  }

  clearCache() {
    this.requestCache.clear();
    console.log('🗑️ API cache cleared');
  }

  // ========================================
  // SYSTEM INFO
  // ========================================

  getStats() {
    return {
      initialized: this.isInitialized,
      cacheSize: this.requestCache.size,
      cacheExpiry: this.cacheExpiry,
      rateLimitDelay: this.rateLimitDelay,
      hasApiKey: !!secrets.AI_API_KEY,
      currentLanguage: this.userLanguage,
      availableLanguages: this.getAvailableLanguages().length,
    };
  }

  /**
   * Update rate limit delay from user settings
   */
  updateRateLimitDelay(delayMs) {
    this.rateLimitDelay = delayMs || 3000;
    console.log(`⏱️ Rate limit delay updated to: ${this.rateLimitDelay}ms`);
  }
}

export { GroqAPIWrapper };
