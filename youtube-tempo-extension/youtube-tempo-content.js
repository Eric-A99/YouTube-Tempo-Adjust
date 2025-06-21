// YouTube Tempo Adjust Extension - Content Script
// Adjusts the playback speed of YouTube videos with smooth slider controls

/**
 * Project: YouTube Tempo Adjust
 * Author: Eric
 * Created: June 19, 2025
 * Description: Chrome extension with slider-focused tempo control
 */

class YouTubeTempoController {
    constructor() {
        this.video = null;
        this.playbackRate = 1.0;
        this.preservesPitch = false;
        this.initialized = false;
        this.ui = null;
        this.isVisible = true;
        this.init();
    }

    // Convert percentage to playback rate
    percentageToRate(percentage) {
        // -16% to +16% range
        return 1.0 + (percentage / 100);
    }

    // Convert playback rate to percentage
    rateToPercentage(rate) {
        return (rate - 1.0) * 100;
    }

    init() {
        console.log('🎵 YouTube Tempo Controller initialized');
        
        // Add loading notification
        this.showNotification('🎵 YouTube Tempo Extension Loaded!', '#4ecdc4');
        
        this.waitForVideo();
    }

    showNotification(text, color = '#4ecdc4') {
        const existing = document.getElementById('yt-tempo-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.id = 'yt-tempo-notification';
        notification.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: ${color} !important;
            color: white !important;
            padding: 8px 16px !important;
            border-radius: 20px !important;
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
            font-weight: bold !important;
            z-index: 999999 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        `;
        notification.textContent = text;
        
        (document.body || document.documentElement).appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    waitForVideo() {
        const checkForVideo = () => {
            try {
                this.video = document.querySelector('video');
                console.log('Checking for video element:', !!this.video, 'Path:', window.location.pathname);
                
                if (this.video && window.location.pathname === '/watch') {
                    console.log('Video found, setting up controller');
                    this.setupVideoController();
                    this.createUI();
                    this.initialized = true;
                    console.log('YouTube video found and controller attached');
                } else {
                    setTimeout(checkForVideo, 1000);
                }
            } catch (error) {
                console.error('Error in waitForVideo:', error);
                setTimeout(checkForVideo, 1000);
            }
        };
        checkForVideo();
    }

    setupVideoController() {
        if (!this.video) return;

        // Set initial values
        this.playbackRate = this.video.playbackRate || 1.0;
        this.preservesPitch = this.video.preservesPitch || false;

        // Listen for playback rate changes from YouTube's native controls
        this.video.addEventListener('ratechange', () => {
            if (Math.abs(this.video.playbackRate - this.playbackRate) > 0.001) {
                this.playbackRate = this.video.playbackRate;
                this.updateUI();
            }
        });

        // Apply preserve pitch setting
        this.video.preservesPitch = this.preservesPitch;
    }

    setPlaybackRate(rate) {
        console.log('🎚️ setPlaybackRate called with:', rate);
        console.log('🎚️ Video element exists:', !!this.video);
        
        if (!this.video) {
            console.error('❌ No video element found');
            return;
        }
        
        console.log('🎚️ Video current playbackRate:', this.video.playbackRate);
        
        this.playbackRate = Math.max(0.1, Math.min(4.0, rate));
        console.log('🎚️ Setting video playbackRate to:', this.playbackRate);
        
        this.video.playbackRate = this.playbackRate;
        
        console.log('🎚️ Video playbackRate after setting:', this.video.playbackRate);
        
        this.updateUI();
        
        // Notify popup of rate change
        try {
            chrome.runtime.sendMessage({
                type: 'PLAYBACK_RATE_UPDATED',
                rate: this.playbackRate
            });
        } catch (error) {
            // Ignore errors when popup is not open
        }
    }

    togglePreservesPitch() {
        if (!this.video) return;
        
        this.preservesPitch = !this.preservesPitch;
        this.video.preservesPitch = this.preservesPitch;
        this.updateUI();
    }

    reset() {
        this.setPlaybackRate(1.0);
        if (this.slider) {
            this.slider.value = 1.0;
            this.updateSliderBackground();
        }
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
        if (this.ui) {
            this.ui.style.opacity = this.isVisible ? '1' : '0.3';
        }
    }

    createUI() {
        if (this.ui) {
            this.ui.remove();
        }

        // Create main container with prominent design
        this.ui = document.createElement('div');
        this.ui.id = 'youtube-tempo-adjust';
        this.ui.style.cssText = `
            position: fixed;
            top: 100px;
            right: 24px;
            background: linear-gradient(145deg, rgba(20, 20, 20, 0.98), rgba(40, 40, 40, 0.95));
            color: white;
            padding: 24px;
            border-radius: 16px;
            font-family: "YouTube Sans", "Roboto", -apple-system, sans-serif;
            z-index: 10000;
            width: 280px;
            box-shadow: 
                0 12px 40px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform: translateX(0);
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        `;

        const title = document.createElement('div');
        title.innerHTML = '🎵 <strong>Tempo Fader</strong>';
        title.style.cssText = `
            font-size: 18px;
            font-weight: 600;
            color: #fff;
            letter-spacing: -0.5px;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #fff;
            font-size: 18px;
            cursor: pointer;
            padding: 6px;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        });

