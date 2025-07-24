/**
 * Full Settings Page JavaScript
 * Handles all settings functionality in a dedicated tab
 */

// Global state
let settings = {
  grammarCorrection: true,
  sentenceCompletion: true,
  continuation: true,
  shortAIAnswer: false,
  multilingual: true,
  debounceDelay: 3000,
  debugMode: false,
  experimentalFeatures: false,
};

let stats = null;
let availableLanguages = [];
let selectedLanguage = 'en';
let loading = false;

// DOM Elements
let elements = {};

// Initialize settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Settings page initialized');

  // Get DOM elements
  initializeElements();

  // Setup event listeners
  setupEventListeners();

  // Load initial data
  await loadInitialData();

  // Update UI
  updateUI();
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
  elements = {
    // Checkboxes
    grammarCorrection: document.getElementById('grammarCorrection'),
    sentenceCompletion: document.getElementById('sentenceCompletion'),
    continuation: document.getElementById('continuation'),
    multilingual: document.getElementById('multilingual'),
    shortAIAnswer: document.getElementById('shortAIAnswer'),
    debugMode: document.getElementById('debugMode'),
    experimentalFeatures: document.getElementById('experimentalFeatures'),

    // Selects
    languageSelect: document.getElementById('languageSelect'),
    debounceDelay: document.getElementById('debounceDelay'),

    // AI Answer Test
    aiAnswerTest: document.getElementById('aiAnswerTest'),
    testText: document.getElementById('testText'),
    getAIAnswerBtn: document.getElementById('getAIAnswerBtn'),
    aiAnswerResult: document.getElementById('aiAnswerResult'),
    aiAnswerText: document.getElementById('aiAnswerText'),

    // Stats
    apiStatus: document.getElementById('apiStatus'),
    cacheSize: document.getElementById('cacheSize'),
    activeRequests: document.getElementById('activeRequests'),

    // Buttons
    clearCacheBtn: document.getElementById('clearCacheBtn'),
    refreshStatsBtn: document.getElementById('refreshStatsBtn'),
  };
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Checkbox event listeners
  elements.grammarCorrection.addEventListener('change', (e) => {
    handleSettingChange('grammarCorrection', e.target.checked);
  });

  elements.sentenceCompletion.addEventListener('change', (e) => {
    handleSettingChange('sentenceCompletion', e.target.checked);
  });

  elements.continuation.addEventListener('change', (e) => {
    handleSettingChange('continuation', e.target.checked);
  });

  elements.multilingual.addEventListener('change', (e) => {
    handleSettingChange('multilingual', e.target.checked);
  });

  elements.shortAIAnswer.addEventListener('change', (e) => {
    handleSettingChange('shortAIAnswer', e.target.checked);
    toggleAIAnswerTest(e.target.checked);
  });

  elements.debugMode.addEventListener('change', (e) => {
    handleSettingChange('debugMode', e.target.checked);
  });

  elements.experimentalFeatures.addEventListener('change', (e) => {
    handleSettingChange('experimentalFeatures', e.target.checked);
  });

  // Select event listeners
  elements.languageSelect.addEventListener('change', (e) => {
    handleLanguageChange(e.target.value);
  });

  elements.debounceDelay.addEventListener('change', (e) => {
    handleSettingChange('debounceDelay', parseInt(e.target.value));
  });

  // Button event listeners
  elements.getAIAnswerBtn.addEventListener('click', getShortAIAnswer);
  elements.clearCacheBtn.addEventListener('click', clearCache);
  elements.refreshStatsBtn.addEventListener('click', loadAPIStats);
}

/**
 * Load all initial data
 */
async function loadInitialData() {
  try {
    await Promise.all([
      loadSettings(),
      loadAPIStats(),
      loadAvailableLanguages(),
      loadUserLanguage(),
    ]);
  } catch (error) {
    console.error('Failed to load initial data:', error);
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('intellisenseSettings');
    if (result.intellisenseSettings) {
      settings = { ...settings, ...result.intellisenseSettings };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

/**
 * Save settings to storage
 */
async function saveSettings(newSettings) {
  try {
    await chrome.storage.sync.set({ intellisenseSettings: newSettings });
    settings = newSettings;

    // Send settings to content script
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'UPDATE_SETTINGS',
        data: newSettings,
      });
    }

    // Show save confirmation
    showNotification('✅ Settings saved successfully!');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showNotification('❌ Failed to save settings', 'error');
  }
}

/**
 * Handle setting change
 */
function handleSettingChange(key, value) {
  const newSettings = { ...settings, [key]: value };
  saveSettings(newSettings);
}

/**
 * Load API stats
 */
async function loadAPIStats() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_API_STATS',
    });

    if (response.success) {
      stats = response.data;
      updateStatsUI();
    }
  } catch (error) {
    console.error('Failed to load API stats:', error);
  }
}

/**
 * Load available languages
 */
