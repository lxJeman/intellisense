/**
 * Language UI Module - Enhanced language detection and user control interface
 */
class LanguageUI {
  constructor(textUI) {
    this.textUI = textUI;
    this.activeLanguageControls = new Map();
    this.userPreferences = null;
    this.init();
  }

  async init() {
    console.log('🌐 Language UI initialized');
    await this.loadUserPreferences();
    this.injectLanguageStyles();
    this.setupGlobalKeyboardHandlers();
  }

  /**
   * Load user preferences from background script
   */
  async loadUserPreferences() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_USER_PREFERENCES',
      });

      if (response.success) {
        this.userPreferences = response.data;
        console.log('✅ User preferences loaded:', this.userPreferences);
      } else {
        // Use defaults if loading fails
        this.userPreferences = this.getDefaultPreferences();
      }
    } catch (error) {
      console.error('❌ Failed to load user preferences:', error);
      this.userPreferences = this.getDefaultPreferences();
    }
  }

  /**
   * Get default preferences
   */
  getDefaultPreferences() {
    return {
      defaultLanguage: 'auto',
      allowTranslation: false,
      fixOnly: 'both',
      preserveMeaning: true,
      showLanguageDetection: true,
      autoCorrectAsYouType: true,
      rateLimitDelay: 3000,
    };
  }

  /**
   * Inject language-specific styles
   */
  injectLanguageStyles() {
    if (document.getElementById('language-ui-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'language-ui-styles';
    styles.textContent = `
      /* Language Control Panel */
      .language-control-panel {
        position: absolute;
        background: white;
        border: 2px solid #007bff;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        min-width: 320px;
        max-width: 400px;
      }

      .language-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e9ecef;
      }

      .language-panel-title {
        font-weight: 600;
        color: #333;
        font-size: 16px;
      }

      .language-panel-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #6c757d;
        padding: 4px;
        border-radius: 4px;
      }

      .language-panel-close:hover {
        background: #f8f9fa;
        color: #333;
      }

      /* Language Detection Display */
      .language-detection-display {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 6px;
        border: 1px solid #dee2e6;
      }

      .language-flag {
        font-size: 18px;
      }

      .language-name {
        font-weight: 500;
        color: #333;
      }

      .language-confidence {
        font-size: 12px;
        color: #6c757d;
        margin-left: auto;
      }

      .language-change-btn {
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
      }

      .language-change-btn:hover {
        background: #0056b3;
      }

      /* Language Selector */
      .language-selector {
        margin-bottom: 12px;
      }

      .language-selector label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        color: #333;
      }

      .language-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 6px;
        font-size: 14px;
        background: white;
      }

      .language-select:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }

      /* Control Options */
      .language-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .language-option {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .language-option input[type="checkbox"] {
        width: 16px;
        height: 16px;
      }

      .language-option label {
        font-size: 13px;
        color: #333;
        cursor: pointer;
        flex: 1;
      }

      /* Fix Type Selector */
      .fix-type-selector {
        margin-bottom: 12px;
      }

      .fix-type-options {
        display: flex;
        gap: 8px;
        margin-top: 4px;
      }

      .fix-type-option {
        flex: 1;
        padding: 6px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        text-align: center;
        font-size: 12px;
        transition: all 0.2s;
      }

      .fix-type-option.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }

      .fix-type-option:hover:not(.active) {
        background: #f8f9fa;
      }

      /* Action Buttons */
      .language-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 8px;
        border-top: 1px solid #e9ecef;
      }

      .language-action-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .language-action-btn.primary {
        background: #28a745;
        color: white;
      }

      .language-action-btn.primary:hover {
        background: #218838;
      }

      .language-action-btn.secondary {
        background: #6c757d;
        color: white;
      }

      .language-action-btn.secondary:hover {
        background: #545b62;
      }

      /* Language Badge */
      .language-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: #e9ecef;
        border: 1px solid #ced4da;
        border-radius: 12px;
        padding: 4px 8px;
        font-size: 12px;
        color: #495057;
        cursor: pointer;
        transition: all 0.2s;
      }

      .language-badge:hover {
        background: #dee2e6;
        border-color: #adb5bd;
      }

      .language-badge.auto-detected {
        background: #d1ecf1;
        border-color: #bee5eb;
        color: #0c5460;
      }

      .language-badge.user-selected {
        background: #d4edda;
        border-color: #c3e6cb;
        color: #155724;
      }

      /* Error Reporting */
      .error-report-section {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e9ecef;
      }

      .error-report-title {
        font-size: 13px;
        font-weight: 500;
        color: #dc3545;
        margin-bottom: 8px;
      }

      .error-report-options {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .error-report-btn {
        padding: 4px 8px;
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
      }

      .error-report-btn:hover {
        background: #f1b0b7;
      }

      /* Animations */
      .language-control-panel {
        animation: slideInUp 0.3s ease;
      }

      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Mobile Responsive */
      @media (max-width: 480px) {
        .language-control-panel {
          min-width: 280px;
          max-width: 90vw;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Show language control panel for an element
   */
  async showLanguageControl(element, correctionData = null) {
    const elementId = this.textUI.getElementId(element);

    // Remove existing panel for this element
    this.hideLanguageControl(elementId);

    // Get current text and detect language
    const text = this.textUI.getElementText(element);
    const detectedLanguage = await this.detectLanguage(text);

    // Create control panel
    const panel = this.createLanguagePanel(
      element,
      detectedLanguage,
      correctionData
    );

    // Position panel
    this.positionPanel(panel, element);

    // Store reference
    this.activeLanguageControls.set(elementId, panel);

    // Auto-hide after 30 seconds
    setTimeout(() => {
      this.hideLanguageControl(elementId);
    }, 30000);

    console.log('🌐 Language control panel shown for:', elementId);
  }

  /**
   * Create language control panel
   */
  createLanguagePanel(element, detectedLanguage, correctionData) {
    const panel = document.createElement('div');
    panel.className = 'language-control-panel';

    const elementId = this.textUI.getElementId(element);
    const text = this.textUI.getElementText(element);

    // Get available languages
    const languages = this.getAvailableLanguages();
    const currentLang =
      this.userPreferences.defaultLanguage === 'auto'
        ? detectedLanguage
        : this.userPreferences.defaultLanguage;
    const langInfo = this.getLanguageInfo(currentLang);

    panel.innerHTML = `
      <div class="language-panel-header">
        <div class="language-panel-title">🌐 Language Settings</div>
        <button class="language-panel-close">×</button>
      </div>

      <div class="language-detection-display">
        <span class="language-flag">${langInfo.flag}</span>
        <span class="language-name">${langInfo.name}</span>
        <span class="language-confidence">${
          this.userPreferences.defaultLanguage === 'auto'
            ? 'Auto-detected'
            : 'User selected'
        }</span>
        <button class="language-change-btn">Change</button>
      </div>

      <div class="language-selector" style="display: none;">
        <label>Select Language:</label>
        <select class="language-select">
          ${languages
            .map(
              (lang) =>
                `<option value="${lang.code}" ${
                  lang.code === currentLang ? 'selected' : ''
                }>
              ${lang.flag} ${lang.name}
            </option>`
            )
            .join('')}
        </select>
      </div>

      <div class="language-options">
        <div class="language-option">
          <input type="checkbox" id="allow-translation-${elementId}" ${
      this.userPreferences.allowTranslation ? 'checked' : ''
    }>
          <label for="allow-translation-${elementId}">Allow translation if needed</label>
        </div>
        <div class="language-option">
          <input type="checkbox" id="preserve-meaning-${elementId}" ${
      this.userPreferences.preserveMeaning ? 'checked' : ''
    }>
          <label for="preserve-meaning-${elementId}">Always preserve original meaning</label>
        </div>
        <div class="language-option">
          <input type="checkbox" id="show-detection-${elementId}" ${
      this.userPreferences.showLanguageDetection ? 'checked' : ''
    }>
          <label for="show-detection-${elementId}">Show language detection</label>
        </div>
      </div>

      <div class="fix-type-selector">
        <label>Fix Type:</label>
        <div class="fix-type-options">
          <div class="fix-type-option ${
            this.userPreferences.fixOnly === 'grammar' ? 'active' : ''
          }" data-type="grammar">Grammar</div>
          <div class="fix-type-option ${
            this.userPreferences.fixOnly === 'spelling' ? 'active' : ''
          }" data-type="spelling">Spelling</div>
          <div class="fix-type-option ${
            this.userPreferences.fixOnly === 'both' ? 'active' : ''
          }" data-type="both">Both</div>
        </div>
      </div>

      <div class="language-actions">
        <button class="language-action-btn secondary">Cancel</button>
        <button class="language-action-btn primary">Apply & Correct</button>
      </div>

      ${correctionData ? this.createErrorReportSection(correctionData) : ''}
    `;

    // Add event listeners
    this.setupPanelEventListeners(panel, element, elementId);

    document.body.appendChild(panel);
    return panel;
  }

  /**
   * Create error reporting section
   */
  createErrorReportSection(correctionData) {
    return `
      <div class="error-report-section">
        <div class="error-report-title">⚠ Report Issue:</div>
        <div class="error-report-options">
          <button class="error-report-btn" data-issue="translation_happened">Translation occurred</button>
          <button class="error-report-btn" data-issue="wrong_language">Wrong language</button>
          <button class="error-report-btn" data-issue="meaning_changed">Meaning changed</button>
          <button class="error-report-btn" data-issue="other">Other issue</button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for panel
   */
  setupPanelEventListeners(panel, element, elementId) {
    // Close button
    panel.querySelector('.language-panel-close').onclick = () => {
      this.hideLanguageControl(elementId);
    };

    // Change language button
    panel.querySelector('.language-change-btn').onclick = () => {
      const selector = panel.querySelector('.language-selector');
      selector.style.display =
        selector.style.display === 'none' ? 'block' : 'none';
    };

    // Fix type selection
    panel.querySelectorAll('.fix-type-option').forEach((option) => {
      option.onclick = () => {
        panel
          .querySelectorAll('.fix-type-option')
          .forEach((opt) => opt.classList.remove('active'));
        option.classList.add('active');
      };
    });

    // Cancel button
    panel.querySelector('.language-actions .secondary').onclick = () => {
      this.hideLanguageControl(elementId);
    };

    // Apply button
    panel.querySelector('.language-actions .primary').onclick = async () => {
      await this.applyLanguageSettings(panel, element, elementId);
    };

    // Error reporting buttons
    panel.querySelectorAll('.error-report-btn').forEach((btn) => {
      btn.onclick = () => {
        this.reportCorrectionIssue(btn.dataset.issue, element);
      };
    });
  }

  /**
   * Apply language settings and perform correction
   */
  async applyLanguageSettings(panel, element, elementId) {
    try {
      // Get selected options
      const languageSelect = panel.querySelector('.language-select');
      const selectedLanguage = languageSelect.value;
      const allowTranslation = panel.querySelector(
        `#allow-translation-${elementId}`
      ).checked;
      const preserveMeaning = panel.querySelector(
        `#preserve-meaning-${elementId}`
      ).checked;
      const showDetection = panel.querySelector(
        `#show-detection-${elementId}`
      ).checked;
      const fixType = panel.querySelector('.fix-type-option.active').dataset
        .type;

      // Update user preferences
      const newPrefs = {
        ...this.userPreferences,
        defaultLanguage: selectedLanguage,
        allowTranslation,
        preserveMeaning,
        showLanguageDetection: showDetection,
        fixOnly: fixType,
      };

      await this.saveUserPreferences(newPrefs);

      // Get current text
      const text = this.textUI.getElementText(element);

      // Request enhanced grammar correction with new settings
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_ENHANCED_GRAMMAR_CORRECTION',
        data: {
          text,
          elementId,
          options: {
            userLanguage: selectedLanguage === 'auto' ? null : selectedLanguage,
            allowTranslation,
            fixOnly: fixType,
            preserveMeaning,
          },
        },
      });

      if (response.success) {
        // Apply correction if changes were made
        if (response.data.hasChanges) {
          this.textUI.applyAutomaticGrammarCorrection(element, response.data);
          this.showLanguageBadge(
            element,
            response.data.detectedLanguage,
            selectedLanguage !== 'auto'
          );
        }

        this.textUI.showNotification('✅ Language settings applied!');
      } else {
        this.textUI.showNotification('❌ Failed to apply corrections', 'error');
      }

      // Hide panel
      this.hideLanguageControl(elementId);
    } catch (error) {
      console.error('❌ Failed to apply language settings:', error);
      this.textUI.showNotification('❌ Error applying settings', 'error');
    }
  }

  /**
   * Show language badge on element
   */
  showLanguageBadge(element, detectedLanguage, isUserSelected) {
    const elementId = this.textUI.getElementId(element);

    // Remove existing badge
    const existingBadge = document.querySelector(
      `#language-badge-${elementId.replace(/[^a-zA-Z0-9]/g, '')}`
    );
    if (existingBadge) existingBadge.remove();

    // Create new badge
    const badge = document.createElement('div');
    badge.className = `language-badge ${
      isUserSelected ? 'user-selected' : 'auto-detected'
    }`;
    badge.id = `language-badge-${elementId.replace(/[^a-zA-Z0-9]/g, '')}`;

    const langInfo = this.getLanguageInfo(detectedLanguage);
    badge.innerHTML = `${langInfo.flag} ${langInfo.name}`;

    // Position badge
    const rect = element.getBoundingClientRect();
    badge.style.position = 'absolute';
    badge.style.left = rect.right - 80 + 'px';
    badge.style.top = rect.top - 25 + 'px';
    badge.style.zIndex = '9999';

    // Click to show language control
    badge.onclick = () => {
      this.showLanguageControl(element);
    };

    document.body.appendChild(badge);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (badge.parentNode) badge.remove();
    }, 10000);
  }

  /**
   * Position panel relative to element
   */
  positionPanel(panel, element) {
    const rect = element.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    let left = rect.left;
    let top = rect.bottom + 8;

    // Adjust if panel would go off-screen
    if (left + panelRect.width > window.innerWidth) {
      left = window.innerWidth - panelRect.width - 20;
    }

    if (top + panelRect.height > window.innerHeight) {
      top = rect.top - panelRect.height - 8;
    }

    panel.style.left = Math.max(10, left) + 'px';
    panel.style.top = Math.max(10, top) + 'px';
  }

  /**
   * Hide language control panel
   */
  hideLanguageControl(elementId) {
    const panel = this.activeLanguageControls.get(elementId);
    if (panel) {
      panel.remove();
      this.activeLanguageControls.delete(elementId);
    }
  }

  /**
   * Detect language using background script
   */
  async detectLanguage(text) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DETECT_LANGUAGE',
        data: { text },
      });

      return response.success ? response.data.language : 'english';
    } catch (error) {
      console.error('❌ Language detection failed:', error);
      return 'english';
    }
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(preferences) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_USER_PREFERENCES',
        data: preferences,
      });

      if (response.success) {
        this.userPreferences = preferences;
        console.log('✅ User preferences saved');
      }
    } catch (error) {
      console.error('❌ Failed to save preferences:', error);
    }
  }

  /**
   * Report correction issue
   */
  async reportCorrectionIssue(issueType, element) {
    try {
      const text = this.textUI.getElementText(element);

      const response = await chrome.runtime.sendMessage({
        type: 'REPORT_CORRECTION_ISSUE',
        data: {
          issueType,
          originalText: text,
          elementId: this.textUI.getElementId(element),
        },
      });

      if (response.success) {
        this.textUI.showNotification('📝 Issue reported. Thank you!');
      }
    } catch (error) {
      console.error('❌ Failed to report issue:', error);
    }
  }

  /**
   * Get available languages
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
   * Get language info by code
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
   * Setup global keyboard handlers
   */
  setupGlobalKeyboardHandlers() {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Shift + L to show language control for focused element
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === 'L'
      ) {
        const activeElement = document.activeElement;
        if (this.isTextInput(activeElement)) {
          event.preventDefault();
          this.showLanguageControl(activeElement);
        }
      }

      // Escape to hide all language controls
      if (event.key === 'Escape') {
        this.activeLanguageControls.forEach((panel, elementId) => {
          this.hideLanguageControl(elementId);
        });
      }
    });
  }

  /**
   * Check if element is a text input
   */
  isTextInput(element) {
    const textInputTypes = ['text', 'email', 'search', 'url', 'tel'];
    return (
      element.tagName === 'TEXTAREA' ||
      (element.tagName === 'INPUT' && textInputTypes.includes(element.type)) ||
      element.contentEditable === 'true'
    );
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeControls: this.activeLanguageControls.size,
      userPreferences: this.userPreferences,
      initialized: !!this.userPreferences,
    };
  }
}

export { LanguageUI };
