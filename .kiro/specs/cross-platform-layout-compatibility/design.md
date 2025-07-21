# Design Document

## Overview

このドキュメントでは、Chrome拡張機能「SideEffect」のクロスプラットフォーム・レイアウト互換性を実現するための設計について説明します。主な目標は、Ubuntu環境で開発されたレイアウトをWindows環境でも同じように表示することです。

現在のコードベースには既に一部のWindows対応コード（`windows-fix`および`hidpi-fix`）が存在しており、これらを基盤として包括的なクロスプラットフォーム対応を実装します。

## Architecture

### Platform Detection Strategy

プラットフォーム検出は以下の階層で実装します：

1. **CSS Media Queries**: 解像度やデバイス特性による自動検出
2. **JavaScript Detection**: `navigator.platform`や`navigator.userAgent`による動的検出
3. **CSS Custom Properties**: プラットフォーム固有の値を管理

### Cross-Platform Normalization Layers

```
┌─────────────────────────────────────┐
│           Application Layer          │
├─────────────────────────────────────┤
│      Platform Compatibility Layer   │
│  ┌─────────────┬─────────────────┐  │
│  │   Windows   │     Ubuntu      │  │
│  │   Fixes     │   (Reference)   │  │
│  └─────────────┴─────────────────┘  │
├─────────────────────────────────────┤
│         Base CSS Framework          │
└─────────────────────────────────────┘
```

## Components and Interfaces

### 1. Platform Detection Module

**File**: `pages/common.js`

```javascript
// Platform detection and CSS class application
const PlatformDetector = {
  detect: () => string,
  applyPlatformClasses: () => void,
  getPlatformSpecificValues: () => object
}
```

### 2. Cross-Platform CSS Framework

**Files**:

- `style.css` (main compatibility styles)
- `pages/*/[page].css` (page-specific fixes)

**Structure**:

```css
/* Platform Detection */
.platform-windows {
  /* Windows-specific overrides */
}
.platform-mac {
  /* macOS-specific overrides */
}
.platform-linux {
  /* Linux-specific overrides */
}

/* High DPI Support */
@media (min-resolution: 1.25dppx) {
  /* HiDPI fixes */
}
@media (min-resolution: 1.5dppx) {
  /* Higher DPI fixes */
}
```

### 3. Font Rendering Compatibility

**Key Areas**:

- Font family fallbacks
- Line height normalization
- Letter spacing adjustments
- Font weight consistency

### 4. Scrollbar Standardization

**Implementation**:

- Custom scrollbar styling using CSS variables
- Webkit scrollbar overrides
- Firefox scrollbar-width properties
- Consistent thumb and track styling

## Data Models

### Platform Configuration Object

```javascript
const PlatformConfig = {
  windows: {
    fontAdjustments: {
      lineHeightMultiplier: 1.1,
      letterSpacingOffset: "0.01em",
    },
    scrollbarConfig: {
      width: "8px",
      thumbColor: "#9e9e9e",
      trackColor: "#f0f0f0",
    },
    boxModelFixes: {
      paddingAdjustment: "1px",
      marginCompensation: "0.5px",
    },
  },
  linux: {
    // Reference platform - minimal adjustments
    fontAdjustments: {},
    scrollbarConfig: {},
    boxModelFixes: {},
  },
};
```

### CSS Custom Properties Schema

```css
:root {
  /* Font System */
  --font-family-primary:
    system-ui, -apple-system, "Segoe UI", "Noto Sans JP", sans-serif;
  --line-height-base: 1.5;
  --letter-spacing-base: normal;

  /* Scrollbar System */
  --sb-width: 6px;
  --sb-thumb: #9e9e9e;
  --sb-thumb-hover: #7b7b7b;
  --sb-track: #f0f0f0;

  /* Box Model */
  --padding-compensation: 0px;
  --margin-compensation: 0px;
  --border-width-base: 1px;
}
```

## Error Handling

### Graceful Degradation Strategy

1. **Feature Detection**: Check for CSS feature support before applying fixes
2. **Fallback Values**: Provide safe defaults for unsupported properties
3. **Progressive Enhancement**: Layer compatibility fixes without breaking base functionality

### Error Recovery Mechanisms

```javascript
// CSS feature detection
const supportsCustomProperties = CSS.supports("--test", "0");
const supportsScrollbarStyling = CSS.supports("scrollbar-width", "thin");

// Apply fixes only if supported
if (supportsCustomProperties) {
  applyCustomPropertyFixes();
}
```

## Testing Strategy

### Visual Regression Testing

1. **Reference Screenshots**: Capture Ubuntu layouts as reference
2. **Cross-Platform Comparison**: Automated screenshot comparison
3. **Pixel-Perfect Validation**: Ensure <1px tolerance across platforms

### Compatibility Testing Matrix

| Component  | Ubuntu | Windows | macOS | Chrome | Firefox | Edge |
| ---------- | ------ | ------- | ----- | ------ | ------- | ---- |
| Navigation | ✓      | Test    | Test  | ✓      | Test    | Test |
| Memo List  | ✓      | Test    | Test  | ✓      | Test    | Test |
| Clipboard  | ✓      | Test    | Test  | ✓      | Test    | Test |
| Settings   | ✓      | Test    | Test  | ✓      | Test    | Test |

### Automated Testing Approach

```javascript
// Platform-specific test suite
describe("Cross-Platform Layout", () => {
  beforeEach(() => {
    // Set up platform simulation
  });

  it("should render navigation consistently", () => {
    // Test navigation layout
  });

  it("should handle font rendering differences", () => {
    // Test font consistency
  });

  it("should normalize scrollbar appearance", () => {
    // Test scrollbar styling
  });
});
```

## Implementation Phases

### Phase 1: Foundation

- Enhance platform detection
- Expand CSS custom properties system
- Implement base normalization rules

### Phase 2: Component-Specific Fixes

- Navigation button consistency
- Text rendering normalization
- Scrollbar standardization

### Phase 3: Advanced Compatibility

- High DPI support enhancement
- Browser-specific optimizations
- Performance optimization

### Phase 4: Testing & Validation

- Automated visual regression testing
- Cross-platform validation
- Documentation and maintenance guides

## Performance Considerations

### CSS Optimization

- Minimize platform-specific CSS overhead
- Use efficient selectors for platform detection
- Leverage CSS custom properties for dynamic values

### JavaScript Performance

- Cache platform detection results
- Minimize DOM manipulation for platform fixes
- Use requestAnimationFrame for layout adjustments

### Memory Management

- Avoid memory leaks in platform detection code
- Clean up event listeners and observers
- Optimize CSS custom property updates

## Security Considerations

### Content Security Policy

- Ensure platform detection doesn't violate CSP
- Validate any dynamic CSS injection
- Maintain security boundaries for cross-platform code

### Data Privacy

- Platform detection should not collect unnecessary user data
- Minimize fingerprinting potential
- Respect user privacy preferences