async function loadAvailableLanguages() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_AVAILABLE_LANGUAGES',
    });

    if (response.success) {
      availableLanguages = response.data;
      updateLanguageSelect();
    }
  } catch (error) {
    console.error('Failed to load available languages:', error);
    // Fallback to basic languages
    availableLanguages = [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Spanish', flag: '🇪🇸' },
      { code: 'fr', name: 'French', flag: '🇫🇷' },
      { code: 'de', name: 'German', flag: '🇩🇪' },
      { code: 'it', name: 'Italian', flag: '🇮🇹' },
      { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    ];
    updateLanguageSelect();
  }
}

/**
 * Load user language
 */
async function loadUserLanguage() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_USER_LANGUAGE',
    });

    if (response.success) {
      selectedLanguage = response.data;
    }
  } catch (error) {
    console.error('Failed to load user language:', error);
  }
}

/**
 * Handle language change
 */
async function handleLanguageChange(languageCode) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SET_USER_LANGUAGE',
      data: languageCode,
    });

    if (response.success) {
      selectedLanguage = languageCode;
      showNotification('🌐 Language updated successfully!');
      console.log('Language updated successfully');
    }
  } catch (error) {
    console.error('Failed to update language:', error);
    showNotification('❌ Failed to update language', 'error');
  }
}

/**
 * Get short AI answer
 */
async function getShortAIAnswer() {
  const testText = elements.testText.value.trim();
  if (!testText) return;

  setLoading(true);
  elements.aiAnswerText.textContent = '';
  elements.aiAnswerResult.style.display = 'none';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'REQUEST_SHORT_AI_ANSWER',
      data: {
        text: testText,
        elementId: 'settings-test',
      },
    });

    if (response.success) {
      elements.aiAnswerText.textContent = response.data.answer;
      elements.aiAnswerResult.style.display = 'block';
    } else {
      elements.aiAnswerText.textContent = 'Error: ' + response.error;
      elements.aiAnswerResult.style.display = 'block';
    }
  } catch (error) {
    elements.aiAnswerText.textContent = 'Error: ' + error.message;
    elements.aiAnswerResult.style.display = 'block';
  } finally {
    setLoading(false);
  }
}

/**
 * Clear cache
 */
async function clearCache() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CLEAR_CACHE',
    });

    if (response.success) {
      await loadAPIStats();
      showNotification('🗑️ Cache cleared successfully!');
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
    showNotification('❌ Failed to clear cache', 'error');
  }
}

/**
 * Set loading state
 */
function setLoading(isLoading) {
  loading = isLoading;
  elements.getAIAnswerBtn.disabled =
    isLoading || !elements.testText.value.trim();
  elements.getAIAnswerBtn.textContent = isLoading
    ? '⏳ Thinking...'
    : '🤖 Get AI Answer';
}

/**
 * Toggle AI answer test section
 */
function toggleAIAnswerTest(show) {
  elements.aiAnswerTest.style.display = show ? 'block' : 'none';
}

/**
 * Update language select dropdown
 */
function updateLanguageSelect() {
  elements.languageSelect.innerHTML = '';

  availableLanguages.forEach((lang) => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = `${lang.flag} ${lang.name}`;
    if (lang.code === selectedLanguage) {
      option.selected = true;
    }
    elements.languageSelect.appendChild(option);
  });
}

/**
 * Update stats UI
 */
function updateStatsUI() {
  if (!stats) return;

  // API Status
  const apiInitialized = stats.groqAPI?.initialized;
  elements.apiStatus.textContent = apiInitialized ? '✅ Ready' : '❌ Error';
  elements.apiStatus.className = apiInitialized ? 'status-good' : 'status-bad';

  // Cache Size
  elements.cacheSize.textContent = `${stats.groqAPI?.cacheSize || 0} items`;

  // Active Requests
  elements.activeRequests.textContent =
    stats.requestManager?.activeRequests || 0;
}

/**
 * Update entire UI based on current state
 */
function updateUI() {
  // Update checkboxes
  elements.grammarCorrection.checked = settings.grammarCorrection;
  elements.sentenceCompletion.checked = settings.sentenceCompletion;
  elements.continuation.checked = settings.continuation;
  elements.multilingual.checked = settings.multilingual;
  elements.shortAIAnswer.checked = settings.shortAIAnswer;
  elements.debugMode.checked = settings.debugMode;
  elements.experimentalFeatures.checked = settings.experimentalFeatures;

  // Update selects
  elements.debounceDelay.value = settings.debounceDelay;
  elements.languageSelect.value = selectedLanguage;

  // Update AI answer test visibility
  toggleAIAnswerTest(settings.shortAIAnswer);

  // Update button states
  setLoading(false);

  // Update stats
  updateStatsUI();
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    background: ${type === 'error' ? '#dc3545' : '#28a745'};
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);

// Export for debugging
window.settingsDebug = {
  settings,
  stats,
  availableLanguages,
  selectedLanguage,
  elements,
  loadAPIStats,
  clearCache,
};