        closeBtn.addEventListener('click', () => {
            this.ui.style.transform = 'translateX(100%)';
            setTimeout(() => {
                this.ui.style.display = 'none';
            }, 400);
        });

        // Large speed display
        const speedContainer = document.createElement('div');
        speedContainer.style.cssText = `
            text-align: center;
            margin-bottom: 24px;
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const mainSpeedValue = document.createElement('div');
        mainSpeedValue.style.cssText = `
            font-size: 48px;
            font-weight: 800;
            background: linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1);
            background-size: 300% 300%;
            animation: gradientShift 3s ease infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            font-family: 'SF Pro Display', -apple-system, sans-serif;
        `;

        const percentageDisplay = document.createElement('div');
        percentageDisplay.style.cssText = `
            font-size: 16px;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 500;
            letter-spacing: 1px;
        `;

        // MAIN SLIDER - Extra Prominent
        const sliderContainer = document.createElement('div');
        sliderContainer.style.cssText = `
            margin-bottom: 20px;
            background: rgba(255, 255, 255, 0.03);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const sliderLabel = document.createElement('div');
        sliderLabel.innerHTML = '🎚️ <strong>SPEED FADER</strong>';
        sliderLabel.style.cssText = `
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 16px;
            text-align: center;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
        `;

        // Main slider with custom styling
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '-16';
        slider.max = '16';
        slider.step = '0.5';
        slider.value = '0'; // 0% = 1.0x speed
        slider.style.cssText = `
            width: 100%;
            height: 12px;
            background: linear-gradient(to right, #333 0%, #333 100%);
            outline: none;
            border-radius: 6px;
            -webkit-appearance: none;
            appearance: none;
            cursor: pointer;
            margin-bottom: 12px;
        `;

        // Speed range indicators
        const rangeIndicators = document.createElement('div');
        rangeIndicators.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            font-weight: 500;
        `;

        const speeds = ['-16%', '-8%', '0%', '+8%', '+16%'];
        speeds.forEach((speed, index) => {
            const indicator = document.createElement('div');
            indicator.textContent = speed;
            if (index === 2) { // Highlight 0% (middle)
                indicator.style.color = '#4ecdc4';
                indicator.style.fontWeight = '600';
            }
            rangeIndicators.appendChild(indicator);
        });

        // Quick preset buttons - REMOVED

        // Fine controls - REMOVED

        // Pitch toggle
        const pitchToggle = document.createElement('button');
        pitchToggle.style.cssText = `
            padding: 16px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border-radius: 12px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        `;

        // Add gradient animation styles
        const animationStyles = document.createElement('style');
        animationStyles.textContent = `
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            #youtube-tempo-adjust input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: linear-gradient(135deg, #4ecdc4, #45b7d1);
                cursor: pointer;
                border: 3px solid #fff;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                transition: all 0.2s ease;
            }
            
            #youtube-tempo-adjust input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
            }
            
            #youtube-tempo-adjust input[type="range"]::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: linear-gradient(135deg, #4ecdc4, #45b7d1);
                cursor: pointer;
                border: 3px solid #fff;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            }
        `;
        document.head.appendChild(animationStyles);

        // Event listeners
        slider.addEventListener('input', (e) => {
            const percentage = parseFloat(e.target.value);
            const rate = this.percentageToRate(percentage);
            this.setPlaybackRate(rate);
            this.updateSliderBackground();
        });

        pitchToggle.addEventListener('click', () => {
            this.togglePreservesPitch();
        });

        decreaseBtn.addEventListener('click', () => {
            const newRate = Math.max(0.1, this.playbackRate - 0.05);
            this.setPlaybackRate(newRate);
            slider.value = newRate;
            this.updateSliderBackground();
        });

        increaseBtn.addEventListener('click', () => {
            const newRate = Math.min(4.0, this.playbackRate + 0.05);
            this.setPlaybackRate(newRate);
            slider.value = newRate;
            this.updateSliderBackground();
        });

        resetBtn.addEventListener('click', () => {
            this.reset();
        });

        // Assemble UI
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        speedContainer.appendChild(mainSpeedValue);
        speedContainer.appendChild(percentageDisplay);
        
        sliderContainer.appendChild(sliderLabel);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(rangeIndicators);
         this.ui.appendChild(header);
        this.ui.appendChild(speedContainer);
        this.ui.appendChild(sliderContainer);
        this.ui.appendChild(pitchToggle);

        document.body.appendChild(this.ui);

        // Store references
        this.mainSpeedValue = mainSpeedValue;
        this.percentageDisplay = percentageDisplay;
        this.pitchToggle = pitchToggle;
        this.slider = slider;
        this.buttonsGrid = buttonsGrid;

        this.updateUI();
        this.updateSliderBackground();
    }

    updateSliderBackground() {
        if (!this.slider) return;
        
        const percentage = this.rateToPercentage(this.playbackRate);
        const sliderPercentage = ((percentage + 16) / 32) * 100; // Convert -16/+16 to 0/100
        this.slider.style.background = `linear-gradient(to right, #3ea6ff 0%, #3ea6ff ${sliderPercentage}%, #333 ${sliderPercentage}%, #333 100%)`;
    }

    updateUI() {
        if (!this.mainSpeedValue || !this.pitchToggle) return;

        const percentage = this.rateToPercentage(this.playbackRate);
        const percentageStr = percentage < 0 ? 
            `${percentage.toFixed(1)}%` : 
            `+${percentage.toFixed(1)}%`;
        
        this.mainSpeedValue.textContent = `${this.playbackRate.toFixed(2)}×`;
        this.percentageDisplay.textContent = percentageStr;
        
        this.pitchToggle.innerHTML = this.preservesPitch ? 
            '🎵 Preserve Pitch: <strong>ON</strong>' : 
            '🎵 Preserve Pitch: <strong>OFF</strong>';
        
        this.pitchToggle.style.background = this.preservesPitch ? '#3ea6ff' : '#222';
        this.pitchToggle.style.borderColor = this.preservesPitch ? '#3ea6ff' : '#444';
    }

    destroy() {
        if (this.ui) {
            this.ui.remove();
            this.ui = null;
        }
    }
}

