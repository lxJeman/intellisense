/**
 * Groq API Wrapper Module
 * Handles all interactions with Groq LLaMA 3 API
 */

import Groq from 'groq-sdk';
import secrets from 'secrets';

class GroqAPIWrapper {
  constructor() {
    this.groq = null;
    this.isInitialized = false;
    this.requestCache = new Map();
    this.sentenceCache = new Map(); // NEW: Sentence-level cache
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.lastSentenceTimer = null; // NEW: Timer for last sentence rate limiting
    this.rateLimitDelay = 3000; // NEW: 3-second rate limit for last sentence
    this.init();
  }

  /**
   * Initialize Groq client
   */
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
    } catch (error) {
      console.error('❌ Failed to initialize Groq API:', error);
    }
  }

  /**
   * Generate cache key for text input
   */
  getCacheKey(text, type = 'grammar') {
    return `${type}:${text.trim().toLowerCase()}`;
  }

  /**
   * Split text into sentences intelligently
   */
  splitIntoSentences(text) {
    if (!text || text.trim().length === 0) return [];

    // Enhanced sentence splitting that handles various punctuation and languages
    const sentences = text
      .split(
        /(?<=[.!?])\s+(?=[A-Z\u4e00-\u9fff\u0400-\u04ff\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af])|(?<=[。！？])\s*/
      )
      .filter((sentence) => sentence.trim().length > 0)
      .map((sentence) => sentence.trim());

    return sentences;
  }

  /**
   * Get cached sentence correction
   */
  getCachedSentence(sentence) {
    const cacheKey = this.getCacheKey(sentence, 'sentence');
    const cached = this.sentenceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(
        '📋 Using cached sentence:',
        sentence.substring(0, 30) + '...'
      );
      return cached.corrected;
    }
    return null;
  }

  /**
   * Cache corrected sentence
   */
  setCachedSentence(sentence, corrected) {
    const cacheKey = this.getCacheKey(sentence, 'sentence');
    this.sentenceCache.set(cacheKey, {
      corrected,
      timestamp: Date.now(),
    });

    // Clean up old sentence cache entries (keep last 200)
    if (this.sentenceCache.size > 200) {
      const entries = Array.from(this.sentenceCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 50 entries
      for (let i = 0; i < 50; i++) {
        this.sentenceCache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Check if cached response exists and is still valid
   */
  getCachedResponse(cacheKey) {
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(
        '📋 Using cached response for:',
        cacheKey.substring(0, 50) + '...'
      );
      return cached.response;
    }
    return null;
  }

  /**
   * Cache API response
   */
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

  /**
   * Detect the language of the input text
   */
  detectLanguage(text) {
    // Simple language detection based on character patterns
    const patterns = {
      chinese: /[\u4e00-\u9fff]/,
      russian: /[\u0400-\u04ff]/,
      arabic: /[\u0600-\u06ff]/,
      japanese: /[\u3040-\u309f\u30a0-\u30ff]/,
      korean: /[\uac00-\ud7af]/,
      german:
        /\b(der|die|das|und|ist|ein|eine|mit|zu|auf|für|von|dem|den|des|im|am|zum|zur)\b/i,
      french:
        /\b(le|la|les|de|du|des|et|est|un|une|avec|pour|sur|dans|par|ce|cette|qui|que)\b/i,
      spanish:
        /\b(el|la|los|las|de|del|y|es|un|una|con|para|por|en|que|se|no|te|lo)\b/i,
      italian:
        /\b(il|la|lo|gli|le|di|del|della|e|è|un|una|con|per|da|in|che|si|non|ti)\b/i,
      portuguese:
        /\b(o|a|os|as|de|do|da|dos|das|e|é|um|uma|com|para|por|em|que|se|não|te)\b/i,
      romanian:
        /\b(și|de|la|cu|în|pe|pentru|că|este|sunt|un|o|cel|cea|cei|cele|să|nu|te|se)\b/i,
    };

    // Check for non-Latin scripts first
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (
        ['chinese', 'russian', 'arabic', 'japanese', 'korean'].includes(lang)
      ) {
        if (pattern.test(text)) {
          return lang;
        }
      }
    }

    // Check for Latin-based languages
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (
        !['chinese', 'russian', 'arabic', 'japanese', 'korean'].includes(lang)
      ) {
        const matches = text.match(pattern);
        if (matches && matches.length >= 2) {
          // Need at least 2 matches for confidence
          return lang;
        }
      }
    }

    return 'english'; // Default to English
  }

  /**
   * Correct a single sentence using API
   */
  async correctSingleSentence(sentence) {
    const completion = await this.groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: `Fix grammar errors ONLY. DO NOT TRANSLATE.

INPUT LANGUAGE = OUTPUT LANGUAGE
English input → English output
Spanish input → Spanish output  
Portuguese input → Portuguese output
French input → French output

FORBIDDEN: Translation, language change
ALLOWED: Grammar fixes only

Return corrected text in SAME language as input.`,
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
   * Grammar correction using Groq LLaMA 3 with sentence-level caching and smart rate limiting
   */
  async correctGrammar(text) {
    if (!this.isInitialized) {
      throw new Error('Groq API not initialized');
    }

    if (!text || text.trim().length < 3) {
      return { corrected: text, suggestions: [] };
    }

    try {
      console.log(
        '🔧 Smart grammar correction for:',
        text.substring(0, 50) + '...'
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
        const isLastSentence = i === sentences.length - 1;

        // DISABLE CACHE - Force fresh AI responses to prevent old translations
        // let cachedCorrection = this.getCachedSentence(sentence);
        // if (cachedCorrection) {
        //   correctedSentences.push(cachedCorrection);
        //   if (cachedCorrection !== sentence) hasAnyChanges = true;
        //   continue;
        // }

        if (isLastSentence) {
          // Apply 3-second rate limiting for last sentence only
          console.log('⏱️ Applying 3-second rate limit for last sentence');

          // Clear existing timer
          if (this.lastSentenceTimer) {
            clearTimeout(this.lastSentenceTimer);
          }

          // Return a promise that resolves after rate limit
          const correctedSentence = await new Promise((resolve) => {
            this.lastSentenceTimer = setTimeout(async () => {
              try {
                const corrected = await this.correctSingleSentence(sentence);
                // DISABLE CACHING - Don't cache to prevent translation persistence
                // this.setCachedSentence(sentence, corrected);
                resolve(corrected);
              } catch (error) {
                console.error('❌ Last sentence correction failed:', error);
                resolve(sentence);
              }
            }, this.rateLimitDelay);
          });

          correctedSentences.push(correctedSentence);
          if (correctedSentence !== sentence) hasAnyChanges = true;
        } else {
          // Previous sentences: correct immediately and cache
          console.log(
            `🚀 Immediately correcting sentence ${i + 1}/${sentences.length}`
          );

          try {
            const correctedSentence = await this.correctSingleSentence(
              sentence
            );
            // DISABLE CACHING - Don't cache to prevent translation persistence
            // this.setCachedSentence(sentence, correctedSentence);
            correctedSentences.push(correctedSentence);
            if (correctedSentence !== sentence) hasAnyChanges = true;
          } catch (error) {
            console.error(`❌ Sentence ${i + 1} correction failed:`, error);
            correctedSentences.push(sentence);
          }
        }
      }

      // Reconstruct the text
      const correctedText = correctedSentences.join(' ');

      const result = {
        corrected: correctedText,
        original: text,
        hasChanges: hasAnyChanges,
        sentenceCount: sentences.length,
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      console.log(
        `✅ Smart grammar correction completed (${sentences.length} sentences, changes: ${hasAnyChanges})`
      );
      return result;
    } catch (error) {
      console.error('❌ Smart grammar correction failed:', error);
      throw error;
    }
  }

  /**
   * Generate autocomplete suggestions using Groq LLaMA 3 with multilingual support
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
        '💡 Generating autocomplete for:',
        text.substring(0, 30) + '...'
      );

      // Detect language for multilingual autocomplete
      const detectedLanguage = this.detectLanguage(text + ' ' + context);
      console.log('🌍 Autocomplete language:', detectedLanguage);

      const completion = await this.groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a multilingual intelligent autocomplete assistant. Your task is to:
1. Provide ONLY ONE best completion for the given text
2. Keep the completion concise and contextually appropriate (max 10-15 words)
3. Return ONLY the completion text, no JSON, no quotes, no explanations
4. Complete the current sentence or thought naturally
5. Maintain the same writing style and tone
6. CRITICAL: Respond in the SAME language as the input text
7. DO NOT translate - keep the original language

Detected language: ${detectedLanguage}`,
          },
          {
            role: 'user',
            content: `Context: ${context}
Current text: ${text}
Provide autocomplete suggestions as JSON array in the same language:`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3, // Slightly higher for creative suggestions
      });

      const responseText =
        completion.choices[0]?.message?.content?.trim() || '';

      // Clean up the response - remove quotes, JSON artifacts, etc.
      let suggestion = responseText
        .replace(/^["'[\]{}]/g, '') // Remove leading quotes/brackets
        .replace(/["'[\]{}]$/g, '') // Remove trailing quotes/brackets
        .replace(/^(Here is|The completion is|Suggestion:)\s*/i, '') // Remove AI response patterns
        .trim();

      // If empty or too long, skip
      if (!suggestion || suggestion.length > 100) {
        return {
          suggestions: [],
          original: text,
          context,
          detectedLanguage,
          model: 'llama3-8b-8192',
          timestamp: Date.now(),
        };
      }

      const result = {
        suggestions: [suggestion], // ONLY ONE suggestion as requested
        original: text,
        context,
        detectedLanguage: detectedLanguage,
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      this.setCachedResponse(cacheKey, result);
      console.log(
        '✅ Autocomplete suggestions generated in',
        detectedLanguage,
        ':',
        result.suggestions.length
      );

      return result;
    } catch (error) {
      console.error('❌ Autocomplete generation failed:', error);
      throw error;
    }
  }

  /**
   * Get API usage statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      cacheSize: this.requestCache.size,
      sentenceCacheSize: this.sentenceCache.size,
      cacheExpiry: this.cacheExpiry,
      rateLimitDelay: this.rateLimitDelay,
      hasApiKey: !!secrets.AI_API_KEY,
    };
  }

  /**
   * Get short AI answer (NEW FEATURE - like ChatGPT responses)
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
        '🤖 Getting short AI answer for:',
        text.substring(0, 50) + '...'
      );

      // Detect language for multilingual answers
      const detectedLanguage = this.detectLanguage(text);
      console.log('🌍 Short answer language:', detectedLanguage);

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
6. CRITICAL: Respond in the SAME language as the input text
7. DO NOT translate - maintain the original language

Detected language: ${detectedLanguage}`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 200, // Keep answers concise
        temperature: 0.7, // Slightly higher for more conversational responses
      });

      const answer =
        completion.choices[0]?.message?.content?.trim() ||
        'I apologize, but I could not generate a response for your request.';

      const result = {
        answer: answer,
        original: text,
        detectedLanguage: detectedLanguage,
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      this.setCachedResponse(cacheKey, result);
      console.log('✅ Short AI answer generated in', detectedLanguage);

      return result;
    } catch (error) {
      console.error('❌ Short AI answer failed:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.requestCache.clear();
    this.sentenceCache.clear();
    console.log('🗑️ API cache cleared');
  }

  /**
   * Force clear all caches and reset
   */
  forceClearAllCaches() {
    this.requestCache.clear();
    this.sentenceCache.clear();
    // Clear any browser storage if exists
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.includes('groq') ||
          key.includes('grammar') ||
          key.includes('sentence')
        ) {
          localStorage.removeItem(key);
        }
      });
    }
    console.log('🧹 FORCE CLEARED ALL CACHES - NO MORE TRANSLATIONS!');
  }
}

export { GroqAPIWrapper };
