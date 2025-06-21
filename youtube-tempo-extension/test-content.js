// Simple test content script to verify extension loading
console.log('YouTube Tempo Extension: Test content script loaded!', new Date().toISOString());

// Test basic functionality
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('Chrome runtime available');
} else {
    console.error('Chrome runtime not available');
}

// Test video detection
const video = document.querySelector('video');
console.log('Video element found:', !!video);

// Function to add indicator
function addIndicator() {
    // Remove any existing indicator
    const existingIndicator = document.getElementById('youtube-tempo-test');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Add a simple visible indicator
    const indicator = document.createElement('div');
    indicator.id = 'youtube-tempo-test';
    indicator.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: red !important;
        color: white !important;
        padding: 10px !important;
        z-index: 999999 !important;
        border-radius: 5px !important;
        font-family: Arial, sans-serif !important;
        font-size: 14px !important;
        font-weight: bold !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
        border: 2px solid white !important;
    `;
    indicator.textContent = 'YouTube Tempo Extension Loaded!';
    
    // Try multiple ways to append
    if (document.body) {
        document.body.appendChild(indicator);
        console.log('Indicator added to body');
    } else if (document.documentElement) {
        document.documentElement.appendChild(indicator);
        console.log('Indicator added to documentElement');
    } else {
        console.error('No parent element found for indicator');
        return;
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (indicator && indicator.parentNode) {
            indicator.remove();
            console.log('Indicator removed');
        }
    }, 5000);
}

// Try to add indicator immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addIndicator);
} else {
    addIndicator();
}

// Also try after a delay
setTimeout(addIndicator, 1000);
setTimeout(addIndicator, 3000);
