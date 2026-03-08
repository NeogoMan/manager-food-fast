import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import imageCompression from 'browser-image-compression';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB before compression

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 600,
  useWebWorker: true,
  fileType: 'image/webp',
};

// Target aspect ratio matching the self-service card display (width / height)
const TARGET_ASPECT_RATIO = 4 / 3;
const TARGET_WIDTH = 600;
const TARGET_HEIGHT = Math.round(TARGET_WIDTH / TARGET_ASPECT_RATIO); // 450

/**
 * Crop and resize an image to the target aspect ratio using canvas.
 * Centers the crop on the source image so the most important part is kept.
 *
 * @param {File} file - The original image file
 * @returns {Promise<File>} A new File cropped and resized to the target dimensions
 */
async function cropToAspectRatio(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const { naturalWidth: sw, naturalHeight: sh } = img;
      const srcRatio = sw / sh;

      // Calculate the largest centered crop that matches TARGET_ASPECT_RATIO
      let cropW, cropH;
      if (srcRatio > TARGET_ASPECT_RATIO) {
        // Source is wider → crop sides
        cropH = sh;
        cropW = Math.round(sh * TARGET_ASPECT_RATIO);
      } else {
        // Source is taller → crop top/bottom
        cropW = sw;
        cropH = Math.round(sw / TARGET_ASPECT_RATIO);
      }

      const cropX = Math.round((sw - cropW) / 2);
      const cropY = Math.round((sh - cropH) / 2);

      // Draw onto a canvas at the target output size
      const canvas = document.createElement('canvas');
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          resolve(new File([blob], file.name, { type: 'image/webp' }));
        },
        'image/webp',
        0.85,
      );
    };
    const objectUrl = URL.createObjectURL(file);
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

/**
 * Validate a file before upload
 */
function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('TYPE_NOT_ALLOWED');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('FILE_TOO_LARGE');
  }
}

/**
 * Upload a menu item image to Firebase Storage.
 * Compresses the image client-side before uploading.
 *
 * @param {File} file - The image file to upload
 * @param {string} restaurantId - The restaurant's ID (for path isolation)
 * @param {string} itemId - The menu item ID (for unique naming)
 * @returns {Promise<string>} The download URL of the uploaded image
 */
export async function uploadMenuImage(file, restaurantId, itemId) {
  validateFile(file);

  // Crop to target aspect ratio, then compress
  const cropped = await cropToAspectRatio(file);
  const compressed = await imageCompression(cropped, COMPRESSION_OPTIONS);

  // Build storage path: menu-images/{restaurantId}/{itemId}_{timestamp}
  const timestamp = Date.now();
  const storagePath = `menu-images/${restaurantId}/${itemId}_${timestamp}`;
  const storageRef = ref(storage, storagePath);

  // Upload with content type metadata
  await uploadBytes(storageRef, compressed, {
    contentType: compressed.type || 'image/webp',
  });

  return getDownloadURL(storageRef);
}

/**
 * Delete a menu item image from Firebase Storage.
 *
 * @param {string} imageUrl - The full download URL of the image to delete
 */
export async function deleteMenuImage(imageUrl) {
  if (!imageUrl) return;

  try {
    // Extract the storage path from the download URL
    // Firebase Storage URLs contain the path encoded between /o/ and ?
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)/);
    if (!pathMatch) return;

    const storagePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    // If the file doesn't exist, that's fine — it was already deleted
    if (error.code === 'storage/object-not-found') return;
    throw error;
  }
}
