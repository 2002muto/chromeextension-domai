# Technology Stack

## Core Technologies

- **Platform**: Chrome Extension (Manifest V3)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: Chrome Storage API (local storage)
- **Architecture**: Service Worker background script + Content Scripts

## Key Files & Structure

- `manifest.json` - Extension configuration and permissions
- `background.js` - Service worker for background operations
- `contentScript.js` - Injected script for page interaction
- `pages/` - Individual feature pages (memo, prompt, clipboard, iframe, etc.)
- `style.css` - Global styling and component styles

## Chrome APIs Used

- `sidePanel` - Main UI container
- `storage` - Data persistence
- `scripting` - Content script injection
- `declarativeNetRequest` - Header modification for iframe embedding
- `tabs` - Tab management and communication
- `clipboardRead/Write` - Clipboard operations

## Build System

- **No build process** - Direct file deployment
- **Development**: Direct file editing and Chrome extension reload
- **Testing**: Load unpacked extension in Chrome developer mode
- **Deployment**: Package as .crx or upload to Chrome Web Store

## Common Commands

```bash
# Development setup
# 1. Open Chrome and navigate to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the project directory
# 4. After changes, click the refresh icon on the extension card

# No compilation or build steps required
```

## Code Style

- ES6+ JavaScript with async/await patterns
- Modular page-based architecture
- Promise-wrapped Chrome API calls
- Event-driven communication between components
