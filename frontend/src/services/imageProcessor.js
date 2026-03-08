/**
 * Image Processor Service
 * Processes images for thermal printer printing (monochrome bitmap conversion)
 */

/**
 * Load image from URL with CORS proxy fallback
 * @param {string} url - Image URL
 * @param {number} timeout - Timeout in milliseconds (default 5000ms)
 * @param {boolean} useCorsProxy - Whether to use CORS proxy (default false)
 * @returns {Promise<HTMLImageElement>} Loaded image
 */
async function loadImageFromUrl(url, timeout = 5000, useCorsProxy = false) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS

    const timeoutId = setTimeout(() => {
      reject(new Error('Image loading timeout'));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);

      // If first attempt failed and we haven't tried CORS proxy yet, try with proxy
      if (!useCorsProxy) {
        console.log('Direct load failed, trying CORS proxy...');
        loadImageFromUrl(url, timeout, true)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('Failed to load image from URL (CORS blocked)'));
      }
    };

    // Use CORS proxy if requested (fallback)
    const imageUrl = useCorsProxy
      ? `https://corsproxy.io/?${encodeURIComponent(url)}`
      : url;

    img.src = imageUrl;
  });
}

/**
 * Resize image to fit maximum width while maintaining aspect ratio
 * @param {HTMLImageElement} img - Source image
 * @param {number} maxWidth - Maximum width in pixels
 * @returns {HTMLCanvasElement} Resized image on canvas
 */
function resizeImage(img, maxWidth = 384) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Calculate new dimensions maintaining aspect ratio
  let width = img.width;
  let height = img.height;

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // Ensure width is divisible by 8 (for byte alignment)
  width = Math.floor(width / 8) * 8;
  height = Math.floor(height);

  canvas.width = width;
  canvas.height = height;

  // Draw resized image
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

/**
 * Convert image to monochrome (1-bit black and white)
 * @param {ImageData} imageData - Image data from canvas
 * @param {number} threshold - Brightness threshold (0-255, default 128)
 * @returns {Uint8Array} Monochrome bitmap data (1 bit per pixel, packed into bytes)
 */
function convertToMonochrome(imageData, threshold = 128) {
  const width = imageData.width;
  const height = imageData.height;
  const pixels = imageData.data;

  // Calculate bitmap size (width must be divisible by 8)
  const bytesPerRow = Math.ceil(width / 8);
  const bitmapSize = bytesPerRow * height;
  const bitmap = new Uint8Array(bitmapSize);

  // Process each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4; // RGBA format
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];

      // Calculate brightness (grayscale conversion)
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      // Threshold to black or white
      const isBlack = brightness < threshold;

      if (isBlack) {
        // Set bit in bitmap (1 = black, 0 = white for thermal printers)
        const byteIndex = y * bytesPerRow + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8); // MSB first
        bitmap[byteIndex] |= (1 << bitIndex);
      }
    }
  }

  return bitmap;
}

/**
 * Process image for thermal printer
 * @param {string} url - Image URL
 * @param {number} maxWidth - Maximum width in pixels (default 200)
 * @param {number} threshold - Brightness threshold for monochrome conversion (default 128)
 * @returns {Promise<Object>} Processed image data { data: Uint8Array, width: number, height: number }
 */
export async function processImageForPrinter(url, maxWidth = 200, threshold = 128) {
  try {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid image URL');
    }

    // Ensure maxWidth is within valid range
    maxWidth = Math.max(100, Math.min(384, maxWidth));

    // Load image
    const img = await loadImageFromUrl(url);

    // Resize image
    const canvas = resizeImage(img, maxWidth);
    const ctx = canvas.getContext('2d');

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Convert to monochrome
    const bitmapData = convertToMonochrome(imageData, threshold);

    return {
      data: bitmapData,
      width: canvas.width,
      height: canvas.height,
      bytesPerRow: Math.ceil(canvas.width / 8)
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Validate image URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
export function isValidImageUrl(url) {
  try {
    const urlObj = new URL(url);
    const extension = urlObj.pathname.toLowerCase().split('.').pop();
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension);
  } catch {
    return false;
  }
}

export default {
  processImageForPrinter,
  isValidImageUrl
};
