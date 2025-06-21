// Debug Content Script - Robust version for YouTube SPA

(function() {
    'use strict';
    
    console.log('🚀 CONTENT SCRIPT: Starting (immediately executed)');
    console.log('🚀 CONTENT SCRIPT: URL:', window.location.href);
    console.log('🚀 CONTENT SCRIPT: Document state:', document.readyState);
    
    // Global variables
    let currentVideo = null;
    let isInitialized = false;
    
    // Show loading indicator immediately
    function showIndicator(text, color = '#4ecdc4') {
        const existing = document.getElementById('yt-tempo-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'yt-tempo-indicator';
        indicator.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: ${color} !important;
            color: white !important;
            padding: 10px !important;
            z-index: 999999 !important;
            border-radius: 5px !important;
            font-family: Arial, sans-serif !important;
            font-size: 14px !important;
            font-weight: bold !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
        `;
        indicator.textContent = text;
        
        // Try multiple ways to append
        (document.body || document.documentElement || document).appendChild(indicator);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (indicator && indicator.parentNode) {
                indicator.remove();
            }
        }, 3000);
    }
    
    // Find and test video control
    function findAndTestVideo() {
        console.log('🎥 CONTENT SCRIPT: Looking for video...');
        
        const video = document.querySelector('video');
        console.log('🎥 CONTENT SCRIPT: Video found:', !!video);
        
        if (video && video !== currentVideo) {
            currentVideo = video;
            console.log('🎥 CONTENT SCRIPT: New video detected, current rate:', video.playbackRate);
            
            // Test speed change
            try {
                const originalRate = video.playbackRate;
                video.playbackRate = 1.25;
                console.log('🎥 CONTENT SCRIPT: Speed changed to:', video.playbackRate);
                
                showIndicator(`Video Speed Test: ${video.playbackRate}x`, '#00ff00');
                
                // Reset after 2 seconds
                setTimeout(() => {
                    video.playbackRate = originalRate;
                    console.log('🎥 CONTENT SCRIPT: Speed reset to:', video.playbackRate);
                }, 2000);
                
                return true;
            } catch (error) {
                console.error('🎥 CONTENT SCRIPT: Error changing speed:', error);
                showIndicator('Video Control Error!', '#ff0000');
            }
        }
        
        return false;
    }
    
    // Message listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('📨 CONTENT SCRIPT: Message received:', message);
        
        try {
            if (message.type === 'SET_PLAYBACK_RATE') {
                const video = document.querySelector('video');
                if (video) {
                    const oldRate = video.playbackRate;
                    video.playbackRate = message.rate;
                    console.log('📨 CONTENT SCRIPT: Speed changed from', oldRate, 'to', video.playbackRate);
                    
                    showIndicator(`Speed: ${video.playbackRate}x`, '#0088ff');
                    
                    sendResponse({ 
                        success: true, 
                        oldRate: oldRate,
                        newRate: video.playbackRate 
                    });
                } else {
                    console.log('📨 CONTENT SCRIPT: No video found for speed change');
                    sendResponse({ success: false, error: 'No video found' });
                }
            } else if (message.type === 'GET_STATUS') {
                const video = document.querySelector('video');
                sendResponse({
                    success: true,
                    hasVideo: !!video,
                    rate: video?.playbackRate || 1.0,
                    url: window.location.href
                });
            } else {
                sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('📨 CONTENT SCRIPT: Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
        
        return true; // Keep response channel open
    });
    
    // Initialize immediately
    function initialize() {
        console.log('🔧 CONTENT SCRIPT: Initializing...');
        
        if (!isInitialized) {
            isInitialized = true;
            showIndicator('YouTube Tempo Extension Loaded!', '#4ecdc4');
        }
        
        findAndTestVideo();
    }
    
    // Try multiple initialization methods
    console.log('🔧 CONTENT SCRIPT: Setting up initialization...');
    
    // Method 1: Immediate
    if (document.readyState !== 'loading') {
        initialize();
    }
    
    // Method 2: DOMContentLoaded
    document.addEventListener('DOMContentLoaded', initialize);
    
    // Method 3: Window load
    window.addEventListener('load', initialize);
    
    // Method 4: Periodic check for YouTube SPA navigation
    let lastUrl = location.href;
    const urlChangeInterval = setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log('🔄 CONTENT SCRIPT: URL changed to:', currentUrl);
            setTimeout(initialize, 1000); // Delay for page to load
        }
    }, 1000);
    
    // Method 5: MutationObserver for dynamic content
    const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'VIDEO' || (node.querySelector && node.querySelector('video'))) {
                        shouldCheck = true;
                    }
                });
            }
        });
        
        if (shouldCheck) {
            console.log('🔄 CONTENT SCRIPT: Video element change detected');
            setTimeout(findAndTestVideo, 500);
        }
    });
    
    observer.observe(document, { childList: true, subtree: true });
    
    // Method 6: Delayed fallback checks
    setTimeout(initialize, 2000);
    setTimeout(initialize, 5000);
    setTimeout(initialize, 10000);
    
    console.log('🚀 CONTENT SCRIPT: Setup complete, waiting for video...');
    
})();
