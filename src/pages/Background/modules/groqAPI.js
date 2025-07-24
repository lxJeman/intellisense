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
1. Provide ONLY ONE best completion for the given text
2. Keep the completion concise and contextually appropriate (max 10-15 words)
3. Return ONLY the completion text, no JSON, no quotes, no explanations
4. Complete the current sentence or thought naturally
5. Maintain the same writing style and tone
6. Provide completion in ${this.userLanguage}
7. If input is in different language, translate to ${this.userLanguage}

Target Language: ${this.userLanguage}`,
          },
          {
            role: 'user',
            content: `Context: ${context}
Current text: ${text}
Provide completion in ${this.userLanguage}:`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const responseText =
        completion.choices[0]?.message?.content?.trim() || '';

      // Clean up the response
      let suggestion = responseText
        .replace(/^["'[\]{}]/g, '')
        .replace(/["'[\]{}]$/g, '')
        .replace(/^(Here is|The completion is|Suggestion:)\s*/i, '')
        .trim();

      if (!suggestion || suggestion.length > 100) {
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
        suggestions: [suggestion],
        original: text,
        context,
        targetLanguage: this.userLanguage,
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      this.setCachedResponse(cacheKey, result);
      console.log(
        `✅ Autocomplete generated in ${this.userLanguage}:`,
        result.suggestions.length
      );

      return result;
    } catch (error) {
      console.error('❌ Autocomplete generation failed:', error);
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