// Global controller instance
let tempoController = null;

// Initialize controller when on a watch page
function initializeController() {
    try {
        console.log('Initializing controller, current path:', window.location.pathname);
        
        if (window.location.pathname === '/watch' && !tempoController) {
            console.log('Creating new YouTube tempo controller');
            tempoController = new YouTubeTempoController();
        } else if (window.location.pathname !== '/watch' && tempoController) {
            console.log('Destroying controller - not on watch page');
            tempoController.destroy();
            tempoController = null;
        }
    } catch (error) {
        console.error('Error initializing controller:', error);
    }
}

// Handle initial page load
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initializeController);
} else {
    console.log('Document ready, initializing immediately');
    initializeController();
}

// Handle YouTube's SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setTimeout(initializeController, 1000); // Delay to ensure video element is available
    }
}).observe(document, { subtree: true, childList: true });

// Message listener for popup commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        console.log('🎵 Content script received message:', message);
        console.log('🎵 Controller exists:', !!tempoController);
        console.log('🎵 Video element exists:', !!tempoController?.video);
        
        if (!tempoController) {
            console.warn('❌ Controller not initialized');
            sendResponse({ success: false, error: 'Controller not initialized' });
            return true;
        }

        switch (message.type) {
            case 'SET_PLAYBACK_RATE':
                console.log('🎚️ Setting playback rate to:', message.rate);
                console.log('🎚️ Current video playback rate before:', tempoController.video?.playbackRate);
                
                tempoController.setPlaybackRate(message.rate);
                
                console.log('🎚️ Current video playback rate after:', tempoController.video?.playbackRate);
                console.log('🎚️ Controller playback rate:', tempoController.playbackRate);
                
                if (tempoController.slider) {
                    const percentage = tempoController.rateToPercentage(message.rate);
                    tempoController.slider.value = percentage;
                    tempoController.updateSliderBackground();
                }
                sendResponse({ success: true, actualRate: tempoController.video?.playbackRate });
                break;
                
            case 'TOGGLE_PRESERVE_PITCH':
                console.log('Toggling preserve pitch');
                tempoController.togglePreservesPitch();
                sendResponse({ success: true });
                break;
                
            case 'GET_STATUS':
                const status = { 
                    success: true, 
                    rate: tempoController.playbackRate,
                    preservesPitch: tempoController.preservesPitch
                };
                console.log('Sending status:', status);
                sendResponse(status);
                break;
                
            default:
                console.warn('Unknown message type:', message.type);
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('Error in message listener:', error);
        sendResponse({ success: false, error: error.message });
    }
    
    return true; // Indicates we will send a response asynchronously
});