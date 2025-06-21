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
        }
    }

    // Send message to content script
    async function sendToContentScript(message) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;

            const response = await chrome.tabs.sendMessage(tab.id, message);
            console.log('Response from content script:', response);
            return response;
        } catch (error) {
            console.error('Error sending message to content script:', error);
            return null;
        }
    }

    // Update UI display
    function updateDisplay(rate) {
        currentRate = rate;
        speedValue.textContent = `${rate.toFixed(2)}×`;
        
        const percentage = ((rate - 1) * 100).toFixed(1);
        const percentageStr = rate < 1 ? `${percentage}%` : `+${percentage}%`;
        speedPercentage.textContent = percentageStr;
        
        // Update slider background
        const sliderPercentage = ((rate - 0.1) / (4.0 - 0.1)) * 100;
        speedSlider.style.background = `linear-gradient(to right, #4ecdc4 0%, #4ecdc4 ${sliderPercentage}%, #333 ${sliderPercentage}%, #333 100%)`;
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
        const rate = parseFloat(e.target.value);
        updateDisplay(rate);
        await sendToContentScript({
            type: 'SET_PLAYBACK_RATE',
            rate: rate
        });
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

    // Get current status from content script
    async function getCurrentStatus() {
        const response = await sendToContentScript({
            type: 'GET_STATUS'
        });
        
        if (response && response.success) {
            updateDisplay(response.rate || 1.0);
            updatePitchToggle(response.preservesPitch || false);
            speedSlider.value = response.rate || 1.0;
        }
    }

    // Initialize
    const isYouTube = await checkYouTubeStatus();
    if (isYouTube) {
        await getCurrentStatus();
    }
});
