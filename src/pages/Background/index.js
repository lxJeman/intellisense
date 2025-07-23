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

    case 'GET_USER_PREFERENCES':
      handleGetUserPreferences(sendResponse);
      break;

    case 'SAVE_USER_PREFERENCES':
      handleSaveUserPreferences(message.data, sendResponse);
      break;

    case 'DETECT_LANGUAGE':
      handleDetectLanguage(message.data, sendResponse);
      break;

    case 'REQUEST_ENHANCED_GRAMMAR_CORRECTION':
      handleEnhancedGrammarCorrectionRequest(
        message.data,
        sender,
        sendResponse
      );
      break;

    case 'REPORT_CORRECTION_ISSUE':
      handleReportCorrectionIssue(message.data, sender, sendResponse);
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
      // Use enhanced grammar correction with safe defaults
      const result = await groqAPI.correctGrammarWithUserPrefs(
        inputData.textContent,
        {
          // Override with safe defaults to prevent unwanted translation
          allowTranslation: false,
          preserveMeaning: true,
          fixOnly: 'both',
        }
      );

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

    // Use enhanced grammar correction with safe defaults
    const result = await groqAPI.correctGrammarWithUserPrefs(requestData.text, {
      // Override with safe defaults to prevent unwanted translation
      allowTranslation: false,
      preserveMeaning: true,
      fixOnly: 'both',
    });

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

    const result = await requestManager.requestAutocomplete(
      requestData.text,
      requestData.context || '',
      requestData.elementId,
      groqAPI
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
 * Handle get user preferences request
 */
async function handleGetUserPreferences(sendResponse) {
  try {
    console.log('🎯 User preferences requested');

    const preferences = await groqAPI.getUserPreferences();

    sendResponse({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('❌ Failed to get user preferences:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle save user preferences request
 */
async function handleSaveUserPreferences(preferences, sendResponse) {
  try {
    console.log('💾 Saving user preferences:', preferences);

    const savedPrefs = await groqAPI.saveUserPreferences(preferences);

    sendResponse({
      success: true,
      data: savedPrefs,
    });
  } catch (error) {
    console.error('❌ Failed to save user preferences:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle language detection request
 */
function handleDetectLanguage(requestData, sendResponse) {
  try {
    console.log(
      '🔍 Language detection requested for:',
      requestData.text.substring(0, 30) + '...'
    );

    const detectedLanguage = groqAPI.detectLanguageSmart(requestData.text);

    sendResponse({
      success: true,
      data: {
        language: detectedLanguage,
        text: requestData.text,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('❌ Language detection failed:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle enhanced grammar correction request with user options
 */
async function handleEnhancedGrammarCorrectionRequest(
  requestData,
  sender,
  sendResponse
) {
  try {
    console.log('🔧 Enhanced grammar correction requested with options:', {
      textLength: requestData.text.length,
      options: requestData.options,
    });

    const result = await groqAPI.correctGrammarWithOptions(
      requestData.text,
      requestData.options
    );

    sendResponse({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Enhanced grammar correction failed:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle correction issue report
 */
async function handleReportCorrectionIssue(requestData, sender, sendResponse) {
  try {
    console.log('📝 Correction issue reported:', {
      issueType: requestData.issueType,
      elementId: requestData.elementId,
    });

    const report = await groqAPI.reportCorrectionIssue(
      requestData.originalText,
      requestData.correctedText || requestData.originalText,
      requestData.issueType,
      requestData.userFeedback || ''
    );

    sendResponse({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('❌ Failed to report correction issue:', error);
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
