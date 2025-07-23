/**
 * Groq API Wrapper Module
 * Clean, organized interface for all AI operations
 */

import Groq from 'groq-sdk';
import secrets from 'secrets';

class GroqAPIWrapper {
  constructor() {
    this.groq = null;
    this.isInitialized = false;
    this.requestCache = new Map();
    this.sentenceCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.lastSentenceTimer = null;
    this.rateLimitDelay = 3000; // 3 seconds
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
    } catch (error) {
      console.error('❌ Failed to initialize Groq API:', error);
    }
  }

  // ========================================
  // LANGUAGE DETECTION UTILITIES
  // ========================================

  /**
   * Get language with user override support and hybrid detection
   */
  getLanguage(text, userOverride = null) {
    // If user explicitly selected a language, use it
    if (userOverride && userOverride !== 'auto') {
      console.log(`🎯 Using user-selected language: ${userOverride}`);
      return userOverride;
    }

    // Otherwise use smart detection
    const detected = this.detectLanguageSmart(text);
    console.log(`🔍 Auto-detected language: ${detected}`);
    return detected;
  }

  /**
   * Detect language by script (non-Latin scripts are reliable)
   */
  detectByScript(text) {
    if (/[一-龯ぁ-ゔァ-ヴー々〆〤]/.test(text)) return 'japanese';
    if (/[가-힣]/.test(text)) return 'korean';
    if (/[А-Яа-яЁё]/.test(text)) return 'russian';
    if (/[ء-ي]/.test(text)) return 'arabic';
    if (/[一-龯]/.test(text)) return 'chinese';
    if (/[ă-ț]/.test(text)) return 'romanian';
    if (/[çğıöşü]/.test(text)) return 'turkish';
    return null; // No clear script detected
  }

  /**
   * Smart language detection that handles mixed Latin scripts properly
   */
  detectLanguageSmart(text) {
    if (!text || text.trim().length === 0) {
      return 'unknown';
    }

    const lowered = text.toLowerCase();

    // First check for non-Latin scripts (these are reliable)
    if (/[一-龯ぁ-ゔァ-ヴー々〆〤]/.test(text)) return 'japanese';
    if (/[가-힣]/.test(text)) return 'korean';
    if (/[А-Яа-яЁё]/.test(text)) return 'russian';
    if (/[ء-ي]/.test(text)) return 'arabic';
    if (/[一-龯]/.test(text)) return 'chinese';

    // For Latin scripts, use majority-word heuristic
    const englishStopwords = [
      'the',
      'and',
      'is',
      'are',
      'you',
      'but',
      'not',
      'a',
      'i',
      'to',
      'this',
      'that',
      'with',
      'for',
      'on',
      'at',
      'by',
      'from',
      'as',
      'an',
      'be',
      'or',
      'will',
      'can',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'shall',
      'of',
      'in',
      'it',
      'he',
      'she',
      'we',
      'they',
      'me',
      'him',
      'her',
      'us',
      'them',
    ];
    const portugueseStopwords = [
      'e',
      'é',
      'não',
      'mas',
      'eu',
      'você',
      'um',
      'uma',
      'para',
      'isso',
      'com',
      'por',
      'de',
      'da',
      'do',
      'na',
      'no',
      'em',
      'se',
      'que',
      'o',
      'a',
      'os',
      'as',
      'ele',
      'ela',
      'eles',
      'elas',
      'meu',
      'minha',
      'seu',
      'sua',
      'nosso',
      'nossa',
    ];
    const spanishStopwords = [
      'y',
      'es',
      'no',
      'pero',
      'yo',
      'tú',
      'un',
      'una',
      'para',
      'esto',
      'con',
      'por',
      'de',
      'la',
      'el',
      'en',
      'se',
      'que',
      'los',
      'las',
      'él',
      'ella',
      'ellos',
      'ellas',
      'mi',
      'tu',
      'su',
      'nuestro',
      'nuestra',
    ];
    const frenchStopwords = [
      'et',
      'est',
      'ne',
      'pas',
      'mais',
      'je',
      'tu',
      'vous',
      'un',
      'une',
      'pour',
      'ceci',
      'avec',
      'par',
      'de',
      'la',
      'le',
      'dans',
      'se',
      'que',
      'les',
      'il',
      'elle',
      'ils',
      'elles',
      'mon',
      'ton',
      'son',
      'notre',
      'votre',
    ];

    const scoreWords = (words) =>
      words.reduce((score, word) => {
        // Use word boundaries to avoid partial matches
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowered) ? score + 1 : score;
      }, 0);

    const enScore = scoreWords(englishStopwords);
    const ptScore = scoreWords(portugueseStopwords);
    const esScore = scoreWords(spanishStopwords);
    const frScore = scoreWords(frenchStopwords);

    // Find the highest score
    const scores = [
      { lang: 'english', score: enScore },
      { lang: 'portuguese', score: ptScore },
      { lang: 'spanish', score: esScore },
      { lang: 'french', score: frScore },
    ];

    scores.sort((a, b) => b.score - a.score);
    const topScore = scores[0];
    const secondScore = scores[1];

    // If the difference is too small, it's ambiguous
    if (topScore.score === 0 || topScore.score - secondScore.score <= 1) {
      return this.isMostlyEnglish(text) ? 'english' : 'unknown';
    }

    console.log(`🔍 Language detection scores:`, scores);
    console.log(
      `🎯 Detected language: ${topScore.lang} (score: ${topScore.score})`
    );

    return topScore.lang;
  }

  /**
   * Check if text is mostly English based on character distribution
   */
  isMostlyEnglish(text) {
    const enRegex = /[a-zA-Z]/g;
    const nonLatinRegex = /[^\x00-\x7F]/g;

    const enCount = (text.match(enRegex) || []).length;
    const nonLatinCount = (text.match(nonLatinRegex) || []).length;

    // If we have enough English characters and low non-Latin ratio, assume English
    return enCount > 5 && nonLatinCount / enCount < 0.2;
  }

  /**
   * Get available languages for user selection
   */
  getAvailableLanguages() {
    return [
      { code: 'auto', name: 'Auto-detect', flag: '🔍' },
      { code: 'english', name: 'English', flag: '🇺🇸' },
      { code: 'portuguese', name: 'Portuguese', flag: '🇵🇹' },
      { code: 'spanish', name: 'Spanish', flag: '🇪🇸' },
      { code: 'french', name: 'French', flag: '🇫🇷' },
      { code: 'german', name: 'German', flag: '🇩🇪' },
      { code: 'italian', name: 'Italian', flag: '🇮🇹' },
      { code: 'romanian', name: 'Romanian', flag: '🇷🇴' },
      { code: 'turkish', name: 'Turkish', flag: '🇹🇷' },
      { code: 'russian', name: 'Russian', flag: '🇷🇺' },
      { code: 'chinese', name: 'Chinese', flag: '🇨🇳' },
      { code: 'japanese', name: 'Japanese', flag: '🇯🇵' },
      { code: 'korean', name: 'Korean', flag: '🇰🇷' },
      { code: 'arabic', name: 'Arabic', flag: '🇸🇦' },
    ];
  }

  /**
   * Get language display info for UI
   */
  getLanguageInfo(languageCode) {
    const languages = this.getAvailableLanguages();
    return (
      languages.find((lang) => lang.code === languageCode) || {
        code: languageCode,
        name: languageCode,
        flag: '🌐',
      }
    );
  }

  /**
   * Enhanced prompt builder with user control options
   */
  buildCorrectionPrompt(language, options = {}) {
    const {
      allowTranslation = false,
      preserveMeaning = true,
      fixOnly = 'grammar', // 'grammar', 'spelling', 'both'
    } = options;

    let basePrompt = `You are a grammar corrector. Your ONLY job is to fix issues WITHOUT changing the meaning or structure.

Language: ${language}
${
  allowTranslation
    ? 'You MAY translate if needed to correct the sentence naturally.'
    : 'DO NOT translate. DO NOT assume a different language.'
}
${preserveMeaning ? 'Preserve the original meaning and tone exactly.' : ''}

Tasks:`;

    if (fixOnly === 'grammar' || fixOnly === 'both') {
      basePrompt += '\n- Fix grammar mistakes';
    }
    if (fixOnly === 'spelling' || fixOnly === 'both') {
      basePrompt += '\n- Fix spelling errors';
    }

    basePrompt +=
      '\n\nOnly output the corrected sentence in the same language.';

    // Language-specific warnings
    switch (language) {
      case 'english':
        basePrompt += `\n\nCRITICAL: This is ENGLISH text. Do not translate words like "senior", "resume", "actual", "fiesta" - these are English sentences with international words.`;
        break;
      case 'portuguese':
        basePrompt += `\n\nCRITICAL: This is PORTUGUESE text. Maintain Portuguese grammar and vocabulary.`;
        break;
      case 'spanish':
        basePrompt += `\n\nCRITICAL: This is SPANISH text. Maintain Spanish grammar and vocabulary.`;
        break;
      case 'french':
        basePrompt += `\n\nCRITICAL: This is FRENCH text. Maintain French grammar and vocabulary.`;
        break;
      default:
        basePrompt += `\n\nCRITICAL: Maintain the original language (${language}). Do not translate.`;
    }

    return basePrompt;
  }

  /**
   * Get appropriate system prompt based on detected language (legacy support)
   */
  getLanguageSpecificPrompt(detectedLanguage) {
    return this.buildCorrectionPrompt(detectedLanguage, {
      allowTranslation: false,
      preserveMeaning: true,
      fixOnly: 'both',
    });
  }

  // ========================================
  // TEXT PROCESSING UTILITIES
  // ========================================

  /**
   * Split text into sentences with detailed debugging
   */
  splitIntoSentences(text) {
    if (!text || text.trim().length === 0) {
      console.log('🔍 splitIntoSentences: Empty text, returning []');
      return [];
    }

    console.log('🔍 splitIntoSentences: Input text:', `"${text}"`);

    // Enhanced sentence splitting that handles various punctuation and languages
    const sentences = text
      .split(
        /(?<=[.!?])\s+(?=[A-Z\u4e00-\u9fff\u0400-\u04ff\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af])|(?<=[。！？])\s*/
      )
      .filter((sentence) => sentence.trim().length > 0)
      .map((sentence) => sentence.trim());

    console.log('🔍 splitIntoSentences: Detected sentences:');
    sentences.forEach((sentence, index) => {
      console.log(`  ${index + 1}. "${sentence}"`);

      // Check if sentence ends with punctuation
      const endsWithPunctuation = /[.!?。！？]$/.test(sentence);
      console.log(`     - Ends with punctuation: ${endsWithPunctuation}`);

      // Check sentence length
      console.log(`     - Length: ${sentence.length} characters`);
    });

    return sentences;
  }

  // ========================================
  // GRAMMAR CORRECTION
  // ========================================

  /**
   * Correct a single sentence with smart language detection and user options
   */
  async correctSingleSentence(sentence, options = {}) {
    const {
      userLanguage = null,
      allowTranslation = false,
      fixOnly = 'both',
    } = options;

    // Get the language (user override or auto-detect)
    const language = this.getLanguage(sentence, userLanguage);
    console.log(
      `🔍 Language for sentence: "${sentence.substring(
        0,
        30
      )}..." → ${language} ${
        userLanguage ? '(user selected)' : '(auto-detected)'
      }`
    );

    // Build the appropriate system prompt
    const systemPrompt = this.buildCorrectionPrompt(language, {
      allowTranslation,
      preserveMeaning: true,
      fixOnly,
    });

    const completion = await this.groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: sentence,
        },
      ],
      max_tokens: Math.min(500, sentence.length * 3),
      temperature: 0.1,
    });

    const correctedSentence =
      completion.choices[0]?.message?.content?.trim() || sentence;

    // Log if there was a change
    if (correctedSentence !== sentence) {
      console.log(`✏️ Grammar correction applied:`);
      console.log(`   Original: "${sentence}"`);
      console.log(`   Corrected: "${correctedSentence}"`);
      console.log(`   Language: ${language}`);
      console.log(`   Allow Translation: ${allowTranslation}`);
      console.log(`   Fix Only: ${fixOnly}`);
    }

    return {
      corrected: correctedSentence,
      original: sentence,
      language: language,
      hasChanges: correctedSentence !== sentence,
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  async correctSingleSentenceLegacy(sentence) {
    const result = await this.correctSingleSentence(sentence);
    return result.corrected;
  }

  /**
   * Enhanced grammar correction with user control options
   */
  async correctGrammarWithOptions(text, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Groq API not initialized');
    }

    if (!text || text.trim().length < 3) {
      return { corrected: text, suggestions: [] };
    }

    const {
      userLanguage = null,
      allowTranslation = false,
      fixOnly = 'both',
      preserveMeaning = true,
    } = options;

    try {
      console.log('🔧 Enhanced grammar correction with options:', {
        userLanguage,
        allowTranslation,
        fixOnly,
        textPreview: text.substring(0, 50) + '...',
      });

      // Split text into sentences
      const sentences = this.splitIntoSentences(text);
      console.log(`📝 Split into ${sentences.length} sentences`);

      if (sentences.length === 0) {
        return {
          corrected: text,
          original: text,
          hasChanges: false,
          detectedLanguage: 'unknown',
          userLanguage,
          options,
        };
      }

      const correctedSentences = [];
      const sentenceResults = [];
      let hasAnyChanges = false;
      let detectedLanguage = 'unknown';

      // Process each sentence with the new options
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const isLastSentence = i === sentences.length - 1;

        const correctionOptions = {
          userLanguage,
          allowTranslation,
          fixOnly,
        };

        if (isLastSentence) {
          // Apply rate limiting for last sentence
          console.log('⏱️ Applying rate limit for last sentence');

          if (this.lastSentenceTimer) {
            clearTimeout(this.lastSentenceTimer);
          }

          const result = await new Promise((resolve) => {
            this.lastSentenceTimer = setTimeout(async () => {
              try {
                const correctionResult = await this.correctSingleSentence(
                  sentence,
                  correctionOptions
                );
                resolve(correctionResult);
              } catch (error) {
                console.error('❌ Last sentence correction failed:', error);
                resolve({
                  corrected: sentence,
                  original: sentence,
                  language: 'unknown',
                  hasChanges: false,
                  error: error.message,
                });
              }
            }, this.rateLimitDelay);
          });

          correctedSentences.push(result.corrected);
          sentenceResults.push(result);
          if (result.hasChanges) hasAnyChanges = true;
          if (result.language && result.language !== 'unknown') {
            detectedLanguage = result.language;
          }
        } else {
          // Process immediately
          console.log(`🚀 Processing sentence ${i + 1}/${sentences.length}`);

          try {
            const result = await this.correctSingleSentence(
              sentence,
              correctionOptions
            );
            correctedSentences.push(result.corrected);
            sentenceResults.push(result);
            if (result.hasChanges) hasAnyChanges = true;
            if (result.language && result.language !== 'unknown') {
              detectedLanguage = result.language;
            }
          } catch (error) {
            console.error(`❌ Sentence ${i + 1} correction failed:`, error);
            correctedSentences.push(sentence);
            sentenceResults.push({
              corrected: sentence,
              original: sentence,
              language: 'unknown',
              hasChanges: false,
              error: error.message,
            });
          }
        }
      }

      // Reconstruct the text
      const correctedText = correctedSentences.join(' ');

      const result = {
        corrected: correctedText,
        original: text,
        hasChanges: hasAnyChanges,
        detectedLanguage,
        userLanguage,
        sentenceCount: sentences.length,
        sentenceResults,
        options: {
          allowTranslation,
          fixOnly,
          preserveMeaning,
        },
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      console.log(`✅ Enhanced grammar correction completed:`, {
        sentences: sentences.length,
        changes: hasAnyChanges,
        language: detectedLanguage,
        userOverride: !!userLanguage,
      });

      return result;
    } catch (error) {
      console.error('❌ Enhanced grammar correction failed:', error);
      throw error;
    }
  }

  /**
   * Main grammar correction (legacy support)
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

      // STEP 3: Process each sentence
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const isLastSentence = i === sentences.length - 1;

        if (isLastSentence) {
          // Apply 3-second rate limiting for last sentence only
          console.log('⏱️ Applying 3-second rate limit for last sentence');

          if (this.lastSentenceTimer) {
            clearTimeout(this.lastSentenceTimer);
          }

          const correctedSentence = await new Promise((resolve) => {
            this.lastSentenceTimer = setTimeout(async () => {
              try {
                const result = await this.correctSingleSentence(sentence);
                resolve(result.corrected);
              } catch (error) {
                console.error('❌ Last sentence correction failed:', error);
                resolve(sentence);
              }
            }, this.rateLimitDelay);
          });

          correctedSentences.push(correctedSentence);
          if (correctedSentence !== sentence) hasAnyChanges = true;
        } else {
          // Previous sentences: correct immediately
          console.log(
            `🚀 Immediately correcting sentence ${i + 1}/${sentences.length}`
          );

          try {
            const result = await this.correctSingleSentence(sentence);
            correctedSentences.push(result.corrected);
            if (result.corrected !== sentence) hasAnyChanges = true;
          } catch (error) {
            console.error(`❌ Sentence ${i + 1} correction failed:`, error);
            correctedSentences.push(sentence);
          }
        }
      }

      // STEP 4: Reconstruct the text
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
        `✅ Grammar correction completed (${sentences.length} sentences, changes: ${hasAnyChanges})`
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
   * Generate autocomplete suggestions with AI language detection
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
7. DO NOT translate - keep the original language`,
          },
          {
            role: 'user',
            content: `Context: ${context}
Current text: ${text}
Provide autocomplete suggestions as JSON array in the same language:`,
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
          model: 'llama3-8b-8192',
          timestamp: Date.now(),
        };
      }

      const result = {
        suggestions: [suggestion],
        original: text,
        context,
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      this.setCachedResponse(cacheKey, result);
      console.log(
        '✅ Autocomplete suggestions generated:',
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
   * Get short AI answer (ChatGPT-like responses)
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

      const completion = await this.groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant. Your task is to:
1. Provide a direct, helpful answer to the user's question or request
2. Keep responses concise but informative (2-4 sentences ideal)
3. Be conversational and friendly
4. If it's a question, answer it directly
5. If it's a statement, provide relevant insights or suggestions
6. CRITICAL: Respond in the SAME language as the input text
7. DO NOT translate - maintain the original language`,
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
        model: 'llama3-8b-8192',
        timestamp: Date.now(),
      };

      this.setCachedResponse(cacheKey, result);
      console.log('✅ Short AI answer generated');

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
    return `${type}:${text.trim().toLowerCase()}`;
  }

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
    this.sentenceCache.clear();
    console.log('🗑️ API cache cleared');
  }

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

  // ========================================
  // USER PREFERENCES & SETTINGS
  // ========================================

  /**
   * Get user preferences from storage
   */
  async getUserPreferences() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['groqUserPrefs']);
        return result.groqUserPrefs || this.getDefaultPreferences();
      } else if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('groqUserPrefs');
        return stored ? JSON.parse(stored) : this.getDefaultPreferences();
      }
      return this.getDefaultPreferences();
    } catch (error) {
      console.error('❌ Failed to get user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Save user preferences to storage
   */
  async saveUserPreferences(preferences) {
    try {
      const prefs = { ...this.getDefaultPreferences(), ...preferences };

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ groqUserPrefs: prefs });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem('groqUserPrefs', JSON.stringify(prefs));
      }

      console.log('✅ User preferences saved:', prefs);
      return prefs;
    } catch (error) {
      console.error('❌ Failed to save user preferences:', error);
      throw error;
    }
  }

  /**
   * Get default user preferences
   */
  getDefaultPreferences() {
    return {
      defaultLanguage: 'auto',
      allowTranslation: false,
      fixOnly: 'both', // 'grammar', 'spelling', 'both'
      preserveMeaning: true,
      showLanguageDetection: true,
      autoCorrectAsYouType: true,
      rateLimitDelay: 3000,
    };
  }

  /**
   * Update specific preference
   */
  async updatePreference(key, value) {
    const currentPrefs = await this.getUserPreferences();
    currentPrefs[key] = value;
    return await this.saveUserPreferences(currentPrefs);
  }

  // ========================================
  // ERROR REPORTING & FEEDBACK
  // ========================================

  /**
   * Report correction issue from user
   */
  async reportCorrectionIssue(
    originalText,
    correctedText,
    issueType,
    userFeedback = ''
  ) {
    const report = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      originalText,
      correctedText,
      issueType, // 'translation_happened', 'wrong_language', 'meaning_changed', 'other'
      userFeedback,
      detectedLanguage: this.detectLanguageSmart(originalText),
      model: 'llama3-8b-8192',
    };

    try {
      // Store locally for analysis
      const reports = await this.getCorrectionReports();
      reports.push(report);

      // Keep only last 50 reports
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50);
      }

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ groqCorrectionReports: reports });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem('groqCorrectionReports', JSON.stringify(reports));
      }

      console.log('📝 Correction issue reported:', {
        issueType,
        originalLength: originalText.length,
        correctedLength: correctedText.length,
      });

      return report;
    } catch (error) {
      console.error('❌ Failed to report correction issue:', error);
      throw error;
    }
  }

  /**
   * Get stored correction reports
   */
  async getCorrectionReports() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          'groqCorrectionReports',
        ]);
        return result.groqCorrectionReports || [];
      } else if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('groqCorrectionReports');
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to get correction reports:', error);
      return [];
    }
  }

  /**
   * Get correction statistics for improvement
   */
  async getCorrectionStats() {
    try {
      const reports = await this.getCorrectionReports();
      const stats = {
        totalReports: reports.length,
        issueTypes: {},
        languageIssues: {},
        recentReports: reports.slice(-10),
      };

      reports.forEach((report) => {
        // Count issue types
        stats.issueTypes[report.issueType] =
          (stats.issueTypes[report.issueType] || 0) + 1;

        // Count language-related issues
        if (report.detectedLanguage) {
          stats.languageIssues[report.detectedLanguage] =
            (stats.languageIssues[report.detectedLanguage] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('❌ Failed to get correction stats:', error);
      return {
        totalReports: 0,
        issueTypes: {},
        languageIssues: {},
        recentReports: [],
      };
    }
  }

  // ========================================
  // ENHANCED CORRECTION WITH USER PREFS
  // ========================================

  /**
   * Correct grammar using user preferences
   */
  async correctGrammarWithUserPrefs(text, overrideOptions = {}) {
    const userPrefs = await this.getUserPreferences();

    const options = {
      userLanguage:
        userPrefs.defaultLanguage === 'auto' ? null : userPrefs.defaultLanguage,
      allowTranslation: userPrefs.allowTranslation,
      fixOnly: userPrefs.fixOnly,
      preserveMeaning: userPrefs.preserveMeaning,
      ...overrideOptions, // Allow temporary overrides
    };

    console.log('🎯 Correcting with user preferences:', options);

    return await this.correctGrammarWithOptions(text, options);
  }

  // ========================================
  // CONFIGURATION
  // ========================================

  /**
   * Update rate limit delay from user settings
   */
  updateRateLimitDelay(delayMs) {
    this.rateLimitDelay = delayMs || 3000; // Default to 3 seconds
    console.log(`⏱️ Rate limit delay updated to: ${this.rateLimitDelay}ms`);
  }

  // ========================================
  // SYSTEM INFO
  // ========================================

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
}

export { GroqAPIWrapper };
