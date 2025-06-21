// Background Service Worker - Injects content script into YouTube pages

console.log('🔧 BACKGROUND: Service worker started');

// Function to inject content script
async function injectContentScript(tabId) {
    try {
        console.log('🔧 BACKGROUND: Injecting content script into tab:', tabId);
        
        // First inject the content script
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['youtube-tempo-content.js']
        });
        
        console.log('🔧 BACKGROUND: Content script injected successfully');
        return true;
    } catch (error) {
        console.error('🔧 BACKGROUND: Failed to inject content script:', error);
        return false;
    }
}

// Listen for tab updates (when user navigates to YouTube)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only act when the page is completely loaded
    if (changeInfo.status === 'complete' && tab.url) {
        const isYouTube = tab.url.includes('youtube.com') || tab.url.includes('youtube-nocookie.com');
        
        if (isYouTube) {
            console.log('🔧 BACKGROUND: YouTube page detected:', tab.url);
            await injectContentScript(tabId);
        }
    }
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
    console.log('🔧 BACKGROUND: Extension icon clicked');
    
    if (tab.url && (tab.url.includes('youtube.com') || tab.url.includes('youtube-nocookie.com'))) {
        await injectContentScript(tab.id);
    }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log('🔧 BACKGROUND: Message received:', message);
    
    if (message.type === 'INJECT_CONTENT_SCRIPT') {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                const success = await injectContentScript(tab.id);
                sendResponse({ success: success });
            } else {
                sendResponse({ success: false, error: 'No active tab' });
            }
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }
});

console.log('🔧 BACKGROUND: Service worker setup complete');
