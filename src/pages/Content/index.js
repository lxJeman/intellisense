import { printLine } from './modules/print';
import { TextMonitor } from './modules/textMonitor';
import { TextUI } from './modules/textUI';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

// Initialize text monitoring and UI
let textMonitor;
let textUI;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeIntelliSense);
} else {
  initializeIntelliSense();
}

function initializeIntelliSense() {
  try {
    // Initialize text monitoring
    textMonitor = new TextMonitor();

    // Initialize UI system
    textUI = new TextUI(textMonitor);

    // Connect UI to text monitor
    textMonitor.setUIHandler(textUI);

    console.log('🚀 IntelliSense system initialized');

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
window.intelliSense = {
  getStats: () => ({
    monitor: textMonitor?.getStats(),
    ui: textUI?.getStats(),
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
};
