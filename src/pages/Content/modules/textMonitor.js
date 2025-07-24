/**
 * Text Monitor Module
 * Monitors user input across various text input types with debouncing
 */

class TextMonitor {
  constructor() {
    this.debounceDelay = 500; // 500ms pause detection
    this.thinkingModeDelay = 1500; // 1.5s delay for thinking mode after sentence completion
    this.debounceTimers = new Map(); // Store timers per element
    this.thinkingTimers = new Map(); // Store thinking mode timers per element
    this.activeElements = new Set(); // Track monitored elements
    this.lastTextStates = new Map(); // Track last text state per element
    this.init();
  }

  init() {
    console.log('🔍 Text Monitor initialized');
    this.setupEventListeners();
    this.observeNewElements();
  }

  /**
   * Get all text input selectors we want to monitor
   */
  getTextInputSelectors() {
    return [
      'input[type="text"]',
      'input[type="email"]',
      // 'input[type="password"]', // REMOVED: Security vulnerability - never monitor passwords
      // if needed could be enabled back
      'input[type="search"]',
      'input[type="url"]',
      'input[type="tel"]',
      'input:not([type]):not([type="password"])', // Default input type is text, exclude password
      'textarea',
      '[contenteditable="true"]',
      '[contenteditable=""]', // Empty contenteditable defaults to true
      'div[role="textbox"]',
      '[role="textbox"]',
      // Common rich editor selectors
      '.ql-editor', // Quill editor
      '.DraftEditor-editorContainer', // Draft.js
      '.notranslate', // Google Docs
      '.kix-lineview-text-block', // Google Docs
      // Add more as needed
    ];
  }

  /**
   * Setup event listeners for existing elements
   */
  setupEventListeners() {
    const selectors = this.getTextInputSelectors();
    const elements = document.querySelectorAll(selectors.join(', '));

    console.log(`📝 Found ${elements.length} text input elements to monitor`);

    elements.forEach((element) => this.attachListeners(element));
  }

  /**
   * Observe DOM for dynamically added elements
   */
  observeNewElements() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node itself matches our selectors
            const selectors = this.getTextInputSelectors();
            if (node.matches && node.matches(selectors.join(', '))) {
              this.attachListeners(node);
            }

