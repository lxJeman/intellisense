import React, { useState, useEffect } from 'react';
import './Popup.css';

const Popup = () => {
  const [settings, setSettings] = useState({
    grammarCorrection: true,
    sentenceCompletion: true,
    continuation: true,
    shortAIAnswer: false, // NEW: Short AI Answer feature
    multilingual: true,
    debounceDelay: 3000,
  });
  const [stats, setStats] = useState(null);
  const [testText, setTestText] = useState('What is the best programmer or dev blog writer?');
  const [aiAnswer, setAiAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  // Load settings and stats on component mount
  useEffect(() => {
    loadSettings();
    loadAPIStats();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get('intellisenseSettings');
      if (result.intellisenseSettings) {
        setSettings({ ...settings, ...result.intellisenseSettings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await chrome.storage.sync.set({ intellisenseSettings: newSettings });
      setSettings(newSettings);
      
      // Send settings to content script
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'UPDATE_SETTINGS',
          data: newSettings
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const loadAPIStats = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_API_STATS'
      });
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load API stats:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const getShortAIAnswer = async () => {
    if (!testText.trim()) return;
    
    setLoading(true);
    setAiAnswer('');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_SHORT_AI_ANSWER',
        data: {
          text: testText,
          elementId: 'popup-test'
        }
      });

      if (response.success) {
        setAiAnswer(response.data.answer);
      } else {
        setAiAnswer('Error: ' + response.error);
      }
    } catch (error) {
      setAiAnswer('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CLEAR_CACHE'
      });
      
      if (response.success) {
        loadAPIStats();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ IntelliSense Settings</h2>
        <p>Configure your AI writing assistant</p>
      </div>

      <div className="settings-section">
        <h3>🔧 Core Features</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>✅ Automatic Grammar Correction</label>
            <p>Automatically fix grammar errors as you type</p>
          </div>
          <input
            type="checkbox"
            checked={settings.grammarCorrection}
            onChange={(e) => handleSettingChange('grammarCorrection', e.target.checked)}
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>📝 Sentence Completion</label>
            <p>Suggest completions for finished sentences</p>
          </div>
          <input
            type="checkbox"
            checked={settings.sentenceCompletion}
            onChange={(e) => handleSettingChange('sentenceCompletion', e.target.checked)}
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>🔄 Continuation Suggestions</label>
            <p>Suggest next thoughts when you pause typing</p>
          </div>
          <input
            type="checkbox"
            checked={settings.continuation}
            onChange={(e) => handleSettingChange('continuation', e.target.checked)}
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>🌍 Multilingual Support</label>
            <p>Preserve original language in corrections</p>
          </div>
          <input
            type="checkbox"
            checked={settings.multilingual}
            onChange={(e) => handleSettingChange('multilingual', e.target.checked)}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>🤖 NEW: Short AI Answer</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>💬 Enable Short AI Answers</label>
            <p>Get instant answers to questions (like ChatGPT responses)</p>
          </div>
          <input
            type="checkbox"
            checked={settings.shortAIAnswer}
            onChange={(e) => handleSettingChange('shortAIAnswer', e.target.checked)}
          />
        </div>

        {settings.shortAIAnswer && (
          <div className="ai-answer-test">
            <h4>🧪 Test Short AI Answer</h4>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Ask a question to get a short AI answer..."
              rows={3}
            />
            
            <button 
              onClick={getShortAIAnswer} 
              disabled={loading || !testText.trim()}
              className="ai-answer-btn"
            >
              {loading ? '⏳ Thinking...' : '🤖 Get AI Answer'}
            </button>

            {aiAnswer && (
              <div className="ai-answer-result">
                <h5>🎯 AI Answer:</h5>
                <div className="ai-answer-text">{aiAnswer}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>⚡ Performance</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>⏱️ Processing Delay</label>
            <p>Time to wait before processing (milliseconds)</p>
          </div>
          <select
            value={settings.debounceDelay}
            onChange={(e) => handleSettingChange('debounceDelay', parseInt(e.target.value))}
          >
            <option value={1000}>1 second (Fast)</option>
            <option value={2000}>2 seconds (Balanced)</option>
            <option value={3000}>3 seconds (Conservative)</option>
            <option value={5000}>5 seconds (Slow)</option>
          </select>
        </div>
      </div>

      {stats && (
        <div className="settings-section">
          <h3>📊 System Status</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span>API Status:</span>
              <span className={stats.groqAPI.initialized ? 'status-good' : 'status-bad'}>
                {stats.groqAPI.initialized ? '✅ Ready' : '❌ Error'}
              </span>
            </div>
            <div className="stat-item">
              <span>Cache Size:</span>
              <span>{stats.groqAPI.cacheSize} items</span>
            </div>
            <div className="stat-item">
              <span>Active Requests:</span>
              <span>{stats.requestManager.activeRequests}</span>
            </div>
            <div className="stat-item">
              <span>Language Support:</span>
              <span>✅ 12+ Languages</span>
            </div>
          </div>
          
          <div className="system-actions">
            <button onClick={clearCache} className="clear-btn">
              🗑️ Clear Cache
            </button>
            <button onClick={loadAPIStats} className="refresh-btn">
              🔄 Refresh Stats
            </button>
          </div>
        </div>
      )}

      <div className="settings-footer">
        <p>💡 Changes are saved automatically</p>
        <p>🔄 Refresh the page to apply new settings</p>
      </div>
    </div>
  );
};

export default Popup;
