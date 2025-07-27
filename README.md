<img src="src/assets/img/icon-128.png" width="64"/>

# IntelliSense AI Writing Assistant

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/)
[![React 18](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org)
[![AI Powered](https://img.shields.io/badge/AI-Powered-purple?logo=openai)](https://groq.com)

> **🚀 An intelligent AI-powered writing assistant that helps you write better, faster, and more accurately across the web.**

IntelliSense AI Writing Assistant is a Chrome extension that provides real-time grammar correction, spelling fixes, autocomplete suggestions, and intelligent sentence continuations powered by advanced AI technology.

## ✨ Features

### 🎯 **Three Preset Modes**

- **🚀 Full Mode**: Complete AI writing assistance with all features enabled
- **🎯 Minimalistic Mode**: Grammar correction only for distraction-free writing
- **🔤 Basic Mode**: Spelling correction only for minimal interference

### 🔧 **Core Features**

- **✅ Real-time Grammar Correction**: Automatic grammar fixes as you type
- **🔤 Quick Spelling Correction**: Instant spelling fixes with format preservation
- **💡 Smart Autocomplete**: Context-aware word and phrase completions (3 options)
- **🧠 Thinking Mode**: Intelligent sentence continuations after completing thoughts
- **🌍 70+ Language Support**: Multi-language correction and translation
- **⚡ Smart Caching**: Efficient processing with intelligent caching system

### 🎨 **User Experience**

- **Seamless Integration**: Works on all text inputs across the web
- **Non-intrusive UI**: Clean, professional interface that doesn't distract
- **Keyboard Navigation**: Full keyboard support for all features
- **Real-time Processing**: Instant feedback with smart debouncing
- **Dropdown Selection**: Choose from multiple AI-generated options

## 📦 Installation

### Option 1: Install from Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store page](https://chrome.google.com/webstore) (link coming soon)
2. Click "Add to Chrome"
3. Confirm installation
4. Configure your API key and preferences

### Option 2: Install from Release ZIP

1. **Download the latest release**:

   - Go to the [Releases page](https://github.com/your-repo/releases)
   - Download the latest `intellisense-x.x.x.zip` file

2. **Extract and install**:

   - Extract the ZIP file to a folder on your computer
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extracted folder
   - The extension will be installed and ready to use

3. **Configure the extension**:
   - Click the extension icon in your browser toolbar
   - Set your preferred language and preset mode
   - Open full settings for advanced configuration

### Option 3: Development Installation

1. **Prerequisites**:

   - [Node.js](https://nodejs.org/) version >= 18
   - [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

2. **Clone and build**:

   ```bash
   git clone https://github.com/your-repo/intellisense-ai-assistant.git
   cd intellisense-ai-assistant
   npm install
   npm run build
   ```

3. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build` folder

## ⚙️ Configuration

### 🔑 API Key Setup

1. Get your Groq API key from [Groq Console](https://console.groq.com)
2. Create `secrets.development.js` (for development) or `secrets.production.js` (for production):
   ```javascript
   export default {
     AI_API_KEY: 'your-groq-api-key-here',
     DEBUG_MODE: true, // Set to false for production
   };
   ```

### 🎛️ Preset Modes

Choose your preferred level of AI assistance:

| Feature             | Full Mode | Minimalistic | Basic |
| ------------------- | --------- | ------------ | ----- |
| Grammar Correction  | ✅        | ✅           | ❌    |
| Spelling Correction | ✅        | ❌           | ✅    |
| Autocomplete        | ✅        | ❌           | ❌    |
| Continuations       | ✅        | ❌           | ❌    |
| UI Effects          | ✅        | ❌           | ❌    |

### 🌍 Language Support

- **70+ languages** supported for correction and translation
- **Automatic language detection** with manual override
- **Preserve original language** or translate to preferred language
- **Context-aware corrections** that maintain meaning and tone

## 🚀 Usage

### Basic Usage

1. **Start typing** in any text field on any website
2. **Watch for suggestions** that appear automatically
3. **Use keyboard shortcuts**:
   - `Tab` - Accept autocomplete suggestion
   - `Escape` - Dismiss suggestions
   - `Arrow Keys` - Navigate continuation options
   - `Enter` - Apply selected continuation

### Advanced Features

- **Thinking Mode**: Complete a sentence with `.`, `?`, or `!` and pause - get 3 continuation options
- **Quick Settings**: Click extension icon for instant mode switching
- **Full Settings**: Right-click extension → Options for detailed configuration
- **Language Control**: Switch languages on-the-fly for different contexts

## 🏗️ Technical Architecture

### Built With

- **Frontend**: React 18, Webpack 5, TypeScript
- **AI Engine**: Groq API with Llama3-8B-8192 model
- **Extension**: Chrome Manifest V3
- **Styling**: Modern CSS with responsive design
- **Development**: Hot reload, ESLint, Prettier

### Project Structure

```
src/
├── pages/
│   ├── Background/     # Service worker and API handling
│   ├── Content/        # Content scripts and UI injection
│   ├── Popup/          # Extension popup interface
│   └── Settings/       # Full settings page
├── assets/             # Icons and static resources
└── manifest.json       # Extension configuration
```

### Key Components

- **TextMonitor**: Monitors user input across all text fields
- **GroqAPI**: Handles AI requests and response processing
- **TextUI**: Manages user interface and interactions
- **TextReplacer**: Handles text replacement and undo functionality

## 🔧 Development

### Development Setup

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm start

# Build for production
NODE_ENV=production npm run build

# Run on custom port
PORT=6002 npm start
```

### Testing

```bash
# Run tests
npm test

# Test specific features
npm run test:grammar
npm run test:autocomplete
npm run test:continuations
```

### Code Quality

```bash
# Format code
npm run prettier

# Lint code
npm run lint

# Type checking
npm run type-check
```

## 📊 Performance

- **Smart Caching**: 30-minute cache with intelligent invalidation
- **Debounced Processing**: 500ms input debouncing, 1.5s thinking mode delay
- **Rate Limiting**: 3-second rate limiting for API calls
- **Memory Efficient**: Automatic cleanup of old cache entries
- **Minimal Impact**: Lightweight content script with lazy loading

## 🔒 Privacy & Security

- **Local Processing**: Text processing happens locally when possible
- **Secure API**: All API calls use HTTPS encryption
- **No Data Storage**: No personal data stored permanently
- **Password Protection**: Automatically skips password fields
- **User Control**: Full control over what gets processed

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our [Wiki](https://github.com/your-repo/wiki)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: Contact us at support@intellisense-ai.com

## 🎯 Roadmap

- [ ] **Voice Input**: Speech-to-text integration
- [ ] **Custom Models**: Support for custom AI models
- [ ] **Team Features**: Shared settings and style guides
- [ ] **Analytics**: Writing improvement analytics
- [ ] **Mobile Support**: Extension for mobile browsers
- [ ] **Offline Mode**: Basic features without internet

## 🙏 Acknowledgments

- **Groq**: For providing the AI API infrastructure
- **Chrome Extension Boilerplate**: Base project structure
- **React Community**: For the amazing ecosystem
- **Contributors**: All the developers who helped build this

---

**Made with ❤️ for better writing everywhere**

_IntelliSense AI Writing Assistant - Write better, faster, smarter._
