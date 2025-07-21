/**
 * Request Manager Module
 * Handles debouncing, duplicate prevention, and request queuing
 */

class RequestManager {
  constructor() {
    this.debounceTimers = new Map();
    this.activeRequests = new Map();
    this.requestQueue = [];
    this.debounceDelay = 1000; // 1 second debounce for API calls
    this.maxConcurrentRequests = 3;
    this.currentRequests = 0;
  }

  /**
   * Generate unique request ID
   */
  generateRequestId(text, type, elementId) {
    return `${type}:${elementId}:${text.substring(0, 50)}`;
  }

  /**
   * Debounced API request
   */
  debouncedRequest(requestId, requestFn, delay = this.debounceDelay) {
    return new Promise((resolve, reject) => {
      // Clear existing timer for this request
      if (this.debounceTimers.has(requestId)) {
        clearTimeout(this.debounceTimers.get(requestId));
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          this.debounceTimers.delete(requestId);
          const result = await this.executeRequest(requestId, requestFn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.debounceTimers.set(requestId, timer);
    });
  }

  /**
   * Execute request with concurrency control
   */
  async executeRequest(requestId, requestFn) {
    // Check if same request is already active
    if (this.activeRequests.has(requestId)) {
      console.log('⏳ Request already active, waiting for result:', requestId);
      return await this.activeRequests.get(requestId);
    }

    // Wait if too many concurrent requests
    while (this.currentRequests >= this.maxConcurrentRequests) {
      console.log('⏸️ Too many concurrent requests, waiting...');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Execute request
    this.currentRequests++;
    const requestPromise = this.performRequest(requestFn);
    this.activeRequests.set(requestId, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.currentRequests--;
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Perform the actual request with error handling
   */
  async performRequest(requestFn) {
    const startTime = Date.now();

    try {
      const result = await requestFn();
      const duration = Date.now() - startTime;
      console.log(`⚡ Request completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Request failed after ${duration}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Grammar correction request with debouncing
   */
  async requestGrammarCorrection(text, elementId, groqAPI) {
    const requestId = this.generateRequestId(text, 'grammar', elementId);

    return this.debouncedRequest(requestId, async () => {
      return await groqAPI.correctGrammar(text);
    });
  }

  /**
   * Autocomplete request with debouncing
   */
  async requestAutocomplete(text, context, elementId, groqAPI) {
    const requestId = this.generateRequestId(
      text + context,
      'autocomplete',
      elementId
    );

    return this.debouncedRequest(
      requestId,
      async () => {
        return await groqAPI.getAutocompleteSuggestions(text, context);
      },
      500
    ); // Shorter debounce for autocomplete
  }

  /**
   * Cancel pending requests for a specific element
   */
  cancelElementRequests(elementId) {
    let cancelledCount = 0;

    for (const [requestId, timer] of this.debounceTimers.entries()) {
      if (requestId.includes(elementId)) {
        clearTimeout(timer);
        this.debounceTimers.delete(requestId);
        cancelledCount++;
      }
    }

    if (cancelledCount > 0) {
      console.log(
        `🚫 Cancelled ${cancelledCount} pending requests for element: ${elementId}`
      );
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    console.log('🚫 All pending requests cancelled');
  }

  /**
   * Get request manager statistics
   */
  getStats() {
    return {
      pendingRequests: this.debounceTimers.size,
      activeRequests: this.activeRequests.size,
      currentRequests: this.currentRequests,
      maxConcurrentRequests: this.maxConcurrentRequests,
      debounceDelay: this.debounceDelay,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config) {
    if (config.debounceDelay) this.debounceDelay = config.debounceDelay;
    if (config.maxConcurrentRequests)
      this.maxConcurrentRequests = config.maxConcurrentRequests;
    console.log('⚙️ Request manager config updated:', config);
  }
}

export { RequestManager };
