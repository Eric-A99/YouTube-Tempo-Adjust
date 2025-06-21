// YouTube Tempo Adjust - Popup Script (Fader-Only Version)

document.addEventListener('DOMContentLoaded', async () => {
    const statusContainer = document.getElementById('statusContainer');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statusMessage = document.getElementById('statusMessage');
    const speedValue = document.getElementById('speedValue');
    const speedPercentage = document.getElementById('speedPercentage');
    const speedSlider = document.getElementById('speedSlider');
    const pitchToggle = document.getElementById('pitchToggle');
    const resetButton = document.getElementById('resetButton');

    let currentRate = 1.0;
    let preservesPitch = false;

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
        
        // Show/hide controls based on status
        const controls = document.querySelector('.speed-display');
        const faderContainer = document.querySelector('.fader-container');
        if (controls && faderContainer) {
            controls.style.display = type === 'active' ? 'block' : 'none';
            faderContainer.style.display = type === 'active' ? 'block' : 'none';
            pitchToggle.style.display = type === 'active' ? 'block' : 'none';
            resetButton.style.display = type === 'active' ? 'block' : 'none';
        }
    }

    // Send message to content script
    async function sendToContentScript(message) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;

            console.log('🔧 POPUP: Sending message to content script:', message);
            
            try {
                const response = await chrome.tabs.sendMessage(tab.id, message);
                console.log('🔧 POPUP: Response from content script:', response);
                return response;
            } catch (error) {
                console.log('🔧 POPUP: Content script not found, requesting injection...');
                
                // Try to inject content script
                const injectionResult = await chrome.runtime.sendMessage({
                    type: 'INJECT_CONTENT_SCRIPT'
                });
                
                if (injectionResult && injectionResult.success) {
                    console.log('🔧 POPUP: Content script injected, retrying message...');
                    // Wait a moment for injection to complete
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Retry the original message
                    const response = await chrome.tabs.sendMessage(tab.id, message);
                    console.log('🔧 POPUP: Response after injection:', response);
                    return response;
                } else {
                    console.error('🔧 POPUP: Failed to inject content script');
                    return null;
                }
            }
        } catch (error) {
            console.error('🔧 POPUP: Error sending message:', error);
            return null;
        }
    }

    // Convert percentage to playback rate
    function percentageToRate(percentage) {
        // -16% to +16% range
        // -16% = 0.84x, 0% = 1.0x, +16% = 1.16x
        return 1.0 + (percentage / 100);
    }

    // Convert playback rate to percentage
    function rateToPercentage(rate) {
        // Convert rate back to percentage
        return (rate - 1.0) * 100;
    }

    // Update UI display
    function updateDisplay(percentage) {
        const rate = percentageToRate(percentage);
        currentRate = rate;
        speedValue.textContent = `${rate.toFixed(2)}×`;
        
        const displayPercentage = percentage.toFixed(1);
        const percentageStr = percentage < 0 ? `${displayPercentage}%` : `+${displayPercentage}%`;
        speedPercentage.textContent = percentageStr;
        
        // Update slider background with center-origin bidirectional progress bar
        let gradient;
        if (percentage === 0) {
            // At center (0%): no blue progress, all dark
            gradient = `linear-gradient(to right, #333 0%, #333 100%)`;
        } else if (percentage < 0) {
            // Negative percentages: blue extends from center to the left
            const centerPos = 50; // Center is at 50%
            const progressWidth = Math.abs(percentage) / 16 * 50; // Scale to 0-50% range
            const progressStart = centerPos - progressWidth;
            gradient = `linear-gradient(to right, #333 0%, #333 ${progressStart}%, #4ecdc4 ${progressStart}%, #4ecdc4 ${centerPos}%, #333 ${centerPos}%, #333 100%)`;
        } else {
            // Positive percentages: blue extends from center to the right
            const centerPos = 50; // Center is at 50%
            const progressWidth = percentage / 16 * 50; // Scale to 0-50% range
            const progressEnd = centerPos + progressWidth;
            gradient = `linear-gradient(to right, #333 0%, #333 ${centerPos}%, #4ecdc4 ${centerPos}%, #4ecdc4 ${progressEnd}%, #333 ${progressEnd}%, #333 100%)`;
        }
        speedSlider.style.background = gradient;
    }

    // Update pitch toggle display
    function updatePitchToggle(preserves) {
        preservesPitch = preserves;
        pitchToggle.innerHTML = preserves ? 
            '🎵 Preserve Pitch: <strong>ON</strong>' : 
            '🎵 Preserve Pitch: <strong>OFF</strong>';
        
        if (preserves) {
            pitchToggle.classList.add('active');
        } else {
            pitchToggle.classList.remove('active');
        }
    }

    // Slider event handler
    speedSlider.addEventListener('input', async (e) => {
        const percentage = parseFloat(e.target.value);
        const rate = percentageToRate(percentage);
        
        console.log('🎚️ Popup: Slider changed to:', percentage + '%', '(' + rate.toFixed(2) + 'x)');
        
        updateDisplay(percentage);
        
        console.log('🎚️ Popup: Sending SET_PLAYBACK_RATE message');
        const response = await sendToContentScript({
            type: 'SET_PLAYBACK_RATE',
            rate: rate
        });
        
        console.log('🎚️ Popup: Response from content script:', response);
    });

    // Pitch toggle event handler
    pitchToggle.addEventListener('click', async () => {
        const response = await sendToContentScript({
            type: 'TOGGLE_PRESERVE_PITCH'
        });
        
        if (response && response.success) {
            updatePitchToggle(!preservesPitch);
        }
    });

    // Reset button event handler
    resetButton.addEventListener('click', async () => {
        console.log('🔄 Popup: Reset button clicked, resetting to 0%');
        
        // Reset slider to center position (0%)
        speedSlider.value = 0;
        
        // Update display
        updateDisplay(0);
        
        // Send reset command to content script
        const response = await sendToContentScript({
            type: 'SET_PLAYBACK_RATE',
            rate: 1.0
        });
        
        console.log('🔄 Popup: Reset response from content script:', response);
    });

    // Get current status from content script
    async function getCurrentStatus() {
        const response = await sendToContentScript({
            type: 'GET_STATUS'
        });
        
        if (response && response.success) {
            const rate = response.rate || 1.0;
            const percentage = rateToPercentage(rate);
            
            updateDisplay(percentage);
            updatePitchToggle(response.preservesPitch || false);
            speedSlider.value = percentage;
        }
    }

    // Initialize
    const isYouTube = await checkYouTubeStatus();
    if (isYouTube) {
        await getCurrentStatus();
    }
});
