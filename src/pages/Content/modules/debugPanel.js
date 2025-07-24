/**
 * Debug Panel Module - Visual debugging for sentence-by-sentence processing
 */

class DebugPanel {
  constructor() {
    this.isVisible = false;
    this.panel = null;
    this.processingLog = [];
    this.maxLogEntries = 50;
    this.currentElement = null;
    this.sentenceStates = new Map();
    this.init();
  }

  init() {
    console.log('🔧 Debug Panel initialized');
    this.injectDebugStyles();
    this.setupKeyboardShortcuts();
  }

  /**
   * Inject debug panel styles
   */
  injectDebugStyles() {
    if (document.getElementById('debug-panel-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'debug-panel-styles';
    styles.textContent = `
      /* Debug Panel Container */
      .intellisense-debug-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background: #1e1e1e;
        color: #ffffff;
        border: 2px solid #007bff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(10px);
      }

      .debug-panel-header {
        background: #007bff;
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        border-bottom: 1px solid #333;
      }

      .debug-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .debug-panel-controls {
        display: flex;
        gap: 8px;
      }

      .debug-control-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
      }

      .debug-control-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .debug-control-btn.active {
        background: #28a745;
      }

      /* Debug Content */
      .debug-panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 0;
      }

      .debug-section {
        border-bottom: 1px solid #333;
      }

      .debug-section-header {
        background: #2d2d2d;
        padding: 8px 12px;
        font-weight: bold;
        color: #ffd700;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .debug-section-header:hover {
        background: #3d3d3d;
      }

      .debug-section-content {
        padding: 12px;
        max-height: 200px;
        overflow-y: auto;
      }

      .debug-section-content.collapsed {
        display: none;
      }

      /* Sentence Processing Display */
      .sentence-item {
        margin: 8px 0;
        padding: 8px;
        border-radius: 6px;
        border-left: 4px solid #666;
        background: #2a2a2a;
      }

      .sentence-item.processing {
        border-left-color: #ffd700;
        background: #3a3a2a;
        animation: pulse 1s infinite;
      }

      .sentence-item.completed {
        border-left-color: #28a745;
        background: #2a3a2a;
      }

      .sentence-item.error {
        border-left-color: #dc3545;
        background: #3a2a2a;
      }

      .sentence-item.skipped {
        border-left-color: #6c757d;
        background: #2a2a2a;
        opacity: 0.7;
      }

      .sentence-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .sentence-number {
        font-weight: bold;
        color: #007bff;
      }

      .sentence-status {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 3px;
        text-transform: uppercase;
      }

      .status-pending { background: #6c757d; }
      .status-processing { background: #ffd700; color: #000; }
      .status-completed { background: #28a745; }
      .status-error { background: #dc3545; }
      .status-skipped { background: #6c757d; }

      .sentence-text {
        margin: 4px 0;
        padding: 4px 8px;
        background: #1a1a1a;
        border-radius: 4px;
        font-family: inherit;
      }

      .sentence-original {
        color: #ff6b6b;
      }

      .sentence-corrected {
        color: #51cf66;
      }

      .sentence-timing {
        font-size: 10px;
        color: #888;
        margin-top: 4px;
      }

      /* Processing Log */
      .log-entry {
        margin: 4px 0;
        padding: 6px 8px;
        border-radius: 4px;
        font-size: 11px;
        border-left: 3px solid #666;
      }

      .log-info { border-left-color: #17a2b8; color: #17a2b8; }
      .log-success { border-left-color: #28a745; color: #28a745; }
      .log-warning { border-left-color: #ffc107; color: #ffc107; }
      .log-error { border-left-color: #dc3545; color: #dc3545; }

      .log-timestamp {
        color: #888;
        font-size: 10px;
      }

      .log-message {
        margin-left: 8px;
      }

      /* Stats Display */
      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .stat-item {
        background: #2a2a2a;
        padding: 8px;
        border-radius: 4px;
        text-align: center;
      }

      .stat-value {
        font-size: 16px;
        font-weight: bold;
        color: #007bff;
      }

      .stat-label {
        font-size: 10px;
        color: #888;
        text-transform: uppercase;
      }

      /* Element Info */
      .element-info {
        background: #2a2a2a;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .element-selector {
        color: #ffd700;
        font-weight: bold;
      }

      .element-text {
        color: #ccc;
        margin: 4px 0;
        max-height: 60px;
        overflow-y: auto;
        background: #1a1a1a;
        padding: 4px;
        border-radius: 3px;
      }

      /* Animations */
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }

      /* Scrollbar Styling */
      .debug-panel-content::-webkit-scrollbar,
      .debug-section-content::-webkit-scrollbar {
        width: 6px;
      }

      .debug-panel-content::-webkit-scrollbar-track,
      .debug-section-content::-webkit-scrollbar-track {
        background: #1a1a1a;
      }

      .debug-panel-content::-webkit-scrollbar-thumb,
      .debug-section-content::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 3px;
      }

      .debug-panel-content::-webkit-scrollbar-thumb:hover,
      .debug-section-content::-webkit-scrollbar-thumb:hover {
        background: #777;
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .intellisense-debug-panel {
          width: 90vw;
          right: 5vw;
          max-height: 70vh;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Setup keyboard shortcuts for debug panel
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+D to toggle debug panel
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        this.toggle();
      }

      // Ctrl+Shift+C to clear debug log
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        this.clearLog();
      }
    });
  }

  /**
   * Toggle debug panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Show debug panel
   */
  show() {
    if (this.panel) {
      this.panel.remove();
    }

    this.createPanel();
    this.isVisible = true;
    this.log('info', 'Debug panel opened');
    console.log(
      '🔧 Debug panel opened - Use Ctrl+Shift+D to toggle, Ctrl+Shift+C to clear'
    );
  }

  /**
   * Hide debug panel
   */
  hide() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.isVisible = false;
    this.log('info', 'Debug panel closed');
  }

  /**
   * Create debug panel DOM
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'intellisense-debug-panel';

    this.panel.innerHTML = `
      <div class="debug-panel-header">
        <div class="debug-panel-title">
          🔧 IntelliSense Debug
        </div>
        <div class="debug-panel-controls">
          <button class="debug-control-btn" id="debug-clear">Clear</button>
          <button class="debug-control-btn" id="debug-pause">Pause</button>
          <button class="debug-control-btn" id="debug-close">×</button>
        </div>
      </div>
      <div class="debug-panel-content">
        <div class="debug-section">
          <div class="debug-section-header" data-section="current">
            📝 Current Element
            <span>▼</span>
          </div>
          <div class="debug-section-content" id="debug-current-element">
            <div class="element-info">No element selected</div>
          </div>
        </div>
        
        <div class="debug-section">
          <div class="debug-section-header" data-section="sentences">
            📄 Sentence Processing
            <span>▼</span>
          </div>
          <div class="debug-section-content" id="debug-sentences">
            <div>No sentences being processed</div>
          </div>
        </div>
        
        <div class="debug-section">
          <div class="debug-section-header" data-section="stats">
            📊 Statistics
            <span>▼</span>
          </div>
          <div class="debug-section-content" id="debug-stats">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value" id="stat-elements">0</div>
                <div class="stat-label">Elements</div>
              </div>
              <div class="stat-item">
                <div class="stat-value" id="stat-sentences">0</div>
                <div class="stat-label">Sentences</div>
              </div>
              <div class="stat-item">
                <div class="stat-value" id="stat-corrections">0</div>
                <div class="stat-label">Corrections</div>
              </div>
              <div class="stat-item">
                <div class="stat-value" id="stat-cache">0</div>
                <div class="stat-label">Cache Size</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="debug-section">
          <div class="debug-section-header" data-section="log">
            📋 Processing Log
            <span>▼</span>
          </div>
          <div class="debug-section-content" id="debug-log">
            <div class="log-entry log-info">
              <span class="log-timestamp">${this.getTimestamp()}</span>
              <span class="log-message">Debug panel initialized</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.setupPanelEventListeners();
    this.updateStats();
  }

  /**
   * Setup event listeners for panel controls
   */
  setupPanelEventListeners() {
    // Close button
    this.panel.querySelector('#debug-close').onclick = () => this.hide();

    // Clear button
    this.panel.querySelector('#debug-clear').onclick = () => this.clearLog();

    // Pause button
    const pauseBtn = this.panel.querySelector('#debug-pause');
    pauseBtn.onclick = () => {
      this.isPaused = !this.isPaused;
      pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
      pauseBtn.classList.toggle('active', this.isPaused);
    };

    // Section toggles
    this.panel.querySelectorAll('.debug-section-header').forEach((header) => {
      header.onclick = () => {
        const content = header.nextElementSibling;
        const arrow = header.querySelector('span');

        content.classList.toggle('collapsed');
        arrow.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
      };
    });
  }

  /**
   * Log a message to the debug panel
   */
  log(type, message, data = null) {
    if (this.isPaused) return;

    const entry = {
      type,
      message,
      data,
      timestamp: Date.now(),
    };

    this.processingLog.unshift(entry);

    // Limit log size
    if (this.processingLog.length > this.maxLogEntries) {
      this.processingLog = this.processingLog.slice(0, this.maxLogEntries);
    }

    // Update UI if panel is visible
    if (this.isVisible && this.panel) {
      this.updateLogDisplay();
    }

    // Also log to console with emoji
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };
    console.log(`${emoji[type] || '📝'} [Debug] ${message}`, data || '');
  }

  /**
   * Update log display in panel
   */
  updateLogDisplay() {
    const logContainer = this.panel.querySelector('#debug-log');
    if (!logContainer) return;

    logContainer.innerHTML = this.processingLog
      .map(
        (entry) => `
      <div class="log-entry log-${entry.type}">
        <span class="log-timestamp">${this.formatTimestamp(
          entry.timestamp
        )}</span>
        <span class="log-message">${entry.message}</span>
        ${
          entry.data
            ? `<div style="margin-left: 16px; font-size: 10px; color: #888;">${JSON.stringify(
                entry.data,
                null,
                2
              )}</div>`
            : ''
        }
      </div>
    `
      )
      .join('');

    // Auto-scroll to top
    logContainer.scrollTop = 0;
  }

  /**
   * Start tracking sentence processing for an element
   */
  startSentenceProcessing(element, sentences) {
    const elementId = this.getElementId(element);
    this.currentElement = element;

    this.sentenceStates.set(elementId, {
      element,
      sentences: sentences.map((sentence, index) => ({
        id: index,
        text: sentence,
        status: 'pending',
        original: sentence,
        corrected: null,
        startTime: null,
        endTime: null,
        error: null,
      })),
      startTime: Date.now(),
      totalSentences: sentences.length,
    });

    this.log('info', `Started processing ${sentences.length} sentences`, {
      elementId,
      sentences: sentences.length,
    });

    this.updateCurrentElementDisplay();
    this.updateSentenceDisplay(elementId);
  }

  /**
   * Update sentence status
   */
  updateSentenceStatus(elementId, sentenceIndex, status, data = {}) {
    const state = this.sentenceStates.get(elementId);
    if (!state || !state.sentences[sentenceIndex]) return;

    const sentence = state.sentences[sentenceIndex];
    sentence.status = status;

    if (status === 'processing') {
      sentence.startTime = Date.now();
    } else if (status === 'completed' || status === 'error') {
      sentence.endTime = Date.now();
    }

    if (data.corrected) {
      sentence.corrected = data.corrected;
    }

    if (data.error) {
      sentence.error = data.error;
    }

    this.log(
      status === 'error' ? 'error' : 'info',
      `Sentence ${sentenceIndex + 1}: ${status}`,
      {
        original: sentence.text.substring(0, 50) + '...',
        corrected: sentence.corrected?.substring(0, 50) + '...' || null,
        timing: sentence.endTime
          ? `${sentence.endTime - sentence.startTime}ms`
          : null,
      }
    );

    if (this.isVisible) {
      this.updateSentenceDisplay(elementId);
    }
  }

  /**
   * Update current element display
   */
  updateCurrentElementDisplay() {
    if (!this.isVisible || !this.panel || !this.currentElement) return;

    const container = this.panel.querySelector('#debug-current-element');
    const elementId = this.getElementId(this.currentElement);
    const text = this.getElementText(this.currentElement);

    container.innerHTML = `
      <div class="element-info">
        <div class="element-selector">${elementId}</div>
        <div class="element-text">${text || 'No text'}</div>
        <div style="font-size: 10px; color: #888; margin-top: 4px;">
          Type: ${this.currentElement.tagName.toLowerCase()} | 
          Length: ${text.length} chars
        </div>
      </div>
    `;
  }

  /**
   * Update sentence processing display
   */
  updateSentenceDisplay(elementId) {
    if (!this.isVisible || !this.panel) return;

    const container = this.panel.querySelector('#debug-sentences');
    const state = this.sentenceStates.get(elementId);

    if (!state) {
      container.innerHTML = '<div>No sentences being processed</div>';
      return;
    }

    container.innerHTML = state.sentences
      .map(
        (sentence, index) => `
      <div class="sentence-item ${sentence.status}">
        <div class="sentence-header">
          <span class="sentence-number">Sentence ${index + 1}</span>
          <span class="sentence-status status-${sentence.status}">${
          sentence.status
        }</span>
        </div>
        <div class="sentence-text sentence-original">
          📝 Original: "${sentence.text}"
        </div>
        ${
          sentence.corrected
            ? `
          <div class="sentence-text sentence-corrected">
            ✅ Corrected: "${sentence.corrected}"
          </div>
        `
            : ''
        }
        ${
          sentence.error
            ? `
          <div class="sentence-text" style="color: #ff6b6b;">
            ❌ Error: ${sentence.error}
          </div>
        `
            : ''
        }
        <div class="sentence-timing">
          ${
            sentence.startTime
              ? `Started: ${this.formatTimestamp(sentence.startTime)}`
              : ''
          }
          ${
            sentence.endTime
              ? ` | Duration: ${sentence.endTime - sentence.startTime}ms`
              : ''
          }
        </div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Update statistics display
   */
  updateStats() {
    if (!this.isVisible || !this.panel) return;

    // Get stats from various modules
    const stats = {
      elements: window.textMonitor?.getStats()?.activeElements || 0,
      sentences: Array.from(this.sentenceStates.values()).reduce(
        (sum, state) => sum + state.totalSentences,
        0
      ),
      corrections: this.processingLog.filter(
        (entry) => entry.type === 'success'
      ).length,
      cache: window.textUI?.sentenceCache?.size || 0,
    };

    this.panel.querySelector('#stat-elements').textContent = stats.elements;
    this.panel.querySelector('#stat-sentences').textContent = stats.sentences;
    this.panel.querySelector('#stat-corrections').textContent =
      stats.corrections;
    this.panel.querySelector('#stat-cache').textContent = stats.cache;
  }

  /**
   * Clear processing log
   */
  clearLog() {
    this.processingLog = [];
    this.sentenceStates.clear();

    if (this.isVisible && this.panel) {
      this.updateLogDisplay();
      this.updateSentenceDisplay(null);
      this.updateStats();
    }

    this.log('info', 'Debug log cleared');
  }

  /**
   * Helper methods
   */
  getElementId(element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name="${element.name}"]`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  getElementText(element) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return element.value;
    } else if (element.contentEditable === 'true') {
      return element.textContent || element.innerText || '';
    }
    return '';
  }

  getTimestamp() {
    return new Date().toLocaleTimeString();
  }

  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }

  /**
   * Get debug panel statistics
   */
  getStats() {
    return {
      isVisible: this.isVisible,
      logEntries: this.processingLog.length,
      activeElements: this.sentenceStates.size,
      isPaused: this.isPaused || false,
    };
  }
}

export { DebugPanel };
