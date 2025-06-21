# YouTube Tempo Adjust Extension

## Installation Instructions

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Navigate to this folder and select it
5. The extension should now be loaded and visible in your extensions list

## Usage

1. Navigate to any YouTube video (youtube.com/watch?v=...)
2. The tempo control UI will automatically appear in the top-right corner
3. Use the popup by clicking the extension icon in the toolbar for quick controls
4. Adjust playback speed from 0.1x to 4.0x with fine-grained controls
5. Toggle pitch preservation on/off

## Features

- **Floating UI**: Advanced tempo control interface that appears on YouTube video pages
- **Fine Controls**: Slider with 0.01x precision, fine-tune buttons (±0.05x), and quick presets
- **Pitch Preservation**: Toggle to maintain audio pitch at different speeds
- **Popup Interface**: Quick access controls through the extension toolbar
- **Seamless Integration**: Works with YouTube's single-page app navigation
- **Visual Feedback**: Real-time speed display and percentage indicators

## Files

- `youtube-manifest.json` - Extension manifest
- `youtube-tempo-content.js` - Main content script with UI and video control
- `youtube-popup.html` - Popup interface HTML
- `youtube-popup.js` - Popup interface JavaScript
- `icons/` - Extension icons (16, 32, 48, 128px)

Built with vanilla JavaScript for optimal performance and compatibility.
