import { TextReplacer } from './textReplacer';
import { PositioningHelper } from './positioningHelper';

/**
 * Text UI Module - Handles real-time text correction and autocomplete UI
 */
class TextUI {
  constructor(textMonitor) {
    this.textMonitor = textMonitor;
    this.textReplacer = new TextReplacer();
    this.positioningHelper = new PositioningHelper(); // NEW: Advanced positioning system
    this.activeElements = new Map();
    this.suggestionOverlays = new Map();
    this.debounceTimers = new Map();
    this.continuationTimers = new Map();
    this.processedTexts = new Map(); // Track processed texts to prevent infinite loops
    this.lastCorrectionTime = new Map(); // Track last correction time per element
    this.settings = {
      showGrammarCorrections: true,
      showAutocomplete: true,
      debounceDelay: 3000, // INCREASED to 3 seconds as requested
    };

    this.init();
  }

  init() {
    console.log('🎨 Text UI initialized');
    this.setupKeyboardHandlers();
    this.setupEnhancedKeyboardHandlers();
    this.injectStyles();
  }

  setupKeyboardHandlers() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' && this.hasActiveSuggestion(event.target)) {
        event.preventDefault();
        this.acceptSuggestion(event.target);
      } else if (event.key === 'Escape') {
        this.dismissSuggestions(event.target);
      }
    });
  }

  injectStyles() {
    if (document.getElementById('intellisense-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'intellisense-styles';
    styles.textContent = `
      /* Inline suggestion overlay - IDE style */
      .intellisense-inline-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 9999;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        padding: inherit;
        margin: inherit;
        border: inherit;
        background: transparent;
        white-space: pre-wrap;
        overflow: hidden;
        box-sizing: border-box;
      }

      /* Sentence completion box */
      .intellisense-completion-box {
        position: absolute;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        max-width: 400px;
        min-width: 200px;
        padding: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      }

      .intellisense-completion-text {
        color: #333;
        margin-bottom: 8px;
        word-wrap: break-word;
      }

      .intellisense-completion-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .intellisense-apply-btn {
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 500;
      }

      .intellisense-apply-btn:hover {
        background: #0056b3;
      }

      .intellisense-dismiss-btn {
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
      }

      .intellisense-dismiss-btn:hover {
        background: #545b62;
      }

      /* Continuation suggestion */
      .intellisense-continuation-box {
        position: absolute;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        padding: 8px 12px;
        font-family: inherit;
        font-size: 13px;
        color: #6c757d;
        max-width: 300px;
      }

      /* Notification improvements */
      .intellisense-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease;
      }

      .intellisense-notification.error {
        background: #dc3545;
      }

      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      /* Hide scrollbars on overlays */
      .intellisense-inline-overlay::-webkit-scrollbar {
        display: none;
      }
    `;

    document.head.appendChild(styles);
  }

  handleTextInput(element, inputData) {
    const elementId = this.getElementId(element);

    if (this.debounceTimers.has(elementId)) {
      clearTimeout(this.debounceTimers.get(elementId));
    }

    const timer = setTimeout(() => {
      this.processTextForUI(element, inputData);
    }, this.settings.debounceDelay);

    this.debounceTimers.set(elementId, timer);
  }

  async processTextForUI(element, inputData) {
    const text = inputData.textContent;
    const elementId = this.getElementId(element);

    // PREVENT INFINITE LOOPS - Check if we've processed this text recently
    const textHash = this.hashText(text);
    const lastProcessed = this.processedTexts.get(elementId);

    // Skip if same text processed recently
    if (lastProcessed === textHash) {
      console.log('⏭️ Skipping processing - same text already processed');
      return;
    }

    // Track processed text
    this.processedTexts.set(elementId, textHash);

    // SEQUENTIAL PROCESSING as requested:
    // 1. Grammar correction → 2. Autocomplete → 3. Sentence completion/continuation
    if (text.length > 15 && this.settings.showGrammarCorrections) {
      console.log('🔄 Starting sequential processing: Grammar correction');
      this.startSequentialProcessing(element, text, elementId);
    }
  }

  /**
   * NEW: Sequential processing as requested by user
   * 1. Grammar correction → 2. Autocomplete → 3. Sentence completion/continuation
   */
  async startSequentialProcessing(element, text, elementId) {
    try {
      // STEP 1: Grammar correction
      console.log('📝 Step 1: Grammar correction');
      await this.requestAutomaticGrammarCorrection(element, text);

      // Wait 3 seconds after grammar correction
      console.log('⏳ Waiting 3 seconds after grammar correction...');
      await this.delay(3000);

      // Get the latest text after grammar correction
      const updatedText = this.getElementText(element);

      // STEP 2: Autocomplete (for partial words)
      console.log('📝 Step 2: Autocomplete check');
      const lastWord = this.getLastPartialWord(updatedText);
      if (lastWord && lastWord.length > 2 && this.settings.showAutocomplete) {
        console.log('💡 Triggering autocomplete for partial word:', lastWord);
        await this.requestAutocomplete(element, updatedText, lastWord);

        // Wait 3 seconds after autocomplete
        console.log('⏳ Waiting 3 seconds after autocomplete...');
        await this.delay(3000);
      }

      // Get the latest text again
      const finalText = this.getElementText(element);

      // STEP 3: Sentence completion or continuation
      console.log('📝 Step 3: Sentence completion/continuation check');
      const isComplete = /[.!?]\s*$/.test(finalText.trim());

      if (isComplete && finalText.length > 10) {
        // Complete sentence - offer sentence completion
        console.log('📄 Triggering sentence completion');
        this.requestSentenceCompletion(element, finalText);
      } else if (finalText.length > 20) {
        // Incomplete sentence - offer continuation
        console.log('🔄 Triggering continuation suggestion');
        this.setupContinuationFeature(element, finalText);
      }
    } catch (error) {
      console.error('❌ Sequential processing failed:', error);
    }
  }

  /**
   * Utility function to create delays
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async requestGrammarCorrection(element, text) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_GRAMMAR_CORRECTION',
        data: { text, elementId: this.getElementId(element) },
      });

      if (response.success && response.data.hasChanges) {
        this.displayGrammarCorrection(element, response.data);
      }
    } catch (error) {
      console.error('Grammar correction failed:', error);
    }
  }

  async requestAutocomplete(element, text, partialWord) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_AUTOCOMPLETE',
        data: {
          text: partialWord,
          context: text,
          elementId: this.getElementId(element),
        },
      });

      if (response.success && response.data.suggestions.length > 0) {
        this.displayAutocompleteSuggestions(
          element,
          response.data,
          partialWord
        );
      }
    } catch (error) {
      console.error('Autocomplete failed:', error);
    }
  }

  displayGrammarCorrection(element, correctionData) {
    const elementId = this.getElementId(element);

    this.activeElements.set(elementId, {
      type: 'correction',
      data: correctionData,
      element: element,
    });

    this.showAcceptButton(element, 'Apply Fix', () => {
      this.applyGrammarCorrection(element, correctionData);
    });
  }

  displayAutocompleteSuggestions(element, suggestionData, partialWord) {
    const elementId = this.getElementId(element);

    this.activeElements.set(elementId, {
      type: 'autocomplete',
      data: suggestionData,
      partialWord: partialWord,
      element: element,
    });

    this.createSuggestionOverlay(
      element,
      suggestionData.suggestions[0],
      partialWord
    );
  }

  createSuggestionOverlay(element, suggestion, partialWord) {
    const elementId = this.getElementId(element);
    this.removeSuggestionOverlay(elementId);

    const overlay = document.createElement('div');
    overlay.className = 'intellisense-suggestion-overlay';

    const rect = element.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';

    const currentText = this.getElementText(element);
    overlay.textContent = currentText + suggestion.replace(partialWord, '');

    document.body.appendChild(overlay);
    this.suggestionOverlays.set(elementId, overlay);

    setTimeout(() => this.removeSuggestionOverlay(elementId), 10000);
  }

  applyGrammarCorrection(element, correctionData) {
    const success = this.textReplacer.replaceText(
      element,
      correctionData.corrected,
      {
        preserveSelection: true,
        addToUndo: true,
      }
    );

    if (success) {
      this.cleanupElementUI(this.getElementId(element));
      this.showNotification('Grammar corrected!');
    }
  }

  acceptSuggestion(element) {
    const elementId = this.getElementId(element);
    const activeData = this.activeElements.get(elementId);

    if (!activeData || activeData.type !== 'autocomplete') return;

    const suggestion = activeData.data.suggestions[0];
    this.textReplacer.replaceWordAtCursor(element, suggestion);

    this.cleanupElementUI(elementId);
    this.showNotification('Suggestion accepted!');
  }

  showAcceptButton(element, text, callback) {
    const button = document.createElement('button');
    button.className = 'intellisense-accept-button';
    button.textContent = text;
    button.onclick = callback;

    const rect = element.getBoundingClientRect();
    button.style.left = rect.right - 80 + 'px';
    button.style.top = rect.bottom + 5 + 'px';

    document.body.appendChild(button);
    setTimeout(() => button.remove(), 15000);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'intellisense-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  cleanupElementUI(elementId) {
    this.activeElements.delete(elementId);
    this.removeSuggestionOverlay(elementId);
    document
      .querySelectorAll('.intellisense-accept-button')
      .forEach((btn) => btn.remove());
  }

  removeSuggestionOverlay(elementId) {
    const overlay = this.suggestionOverlays.get(elementId);
    if (overlay) {
      overlay.remove();
      this.suggestionOverlays.delete(elementId);
    }
  }

  dismissSuggestions(element) {
    this.cleanupElementUI(this.getElementId(element));
  }

  hasActiveSuggestion(element) {
    const activeData = this.activeElements.get(this.getElementId(element));
    return activeData && activeData.type === 'autocomplete';
  }

  getElementId(element) {
    return element.id || element.name || element.tagName + '-' + Date.now();
  }

  getElementText(element) {
    return element.value || element.textContent || '';
  }

  getLastPartialWord(text) {
    const words = text.trim().split(/\s+/);
    const lastWord = words[words.length - 1];
    return /^[a-zA-Z]+$/.test(lastWord) ? lastWord : null;
  }

  getStats() {
    return {
      activeElements: this.activeElements.size,
      suggestionOverlays: this.suggestionOverlays.size,
      settings: this.settings,
    };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  // NEW METHODS FOR ENHANCED FUNCTIONALITY

  /**
   * AUTOMATIC GRAMMAR CORRECTION - No user input needed
   */
  async requestAutomaticGrammarCorrection(element, text) {
    try {
      // Get the latest input value
      const latestText = this.getElementText(element);

      // Only proceed if the text hasn't changed significantly
      if (Math.abs(latestText.length - text.length) > 10) {
        console.log(
          '⚠️ Text changed significantly, skipping grammar correction'
        );
        return;
      }

      // NEW: Smart sentence-level processing
      await this.smartSentenceCorrection(element, latestText);
    } catch (error) {
      console.error('Smart grammar correction failed:', error);
    }
  }

  /**
   * NEW: Smart sentence-level grammar correction
   * - Previous sentences: Corrected immediately and cached
   * - Last sentence: 3-second rate limiter applied
   */
  async smartSentenceCorrection(element, text) {
    const elementId = this.getElementId(element);

    // Split text into sentences
    const sentences = this.splitIntoSentences(text);
    if (sentences.length === 0) return;

    console.log(
      `📝 Processing ${sentences.length} sentences for smart correction`
    );

    let correctedText = '';
    let hasAnyChanges = false;

    // Process each sentence
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const isLastSentence = i === sentences.length - 1;

      if (isLastSentence) {
        // LAST SENTENCE: Apply 3-second rate limiter
        console.log('⏰ Last sentence - applying rate limiter');
        const lastSentenceTime =
          this.lastCorrectionTime.get(elementId + '_last') || 0;
        const now = Date.now();

        if (now - lastSentenceTime < 3000) {
          console.log('⏭️ Last sentence rate limited, using original');
          correctedText += sentence;
        } else {
          // Process last sentence with rate limiter
          const correctedSentence = await this.processSentenceWithCache(
            sentence,
            elementId + '_last'
          );
          correctedText += correctedSentence;
          this.lastCorrectionTime.set(elementId + '_last', now);

          if (correctedSentence !== sentence) {
            hasAnyChanges = true;
          }
        }
      } else {
        // PREVIOUS SENTENCES: Process immediately and cache
        console.log(
          `📄 Processing previous sentence ${i + 1}/${sentences.length - 1}`
        );
        const correctedSentence = await this.processSentenceWithCache(
          sentence,
          elementId + '_' + i
        );
        correctedText += correctedSentence;

        if (correctedSentence !== sentence) {
          hasAnyChanges = true;
        }
      }
    }

    // Apply corrections if any changes were made
    if (hasAnyChanges) {
      console.log('✅ Applying smart sentence corrections');
      this.applyAutomaticGrammarCorrection(element, {
        corrected: correctedText,
        original: text,
        hasChanges: true,
      });
    } else {
      console.log('✅ No corrections needed');
    }
  }

  /**
   * Process a single sentence with caching
   */
  async processSentenceWithCache(sentence, cacheKey) {
    // Skip very short sentences
    if (sentence.trim().length < 5) {
      return sentence;
    }

    // Check cache first
    const cached = this.getCachedSentenceCorrection(cacheKey, sentence);
    if (cached) {
      console.log('📋 Using cached correction for sentence');
      return cached;
    }

    try {
      // Request correction for this sentence
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_GRAMMAR_CORRECTION',
        data: {
          text: sentence.trim(),
          elementId: cacheKey,
        },
      });

      if (response.success && response.data.hasChanges) {
        const corrected = response.data.corrected;

        // Cache the correction
        this.cacheSentenceCorrection(cacheKey, sentence, corrected);

        console.log(
          '✅ Sentence corrected and cached:',
          sentence.substring(0, 30) + '...'
        );
        return corrected + (sentence.endsWith(' ') ? ' ' : '');
      } else {
        // Cache that no correction was needed
        this.cacheSentenceCorrection(cacheKey, sentence, sentence);
        return sentence;
      }
    } catch (error) {
      console.error('❌ Sentence correction failed:', error);
      return sentence; // Return original on error
    }
  }

  /**
   * Split text into sentences intelligently
   */
  splitIntoSentences(text) {
    // Simple sentence splitting - can be enhanced
    const sentences = text
      .split(/([.!?]+\s+)/)
      .filter((s) => s.trim().length > 0);

    // Recombine sentences with their punctuation
    const result = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i];
      const punctuation = sentences[i + 1] || '';
      if (sentence.trim()) {
        result.push(sentence + punctuation);
      }
    }

    return result;
  }

  /**
   * Cache sentence corrections
   */
  cacheSentenceCorrection(cacheKey, original, corrected) {
    if (!this.sentenceCache) {
      this.sentenceCache = new Map();
    }

    this.sentenceCache.set(cacheKey + ':' + original.trim(), {
      corrected: corrected,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.sentenceCache.size > 100) {
      const entries = Array.from(this.sentenceCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 20 entries
      for (let i = 0; i < 20; i++) {
        this.sentenceCache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Get cached sentence correction
   */
  getCachedSentenceCorrection(cacheKey, sentence) {
    if (!this.sentenceCache) {
      return null;
    }

    const cached = this.sentenceCache.get(cacheKey + ':' + sentence.trim());
    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 minutes cache
      return cached.corrected;
    }

    return null;
  }

  /**
   * Apply grammar correction automatically and seamlessly
   */
  applyAutomaticGrammarCorrection(element, correctionData) {
    // SANITIZE OUTPUT - Remove quotes from AI responses
    let correctedText = correctionData.corrected;

    // Remove surrounding quotes if present
    correctedText = correctedText.replace(/^["']|["']$/g, '');

    // Remove common AI response patterns
    correctedText = correctedText.replace(
      /^(Here is the corrected text:\s*["']?|The corrected text is:\s*["']?)/i,
      ''
    );
    correctedText = correctedText.replace(/["']?\s*$/, '');

    // If the "correction" is drastically different or much longer, skip it to preserve meaning
    const originalLength = correctionData.original.length;
    const correctedLength = correctedText.length;

    if (correctedLength > originalLength * 2) {
      console.log(
        '⚠️ Skipping correction - too different from original to preserve meaning'
      );
      return;
    }

    const success = this.textReplacer.replaceText(element, correctedText, {
      preserveSelection: true,
      addToUndo: true,
      animateChange: false, // No animation for seamless experience
    });

    if (success) {
      console.log(
        '✅ Grammar automatically corrected:',
        correctionData.original,
        '→',
        correctedText
      );
      // No notification - user should feel they wrote perfectly
    }
  }

  /**
   * SENTENCE COMPLETION - Show preview box with apply button
   */
  async requestSentenceCompletion(element, text) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_AUTOCOMPLETE',
        data: {
          text: text,
          context: 'sentence_completion',
          elementId: this.getElementId(element),
        },
      });

      if (response.success && response.data.suggestions.length > 0) {
        this.displaySentenceCompletion(
          element,
          response.data.suggestions[0],
          text
        );
      }
    } catch (error) {
      console.error('Sentence completion failed:', error);
    }
  }

  /**
   * Display sentence completion with proper styled box
   */
  displaySentenceCompletion(element, completion, originalText) {
    const elementId = this.getElementId(element);

    // Remove any existing completion boxes
    this.removeCompletionBox(elementId);

    // Create completion box
    const box = document.createElement('div');
    box.className = 'intellisense-completion-box';
    box.id = `completion-${elementId}`;

    // Position box near the input
    const rect = element.getBoundingClientRect();
    box.style.left = rect.left + 'px';
    box.style.top = rect.bottom + 8 + 'px';

    // Show only the completion part, not full text
    const completionText = completion.replace(originalText.trim(), '').trim();

    box.innerHTML = `
      <div class="intellisense-completion-text">${completionText}</div>
      <div class="intellisense-completion-actions">
        <button class="intellisense-dismiss-btn">Dismiss</button>
        <button class="intellisense-apply-btn">Apply</button>
      </div>
    `;

    // Add event listeners
    box.querySelector('.intellisense-apply-btn').onclick = () => {
      this.applySentenceCompletion(element, completion);
      this.removeCompletionBox(elementId);
    };

    box.querySelector('.intellisense-dismiss-btn').onclick = () => {
      this.removeCompletionBox(elementId);
    };

    document.body.appendChild(box);

    // Auto-remove after 15 seconds
    setTimeout(() => this.removeCompletionBox(elementId), 15000);

    console.log('💡 Sentence completion displayed:', completionText);
  }

  /**
   * Apply sentence completion
   */
  applySentenceCompletion(element, completion) {
    const success = this.textReplacer.replaceText(element, completion, {
      preserveSelection: true,
      addToUndo: true,
      animateChange: true,
    });

    if (success) {
      this.showNotification('✅ Sentence completed!');
      console.log('✅ Sentence completion applied');
    }
  }

  /**
   * CONTINUATION FEATURE - Suggest when user pauses but stays focused
   */
  setupContinuationFeature(element, text) {
    const elementId = this.getElementId(element);

    // Clear existing continuation timer
    if (this.continuationTimers) {
      clearTimeout(this.continuationTimers.get(elementId));
    } else {
      this.continuationTimers = new Map();
    }

    // Set up continuation timer (longer delay - 3 seconds)
    const timer = setTimeout(() => {
      if (document.activeElement === element && text.length > 20) {
        this.requestContinuation(element, text);
      }
    }, 3000);

    this.continuationTimers.set(elementId, timer);
  }

  /**
   * Request continuation suggestions
   */
  async requestContinuation(element, text) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_AUTOCOMPLETE',
        data: {
          text: text + ' ',
          context: 'continuation',
          elementId: this.getElementId(element),
        },
      });

      if (response.success && response.data.suggestions.length > 0) {
        this.displayContinuationSuggestion(
          element,
          response.data.suggestions[0]
        );
      }
    } catch (error) {
      console.error('Continuation request failed:', error);
    }
  }

  /**
   * Display continuation suggestion
   */
  displayContinuationSuggestion(element, suggestion) {
    const elementId = this.getElementId(element);

    // Remove existing continuation
    this.removeContinuationBox(elementId);

    const box = document.createElement('div');
    box.className = 'intellisense-continuation-box';
    box.id = `continuation-${elementId}`;

    // Position near input
    const rect = element.getBoundingClientRect();
    box.style.left = rect.left + 'px';
    box.style.top = rect.bottom + 5 + 'px';

    box.textContent = `💡 Continue with: "${suggestion}"`;
    box.style.cursor = 'pointer';

    // Click to apply
    box.onclick = () => {
      const currentText = this.getElementText(element);
      this.textReplacer.replaceText(element, currentText + ' ' + suggestion, {
        preserveSelection: false,
        addToUndo: true,
      });
      this.removeContinuationBox(elementId);
      this.showNotification('✅ Continuation applied!');
    };

    document.body.appendChild(box);

    // Auto-remove after 8 seconds
    setTimeout(() => this.removeContinuationBox(elementId), 8000);

    console.log('🔄 Continuation suggestion displayed:', suggestion);
  }

  /**
   * Create IDE-style inline suggestion overlay
   */
  createInlineOverlay(element, userText, suggestion) {
    const elementId = this.getElementId(element);
    this.removeInlineOverlay(elementId);

    const overlay = document.createElement('div');
    overlay.className = 'intellisense-inline-overlay';
    overlay.id = `inline-${elementId}`;

    // Copy all styles from original element
    const computedStyle = window.getComputedStyle(element);
    this.copyElementStyles(overlay, computedStyle);

    // Position overlay exactly over element
    const rect = element.getBoundingClientRect();
    overlay.style.position = 'absolute';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    // Create text content with user text invisible and suggestion visible
    overlay.innerHTML = `
      <span style="color: transparent; user-select: none;">${userText}</span>
      <span style="color: #999; user-select: none;">${suggestion}</span>
    `;

    document.body.appendChild(overlay);
    this.suggestionOverlays.set(elementId, overlay);

    // Sync scrolling
    this.syncOverlayWithElement(overlay, element);

    return overlay;
  }

  /**
   * Copy styles from element to overlay for perfect matching
   */
  copyElementStyles(overlay, computedStyle) {
    const stylesToCopy = [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'lineHeight',
      'letterSpacing',
      'textAlign',
      'textIndent',
      'textTransform',
      'padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'border',
      'borderWidth',
      'borderStyle',
      'borderColor',
      'boxSizing',
    ];

    stylesToCopy.forEach((style) => {
      overlay.style[style] = computedStyle[style];
    });
  }

  /**
   * Sync overlay scrolling with element
   */
  syncOverlayWithElement(overlay, element) {
    const syncScroll = () => {
      overlay.scrollLeft = element.scrollLeft;
      overlay.scrollTop = element.scrollTop;
    };

    element.addEventListener('scroll', syncScroll);
    element.addEventListener('input', syncScroll);

    // Update position on window resize
    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      overlay.style.left = rect.left + 'px';
      overlay.style.top = rect.top + 'px';
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
  }

  /**
   * Enhanced keyboard handlers for new features
   */
  setupEnhancedKeyboardHandlers() {
    document.addEventListener('keydown', (event) => {
      const element = event.target;
      const elementId = this.getElementId(element);

      if (event.key === 'Escape') {
        // Dismiss all suggestions and continuations
        this.removeCompletionBox(elementId);
        this.removeContinuationBox(elementId);
        this.removeInlineOverlay(elementId);
      } else if (event.key === 'Backspace') {
        // Hide suggestions on backspace
        this.removeContinuationBox(elementId);
      }
    });
  }

  // CLEANUP METHODS

  removeCompletionBox(elementId) {
    const box = document.getElementById(`completion-${elementId}`);
    if (box) box.remove();
  }

  removeContinuationBox(elementId) {
    const box = document.getElementById(`continuation-${elementId}`);
    if (box) box.remove();
  }

  removeInlineOverlay(elementId) {
    const overlay = document.getElementById(`inline-${elementId}`);
    if (overlay) overlay.remove();
  }

  /**
   * Enhanced cleanup for all UI elements
   */
  cleanupAllUI(elementId) {
    this.activeElements.delete(elementId);
    this.removeCompletionBox(elementId);
    this.removeContinuationBox(elementId);
    this.removeInlineOverlay(elementId);
    this.removeSuggestionOverlay(elementId);

    // Clear timers
    if (this.continuationTimers && this.continuationTimers.has(elementId)) {
      clearTimeout(this.continuationTimers.get(elementId));
      this.continuationTimers.delete(elementId);
    }
  }

  /**
   * Create hash of text to prevent processing same content multiple times
   */
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * FIXED: Apply sentence completion - PRESERVE original text, only ADD completion
   */
  applySentenceCompletion(element, completion) {
    const currentText = this.getElementText(element);

    // SANITIZE completion text
    let completionText = completion;
    completionText = completionText.replace(/^["']|["']$/g, '');
    completionText = completionText.replace(
      /^(Here is the|The completed text is:?\s*["']?)/i,
      ''
    );

    // Only add the NEW part, don't replace entire text
    const newPart = completionText.replace(currentText.trim(), '').trim();

    if (newPart && newPart.length > 0) {
      const finalText = currentText + ' ' + newPart;

      const success = this.textReplacer.replaceText(element, finalText, {
        preserveSelection: true,
        addToUndo: true,
        animateChange: true,
      });

      if (success) {
        this.showNotification('✅ Sentence completed!');
        console.log('✅ Sentence completion applied - added:', newPart);
      }
    }
  }

  /**
   * IMPROVED: Better positioning for mobile and desktop
   */
  getOptimalPosition(element, boxWidth = 300, boxHeight = 100) {
    const rect = element.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let left = rect.left;
    let top = rect.bottom + 8;

    // Adjust for mobile screens
    if (viewport.width < 768) {
      // On mobile, center the box and position it better
      left = Math.max(10, Math.min(left, viewport.width - boxWidth - 10));

      // If not enough space below, position above
      if (top + boxHeight > viewport.height - 50) {
        top = rect.top - boxHeight - 8;
      }
    } else {
      // Desktop positioning
      if (left + boxWidth > viewport.width - 20) {
        left = viewport.width - boxWidth - 20;
      }

      if (top + boxHeight > viewport.height - 50) {
        top = rect.top - boxHeight - 8;
      }
    }

    return { left: Math.max(10, left), top: Math.max(10, top) };
  }

  /**
   * FIXED: Display sentence completion with advanced positioning system
   */
  displaySentenceCompletion(element, completion, originalText) {
    const elementId = this.getElementId(element);
    this.removeCompletionBox(elementId);

    // Show only the completion part, not full text
    let completionText = completion.replace(originalText.trim(), '').trim();

    // Sanitize completion text
    completionText = completionText.replace(/^["']|["']$/g, '');
    completionText = completionText.replace(
      /^(Here is the|The completed text is:?\s*["']?)/i,
      ''
    );

    if (!completionText || completionText.length === 0) {
      console.log('⚠️ No meaningful completion text to display');
      return;
    }

    // Create content for the completion box
    const content = `
      <div class="intellisense-completion-text">${completionText}</div>
      <div class="intellisense-completion-actions">
        <button class="intellisense-dismiss-btn">Dismiss</button>
        <button class="intellisense-apply-btn">Apply</button>
      </div>
    `;

    // Use advanced positioning system
    const box = this.positioningHelper.createPositionedElement(
      element,
      'intellisense-completion-box',
      content,
      {
        width: 300,
        height: 80,
        zIndex: 10000,
        autoRemove: 15000,
      }
    );

    // Store reference for cleanup
    box.id = `completion-${elementId}`;

    // Add event listeners
    const applyBtn = box.querySelector('.intellisense-apply-btn');
    const dismissBtn = box.querySelector('.intellisense-dismiss-btn');

    if (applyBtn) {
      applyBtn.onclick = () => {
        this.applySentenceCompletion(element, completion);
        this.removeCompletionBox(elementId);
      };
    }

    if (dismissBtn) {
      dismissBtn.onclick = () => {
        this.removeCompletionBox(elementId);
      };
    }

    // Debug positioning
    this.positioningHelper.debugPositioning(element);

    console.log(
      '💡 Sentence completion displayed with advanced positioning:',
      completionText
    );
  }

  /**
   * FIXED: Display continuation with advanced positioning system
   */
  displayContinuationSuggestion(element, suggestion) {
    const elementId = this.getElementId(element);
    this.removeContinuationBox(elementId);

    // Sanitize suggestion
    let cleanSuggestion = suggestion;
    cleanSuggestion = cleanSuggestion.replace(/^["']|["']$/g, '');
    cleanSuggestion = cleanSuggestion.replace(
      /^(Continue with:?\s*["']?)/i,
      ''
    );

    if (!cleanSuggestion || cleanSuggestion.length === 0) {
      console.log('⚠️ No meaningful continuation suggestion to display');
      return;
    }

    // Create content for the continuation box
    const content = `💡 Continue: "${cleanSuggestion}"`;

    // Use advanced positioning system
    const box = this.positioningHelper.createPositionedElement(
      element,
      'intellisense-continuation-box',
      content,
      {
        width: 250,
        height: 40,
        zIndex: 10000,
        autoRemove: 8000,
      }
    );

    // Store reference for cleanup
    box.id = `continuation-${elementId}`;
    box.style.cursor = 'pointer';

    // Click to apply
    box.onclick = () => {
      const currentText = this.getElementText(element);
      this.textReplacer.replaceText(
        element,
        currentText + ' ' + cleanSuggestion,
        {
          preserveSelection: false,
          addToUndo: true,
        }
      );
      this.removeContinuationBox(elementId);
      this.showNotification('✅ Continuation applied!');
    };

    // Debug positioning
    this.positioningHelper.debugPositioning(element);

    console.log(
      '🔄 Continuation suggestion displayed with advanced positioning:',
      cleanSuggestion
    );
  }
}

export { TextUI };
