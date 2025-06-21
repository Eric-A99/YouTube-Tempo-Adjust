// YouTube Tempo Adjust - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
    const statusContainer = document.getElementById('statusContainer');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statusMessage = document.getElementById('statusMessage');
    const controlsContainer = document.getElementById('controlsContainer');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const resetBtn = document.getElementById('resetBtn');
    const togglePitchBtn = document.getElementById('togglePitchBtn');

    // Check if we're on a YouTube page
    async function checkYouTubeStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                setStatus('inactive', 'No active tab', 'Please open a YouTube video to use this extension.');
                return false;
            }

            const isYouTube = tab.url && (
                tab.url.includes('youtube.com/watch') || 
                tab.url.includes('youtube-nocookie.com/watch')
            );

            if (!isYouTube) {
                setStatus('inactive', 'Not on YouTube', 'Please navigate to a YouTube video to use the tempo controls.');
                return false;
            }

            setStatus('active', 'YouTube Detected', 'Tempo controls are available on this page.');
            return true;
        } catch (error) {
            console.error('Error checking YouTube status:', error);
            setStatus('inactive', 'Error', 'Unable to detect page status.');
            return false;
        }
    }

    function setStatus(type, text, message) {
        statusContainer.className = `status ${type}`;
        statusDot.className = `status-dot ${type}`;
        statusText.textContent = text;
        statusMessage.textContent = message;
        controlsContainer.style.display = type === 'active' ? 'block' : 'none';
    }

    // Send message to content script
    async function sendToContentScript(message) {
        try {
            console.log('Sending message to content script:', message);
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                const response = await chrome.tabs.sendMessage(tab.id, message);
                console.log('Response from content script:', response);
                return response;
            } else {
                console.warn('No active tab found');
            }
        } catch (error) {
            console.error('Error sending message to content script:', error);
            // Don't throw - just log the error so popup continues to work
        }
    }

    // Set up preset buttons
    presetButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const speed = parseFloat(button.dataset.speed);
            
            // Update button states
            presetButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Send speed change to content script
            await sendToContentScript({
                type: 'SET_PLAYBACK_RATE',
                rate: speed
            });
        });
    });

    // Set up reset button
    resetBtn.addEventListener('click', async () => {
        // Reset to 1x speed
        presetButtons.forEach(btn => btn.classList.remove('active'));
        const defaultBtn = document.querySelector('[data-default="true"]');
        if (defaultBtn) {
            defaultBtn.classList.add('active');
        }
        
        await sendToContentScript({
            type: 'SET_PLAYBACK_RATE',
            rate: 1.0
        });
    });

    // Set up pitch toggle button
    togglePitchBtn.addEventListener('click', async () => {
        await sendToContentScript({
            type: 'TOGGLE_PRESERVE_PITCH'
        });
    });

    // Initialize
    const isYouTube = await checkYouTubeStatus();
    
    if (isYouTube) {
        // Set default active button
        const defaultBtn = document.querySelector('[data-default="true"]');
        if (defaultBtn) {
            defaultBtn.classList.add('active');
        }
    }

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'PLAYBACK_RATE_UPDATED') {
            // Update active button based on current rate
            presetButtons.forEach(btn => {
                btn.classList.remove('active');
                const btnSpeed = parseFloat(btn.dataset.speed);
                if (Math.abs(btnSpeed - message.rate) < 0.01) {
                    btn.classList.add('active');
                }
            });
        }
    });
});
