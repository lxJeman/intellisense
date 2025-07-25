import secrets from 'secrets';
import { GroqAPIWrapper } from './modules/groqAPI';
import { RequestManager } from './modules/requestManager';

console.log('🚀 Background script initialized');
console.log('🔑 Debug mode:', secrets.DEBUG_MODE);

// Initialize API wrapper and request manager
const groqAPI = new GroqAPIWrapper();
const requestManager = new RequestManager();

// Message handler for content script communications
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received in background:', message.type);

  switch (message.type) {
    case 'TEXT_INPUT_CAPTURED':
      handleTextInputCapture(message.data, sender, sendResponse);
      break;

    case 'REQUEST_GRAMMAR_CORRECTION':
      handleGrammarCorrectionRequest(message.data, sender, sendResponse);
      break;

    case 'REQUEST_AUTOCOMPLETE':
      handleAutocompleteRequest(message.data, sender, sendResponse);
      break;

    case 'GET_API_STATS':
      handleGetAPIStats(sendResponse);
      break;

    case 'CLEAR_CACHE':
      handleClearCache(sendResponse);
      break;

    case 'REQUEST_SHORT_AI_ANSWER':
      handleShortAIAnswerRequest(message.data, sender, sendResponse);
      break;

    case 'GET_AVAILABLE_LANGUAGES':
      handleGetAvailableLanguages(sendResponse);
      break;

    case 'SET_USER_LANGUAGE':
      handleSetUserLanguage(message.data, sendResponse);
      break;

    case 'GET_USER_LANGUAGE':
      handleGetUserLanguage(sendResponse);
      break;

    case 'REQUEST_SENTENCE_CONTINUATION':
      handleSentenceContinuationRequest(message.data, sender, sendResponse);
      break;

    case 'REQUEST_QUICK_SPELLING_CORRECTION':
      handleQuickSpellingCorrectionRequest(message.data, sender, sendResponse);
      break;

    case 'GET_PRESET_MODE':
      handleGetPresetMode(sendResponse);
      break;

    case 'SET_PRESET_MODE':
      handleSetPresetMode(message.data, sendResponse);
      break;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep message channel open for async response
});

/**
 * Handle text input capture from content script
 */