            // Check for matching descendants
            const descendants = node.querySelectorAll?.(selectors.join(', '));
            descendants?.forEach((element) => this.attachListeners(element));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log('👀 DOM observer started for dynamic elements');
  }

  /**
   * Attach event listeners to a specific element
   */
  attachListeners(element) {
    // SECURITY CHECK: Never monitor password fields
    if (
      element.type === 'password' ||
      element.getAttribute('type') === 'password'
    ) {
      console.warn('🔒 Skipping password field for security reasons');
      return;
    }

    // Skip if already monitoring this element
    if (this.activeElements.has(element)) {
      return;
    }

    this.activeElements.add(element);

    // Create a unique identifier for this element
    const elementId = this.getElementId(element);

    console.log(`🎯 Monitoring element: ${elementId}`);

    // Listen for input events (covers typing, pasting, etc.)
    element.addEventListener('input', (event) => {
      this.handleInput(event, elementId);
    });

    // Listen for keyup events for additional coverage
    element.addEventListener('keyup', (event) => {
      this.handleInput(event, elementId);
    });

    // Listen for paste events
    element.addEventListener('paste', (event) => {
      // Delay to allow paste content to be processed
      setTimeout(() => {
        this.handleInput(event, elementId);
      }, 10);
    });
  }

  /**
   * Generate a unique identifier for an element
   */
  getElementId(element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name="${element.name}"]`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Handle input events with debouncing
   */
  handleInput(event, elementId) {
    const element = event.target;
    const currentText = this.getTextContent(element);

    // Clear existing timers for this element
    if (this.debounceTimers.has(element)) {
      clearTimeout(this.debounceTimers.get(element));
    }
    if (this.thinkingTimers.has(element)) {
      clearTimeout(this.thinkingTimers.get(element));
    }

    // Check for thinking mode (sentence completion)
    this.checkThinkingMode(element, elementId, currentText);

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.processInput(element, elementId);
      this.debounceTimers.delete(element);
    }, this.debounceDelay);

    this.debounceTimers.set(element, timer);
  }

  /**
   * Check if user is in thinking mode after completing a sentence
   */
  checkThinkingMode(element, elementId, currentText) {
    const lastText = this.lastTextStates.get(element) || '';
    this.lastTextStates.set(element, currentText);

    // Check if text ends with sentence-ending punctuation
    const trimmedText = currentText.trim();
    const endsWithPunctuation = /[.!?]\s*$/.test(trimmedText);

    // Check if user just added punctuation (text grew and now ends with punctuation)
    const justCompletedSentence =
      endsWithPunctuation &&
      trimmedText.length > lastText.trim().length &&
      trimmedText.length > 10; // Minimum sentence length

    if (justCompletedSentence) {
      console.log(
        '🧠 Sentence completed, starting thinking mode timer:',
        trimmedText.substring(-50)
      );

      // Set thinking mode timer
      const thinkingTimer = setTimeout(() => {
        this.triggerThinkingMode(element, elementId, trimmedText);
        this.thinkingTimers.delete(element);
      }, this.thinkingModeDelay);

      this.thinkingTimers.set(element, thinkingTimer);
    }
  }

  /**
   * Trigger thinking mode - request sentence continuations
   */
  triggerThinkingMode(element, elementId, completedText) {
    console.log('🧠 Thinking mode activated for:', elementId);

    // Get surrounding context (previous sentences)
    const sentences = completedText
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const context =
      sentences.length > 1 ? sentences.slice(-3, -1).join('. ') : '';

    const continuationData = {
      elementId,
      completedText,
      context,
      timestamp: Date.now(),
      elementType: element.tagName.toLowerCase(),
    };

    // Send continuation request to background script
    try {
      chrome.runtime.sendMessage(
        {
          type: 'REQUEST_SENTENCE_CONTINUATION',
          data: continuationData,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn(
              'Background script communication error:',
              chrome.runtime.lastError
            );
          } else if (response?.success) {
            console.log('✅ Continuation request sent successfully');

            // Notify UI system if available
            if (this.uiHandler) {
              this.uiHandler.handleContinuationResult(element, response.data);
            }
          }
        }
      );
    } catch (error) {
      console.warn('Failed to send continuation request:', error);
    }
  }

  /**
   * Process the input after debounce delay
   */
  processInput(element, elementId) {
    const textContent = this.getTextContent(element);
    const caretPosition = this.getCaretPosition(element);

    const inputData = {
      elementId,
      textContent,
      caretPosition,
      timestamp: Date.now(),
      elementType: element.tagName.toLowerCase(),
      elementAttributes: {
        type: element.type || null,
        name: element.name || null,
        id: element.id || null,
        className: element.className || null,
        role: element.getAttribute('role') || null,
        contenteditable: element.getAttribute('contenteditable') || null,
      },
    };

    // Console log for deliverable requirement
    console.log('📝 Text input captured:', {
      element: elementId,
      text: textContent,
      caret: caretPosition,
      length: textContent.length,
    });

    // Send to background script
    this.sendToBackground(inputData);

    // Notify UI system if available
    if (this.uiHandler) {
      this.uiHandler.handleTextInput(element, inputData);
    }
  }

  /**
   * Set UI handler for text processing
   */
  setUIHandler(uiHandler) {
    this.uiHandler = uiHandler;
    console.log('🎨 UI handler connected to TextMonitor');
  }

  /**
   * Get text content from various element types
   */
  getTextContent(element) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return element.value;
    } else if (element.contentEditable === 'true') {
      return element.textContent || element.innerText || '';
    }
    return '';
  }

  /**
   * Get caret position for various element types
   */
  getCaretPosition(element) {
    try {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        return {
          start: element.selectionStart,
          end: element.selectionEnd,
        };
      } else if (element.contentEditable === 'true') {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          return {
            start: range.startOffset,
            end: range.endOffset,
          };
        }
      }
    } catch (error) {
      console.warn('Could not get caret position:', error);
    }

    return { start: 0, end: 0 };
  }

  /**
   * Send data to background script
   */
  sendToBackground(inputData) {
    try {
      chrome.runtime.sendMessage(
        {
          type: 'TEXT_INPUT_CAPTURED',
          data: inputData,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn(
              'Background script communication error:',
              chrome.runtime.lastError
            );
          }
        }
      );
    } catch (error) {
      console.warn('Failed to send message to background:', error);
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      activeElements: this.activeElements.size,
      activeTimers: this.debounceTimers.size,
      debounceDelay: this.debounceDelay,
    };
  }
}

export { TextMonitor };
