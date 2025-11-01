/**
 * Audio Notification Utility
 * Provides audio notifications with fallback to Web Audio API
 */

/**
 * Generate a pleasant notification beep using Web Audio API
 * This is used as a fallback when kitchen-bell.mp3 is not available
 */
export function generateNotificationBeep() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create oscillator for the sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure pleasant bell-like sound
    oscillator.type = 'sine';
    oscillator.frequency.value = 800; // Higher pitch for notification

    // Create envelope for more pleasant sound
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // Decay

    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + 0.5);

    // Play second beep for double notification
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);

      oscillator2.type = 'sine';
      oscillator2.frequency.value = 1000; // Slightly higher

      const now2 = audioContext.currentTime;
      gainNode2.gain.setValueAtTime(0, now2);
      gainNode2.gain.linearRampToValueAtTime(0.3, now2 + 0.01);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, now2 + 0.4);

      oscillator2.start(now2);
      oscillator2.stop(now2 + 0.4);
    }, 150);

  } catch (error) {
  }
}

/**
 * Create an audio player with fallback support
 * @param {string} soundUrl - URL to the sound file
 * @returns {Object} Audio player with play method
 */
export function createAudioPlayer(soundUrl = '/sounds/kitchen-bell.mp3') {
  let audioElement = null;
  let useWebAudioFallback = false;

  // Try to load the audio file
  try {
    audioElement = new Audio(soundUrl);
    audioElement.volume = 0.7;

    // Check if file exists by attempting to load
    audioElement.addEventListener('error', () => {
      useWebAudioFallback = true;
      audioElement = null;
    });

    // Preload the audio
    audioElement.load();
  } catch (error) {
    useWebAudioFallback = true;
  }

  return {
    play: () => {
      if (useWebAudioFallback || !audioElement) {
        generateNotificationBeep();
      } else {
        audioElement.play().catch((error) => {
          generateNotificationBeep();
        });
      }
    },

    setVolume: (volume) => {
      if (audioElement) {
        audioElement.volume = Math.max(0, Math.min(1, volume));
      }
    },

    isUsingFallback: () => useWebAudioFallback
  };
}

export default {
  generateNotificationBeep,
  createAudioPlayer
};