async function handleTextInputCapture(inputData, sender, sendResponse) {
  console.log('✍️ Text input captured from tab:', sender.tab?.id);
  console.log('📝 Input data:', {
    element: inputData.elementId,
    textLength: inputData.textContent.length,
    caretPosition: inputData.caretPosition,
    timestamp: new Date(inputData.timestamp).toLocaleTimeString(),
  });

  try {
    // Auto-process text if it's long enough
    if (inputData.textContent.length > 10) {
      // Use simple grammar correction with user's selected language
      const result = await groqAPI.correctGrammar(inputData.textContent);

      console.log('📄 Enhanced grammar correction result:', {
        hasChanges: result.hasChanges,
        detectedLanguage: result.detectedLanguage,
        originalLength: result.original?.length,
        correctedLength: result.corrected?.length,
      });

      sendResponse({
        success: true,
        type: 'GRAMMAR_CORRECTION',
        data: result,
      });
    } else {
      sendResponse({ success: true, message: 'Text too short for processing' });
    }
  } catch (error) {
    console.error('❌ Error processing text input:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle explicit grammar correction request
 */
async function handleGrammarCorrectionRequest(
  requestData,
  sender,
  sendResponse
) {
  try {
    console.log(
      '🔧 Grammar correction requested for:',
      requestData.text.substring(0, 50) + '...'
    );

    // Use simple grammar correction with user's selected language
    const result = await groqAPI.correctGrammar(requestData.text);

    sendResponse({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Grammar correction failed:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle autocomplete request
 */
async function handleAutocompleteRequest(requestData, sender, sendResponse) {
  try {
    console.log(
      '💡 Autocomplete requested for:',
      requestData.text.substring(0, 30) + '...'
    );

    const result = await groqAPI.getAutocompleteSuggestions(
      requestData.text,
      requestData.context || ''
    );

    sendResponse({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Autocomplete failed:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle API stats request
 */
function handleGetAPIStats(sendResponse) {
  const stats = {
    groqAPI: groqAPI.getStats(),
    requestManager: requestManager.getStats(),
    timestamp: Date.now(),
  };

  console.log('📊 API Stats requested:', stats);
  sendResponse({ success: true, data: stats });
}

/**
 * Handle cache clear request
 */
function handleClearCache(sendResponse) {
  groqAPI.clearCache();
  requestManager.cancelAllRequests();

  console.log('🗑️ Cache cleared');
  sendResponse({ success: true, message: 'Cache cleared successfully' });
}

/**
 * Handle short AI answer request (NEW FEATURE)
 */
async function handleShortAIAnswerRequest(requestData, sender, sendResponse) {
  try {
    console.log(
      '🤖 Short AI answer requested for:',
      requestData.text.substring(0, 50) + '...'
    );

    const result = await groqAPI.getShortAIAnswer(requestData.text);

    sendResponse({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Short AI answer failed:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle get available languages request
 */
function handleGetAvailableLanguages(sendResponse) {
  try {
    console.log('🌐 Available languages requested');

    const languages = groqAPI.getAvailableLanguages();

    sendResponse({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('❌ Failed to get available languages:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle set user language request
 */
async function handleSetUserLanguage(languageCode, sendResponse) {
  try {
    console.log('🌐 Setting user language to:', languageCode);

    await groqAPI.setUserLanguage(languageCode);

    sendResponse({
      success: true,
      message: 'Language updated successfully',
      currentLanguage: groqAPI.getCurrentLanguage(),
    });
  } catch (error) {
    console.error('❌ Failed to set user language:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle get user language request
 */
async function handleGetUserLanguage(sendResponse) {
  try {
    console.log('🌐 Getting user language');

    const result = await chrome.storage.local.get(['userSelectedLanguage']);
    const languageCode = result.userSelectedLanguage || 'en'; // Default to English

    sendResponse({
      success: true,
      data: languageCode,
      currentLanguage: groqAPI.getCurrentLanguage(),
    });
  } catch (error) {
    console.error('❌ Failed to get user language:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle sentence continuation request (THINKING MODE)
 */
async function handleSentenceContinuationRequest(
  requestData,
  sender,
  sendResponse
) {
  try {
    console.log(
      '🧠 Sentence continuation requested for:',
      requestData.completedText.substring(0, 50) + '...'
    );

    const result = await groqAPI.getSentenceContinuations(
      requestData.completedText,
      requestData.context || ''
    );

    sendResponse({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Sentence continuation failed:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle quick spelling correction request
 */
async function handleQuickSpellingCorrectionRequest(
  requestData,
  sender,
  sendResponse
) {
  try {
    console.log(
      '🔤 Quick spelling correction requested for:',
      requestData.text.substring(0, 50) + '...'
    );

    const result = await groqAPI.quickSpellingCorrection(requestData.text);

    sendResponse({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Quick spelling correction failed:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle get preset mode request
 */
async function handleGetPresetMode(sendResponse) {
  try {
    console.log('⚙️ Getting preset mode');

    const result = await chrome.storage.local.get(['presetMode']);
    const presetMode = result.presetMode || 'full'; // Default to full mode

    sendResponse({
      success: true,
      data: presetMode,
    });
  } catch (error) {
    console.error('❌ Failed to get preset mode:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle set preset mode request
 */
async function handleSetPresetMode(presetMode, sendResponse) {
  try {
    console.log('⚙️ Setting preset mode to:', presetMode);

    await chrome.storage.local.set({ presetMode: presetMode });

    sendResponse({
      success: true,
      message: 'Preset mode updated successfully',
      data: presetMode,
    });
  } catch (error) {
    console.error('❌ Failed to set preset mode:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Optional: Track active tabs with text monitoring
const activeTabs = new Set();

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('🔄 Tab activated:', activeInfo.tabId);
  activeTabs.add(activeInfo.tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
  // Cancel any pending requests for this tab
  requestManager.cancelElementRequests(`tab-${tabId}`);
  console.log('❌ Tab removed:', tabId);
});

// Periodic stats logging (development only)
if (secrets.DEBUG_MODE) {
  setInterval(() => {
    const stats = {
      groqAPI: groqAPI.getStats(),
      requestManager: requestManager.getStats(),
      activeTabs: activeTabs.size,
    };
    console.log('📊 Periodic stats:', stats);
  }, 60000); // Every minute
}
