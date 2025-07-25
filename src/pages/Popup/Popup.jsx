import React, { useState, useEffect } from 'react';
import './Popup.css';

const Popup = () => {
  const [stats, setStats] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [presetMode, setPresetMode] = useState('full');

  useEffect(() => {
    loadAPIStats();
    loadUserLanguage();
    loadAvailableLanguages();
    loadPresetMode();
  }, []);

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

  const loadAvailableLanguages = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_AVAILABLE_LANGUAGES'
      });
      
      if (response.success) {
        setAvailableLanguages(response.data);
      }
    } catch (error) {
      console.error('Failed to load available languages:', error);
    }
  };

  const loadUserLanguage = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_USER_LANGUAGE'
      });
      
      if (response.success) {
        setSelectedLanguage(response.data);
      }
    } catch (error) {
      console.error('Failed to load user language:', error);
    }
  };

  const loadPresetMode = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PRESET_MODE'
      });
      
      if (response.success) {
        setPresetMode(response.data);
      }
    } catch (error) {
      console.error('Failed to load preset mode:', error);
    }
  };

  const handleLanguageChange = async (languageCode) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SET_USER_LANGUAGE',
        data: languageCode
      });
      
      if (response.success) {
        setSelectedLanguage(languageCode);
      }
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const handlePresetModeChange = async (mode) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SET_PRESET_MODE',
        data: mode
      });
      
      if (response.success) {
        setPresetMode(mode);
      }
    } catch (error) {
      console.error('Failed to update preset mode:', error);
    }
  };

  const getPresetModeInfo = (mode) => {
    switch (mode) {
      case 'minimalistic':
        return {
          icon: '🎯',
          name: 'Minimalistic',
          description: 'Grammar correction only'
        };
      case 'basic':
        return {
          icon: '🔤',
          name: 'Basic',
          description: 'Spelling correction only'
        };
      default:
        return {
          icon: '🚀',
          name: 'Full',
          description: 'All features enabled'
        };
    }
  };

  const openFullSettings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('settings.html')
    });
    window.close();
  };

  const getCurrentLanguageInfo = () => {
    const lang = availableLanguages.find(l => l.code === selectedLanguage);
    return lang || { flag: '🌐', name: 'Unknown' };
  };

  return (
    <div className="settings-container">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 10px 0' }}>⚙️ IntelliSense</h1>
        <p style={{ opacity: 0.9, fontSize: '1rem' }}>AI Writing Assistant</p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '12px', 
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>⚙️ Preset Mode</h3>
          <select
            value={presetMode}
            onChange={(e) => handlePresetModeChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem',
              background: 'white',
              color: '#333',
              marginBottom: '10px'
            }}
          >
            <option value="full">🚀 Full - All features enabled</option>
            <option value="minimalistic">🎯 Minimalistic - Grammar correction only</option>
            <option value="basic">🔤 Basic - Spelling correction only</option>
          </select>
          <div style={{ 
            fontSize: '0.85rem', 
            opacity: 0.8, 
            fontStyle: 'italic',
            color: '#333'
          }}>
            {getPresetModeInfo(presetMode).description}
          </div>
        </div>

        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '12px', 
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>🌐 Current Language</h3>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem',
              background: 'white',
              color: '#333'
            }}
          >
            {availableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>


      </div>

      <button
        onClick={openFullSettings}
        style={{
          width: '100%',
          padding: '15px 20px',
          background: 'rgba(255,255,255,0.9)',
          color: '#333',
          border: 'none',
          borderRadius: '12px',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '20px'
        }}
        onMouseOver={(e) => {
          e.target.style.background = 'white';
          e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'rgba(255,255,255,0.9)';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        🔧 Open Full Settings
      </button>

      <div style={{ fontSize: '0.85rem', textAlign: 'center', color: '#333', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', padding: '10px' }}>
        <p style={{ margin: '5px 0', color: '#333' }}>💡 Quick language change above</p>
        <p style={{ margin: '5px 0', color: '#333' }}>⚙️ Full settings in new tab</p>
      </div>
    </div>
  );
};

export default Popup;