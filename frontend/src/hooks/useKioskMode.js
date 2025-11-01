/**
 * useKioskMode Hook
 *
 * Provides kiosk mode functionality:
 * - Fullscreen API integration
 * - Keyboard shortcut blocking
 * - Context menu prevention
 * - Navigation protection
 */

import { useEffect, useState } from 'react';

export function useKioskMode(options = {}) {
  const {
    enableFullscreen = true,
    blockKeyboardShortcuts = true,
    disableContextMenu = true,
    preventNavigation = true,
    autoEnterFullscreen = false,
  } = options;

  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * Enter fullscreen mode
   */
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;

      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        // Safari
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        // Firefox
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        // IE/Edge
        await elem.msRequestFullscreen();
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Exit fullscreen mode
   */
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  };

  useEffect(() => {
    // Track fullscreen state
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);
    };

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Auto-enter fullscreen if requested
    if (autoEnterFullscreen && enableFullscreen) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        enterFullscreen();
      }, 500);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [autoEnterFullscreen, enableFullscreen]);

  useEffect(() => {
    if (!blockKeyboardShortcuts) return;

    /**
     * Block dangerous keyboard shortcuts
     */
    const handleKeyDown = (e) => {
      // Block F11 (native fullscreen) - we handle it ourselves
      if (e.key === 'F11') {
        e.preventDefault();
        if (enableFullscreen) {
          toggleFullscreen();
        }
        return;
      }

      // Block Ctrl+W / Cmd+W (close tab)
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        return;
      }

      // Block Ctrl+Q / Cmd+Q (quit browser)
      if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
        e.preventDefault();
        return;
      }

      // Block Ctrl+T / Cmd+T (new tab)
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        return;
      }

      // Block Ctrl+N / Cmd+N (new window)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        return;
      }

      // Block Alt+F4 (close window)
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        return;
      }

      // Block F5 / Ctrl+R (refresh) - optional, can cause issues
      // Uncomment if you want to prevent refresh
      // if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
      //   e.preventDefault();
      //   return;
      // }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [blockKeyboardShortcuts, enableFullscreen, toggleFullscreen]);

  useEffect(() => {
    if (!disableContextMenu) return;

    /**
     * Disable right-click context menu
     */
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [disableContextMenu]);

  useEffect(() => {
    if (!preventNavigation) return;

    /**
     * Prevent accidental navigation with back button
     */
    const handlePopState = (e) => {
      // Allow React Router navigation
      // but prevent browser back to external pages
      if (window.history.state === null) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Push initial state
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [preventNavigation]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}

export default useKioskMode;
