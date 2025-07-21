# Project Structure

## Root Directory

```
├── manifest.json          # Extension configuration
├── background.js          # Service worker (main background script)
├── contentScript.js       # Content script injected into web pages
├── edgeSensor.js          # Edge detection utilities
├── style.css             # Global styles and component CSS
├── rules.json            # Declarative net request rules for iframe headers
└── .gitignore            # Git ignore patterns
```

## Core Directories

### `/icons/`

Extension icons in multiple sizes (16px, 48px, 128px)

### `/pages/`

Feature-specific pages with modular architecture:

```
pages/
├── common.js             # Shared utilities and page state management
├── utils.js              # Common helper functions
├── memo/                 # Note-taking functionality
│   ├── memo.html
│   ├── memo.js
│   ├── memo.css
│   ├── archive.js        # Archive management
│   └── archive.css
├── clipboard/            # Clipboard history management
│   ├── clipboard.html
│   ├── clipboard.js
│   └── clipboard.css
├── prompt/               # Template prompt system
│   ├── prompt.html
│   ├── prompt.js
│   └── prompt.css
├── iframe/               # Embedded web browsing
│   ├── iframe.html
│   ├── iframe.js
│   └── iframe.css
├── ai/                   # AI features (future implementation)
│   ├── ai.html
│   ├── ai.js
│   └── ai.css
├── setting/              # Configuration and backup
│   ├── setting.html
│   ├── setting.js
│   └── setting.css
└── status/               # Status and monitoring
    ├── status.html
    ├── status.js
    └── status.css
```

### `/vendor/`

Third-party libraries and dependencies

### `/_metadata/`

Generated metadata and indexed rulesets

## Architecture Patterns

### Page Structure

Each feature follows a consistent pattern:

- `.html` - Page markup and structure
- `.js` - Feature logic and Chrome API interactions
- `.css` - Feature-specific styling

### State Management

- `pages/common.js` - Centralized page state management
- `PageStateManager` - Utility for saving/restoring page states
- Chrome Storage API for data persistence

### Navigation

- Header-based navigation with active state management
- Page state restoration on navigation
- Unsaved changes detection and confirmation dialogs

### Communication

- Background script handles cross-tab communication
- Content script manages page interaction
- Message passing between components using Chrome runtime API
