import { printLine } from './modules/print';
import { TextMonitor } from './modules/textMonitor';
import { TextUI } from './modules/textUI';
import { LanguageUI } from './modules/languageUI';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

// Initialize text monitoring and UI
let textMonitor;
let textUI;
let languageUI;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeIntelliSense);
} else {
  initializeIntelliSense();
}

async function initializeIntelliSense() {
  try {
    // Initialize text monitoring
    textMonitor = new TextMonitor();

    // Initialize UI system
    textUI = new TextUI(textMonitor);

    // Initialize language UI system
    languageUI = new LanguageUI(textUI);
    await languageUI.init(); // Ensure proper async initialization

    // Connect UI to text monitor
    textMonitor.setUIHandler(textUI);

    // Connect language UI to text UI
    textUI.setLanguageUI(languageUI);

    console.log('🚀 IntelliSense system with Language UI initialized');

    // Log stats periodically for debugging
    setInterval(() => {
      const monitorStats = textMonitor.getStats();
      const uiStats = textUI.getStats();
      console.log('📊 IntelliSense Stats:', {
        monitor: monitorStats,
        ui: uiStats,
      });
    }, 30000); // Every 30 seconds

    // Listen for background script responses
    setupBackgroundMessageListener();
  } catch (error) {
    console.error('Failed to initialize IntelliSense:', error);
  }
}

/**
 * Setup listener for background script responses
 */
function setupBackgroundMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Content script received message:', message.type);

    switch (message.type) {
      case 'GRAMMAR_CORRECTION_RESULT':
        if (textUI) {
          textUI.handleGrammarCorrectionResult(message.data);
        }
        break;

      case 'AUTOCOMPLETE_RESULT':
        if (textUI) {
          textUI.handleAutocompleteResult(message.data);
        }
        break;

      case 'UI_COMMAND':
        if (textUI) {
          textUI.handleUICommand(message.data);
        }
        break;

      default:
        console.warn('Unknown message type in content script:', message.type);
    }

    sendResponse({ success: true });
    return true;
  });

  console.log('📡 Background message listener setup complete');
}

// Expose for debugging
window.textMonitor = textMonitor;
window.textUI = textUI;
window.languageUI = languageUI;
window.intelliSense = {
  getStats: () => ({
    monitor: textMonitor?.getStats(),
    ui: textUI?.getStats(),
    language: languageUI?.getStats(),
  }),
  toggleGrammarCorrections: () => {
    if (textUI) {
      textUI.updateSettings({
        showGrammarCorrections: !textUI.settings.showGrammarCorrections,
      });
    }
  },
  toggleAutocomplete: () => {
    if (textUI) {
      textUI.updateSettings({
        showAutocomplete: !textUI.settings.showAutocomplete,
      });
    }
  },
  showLanguageControl: (element) => {
    if (textUI && element) {
      textUI.showLanguageControl(element);
    } else {
      console.log(
        'Usage: intelliSense.showLanguageControl(document.querySelector("textarea"))'
      );
    }
  },
  detectLanguage: async (text) => {
    if (!text) {
      console.log('Usage: await intelliSense.detectLanguage("your text here")');
      return;
    }
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DETECT_LANGUAGE',
        data: { text },
      });
      console.log('Detected language:', response.data);
      return response.data;
    } catch (error) {
      console.error('Language detection failed:', error);
    }
  },
  testEnhancedCorrection: async (text, options = {}) => {
    if (!text) {
      console.log(
        'Usage: await intelliSense.testEnhancedCorrection("your text", { userLanguage: "english", allowTranslation: false })'
      );
      return;
    }
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_ENHANCED_GRAMMAR_CORRECTION',
        data: { text, elementId: 'test', options },
      });
      console.log('Enhanced correction result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Enhanced correction failed:', error);
    }
  },
};
