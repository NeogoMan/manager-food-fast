/**
 * Currency utility functions for Moroccan Dirham (MAD) formatting
 */

/**
 * Format amount in Moroccan Dirham (MAD)
 * @param {number} amount - Price amount
 * @returns {string} Formatted price (e.g., "45,50 DH")
 */
export function formatMAD(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0,00 DH';
  }

  const formatted = new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);

  return `${formatted} DH`;
}

/**
 * Parse MAD input string to number
 * Handles: "45,50", "45.50", "1 250,50", "45,50 DH"
 * @param {string|number} value
 * @returns {number}
 */
export function parseMAD(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  // Remove "DH" suffix if present and trim
  let cleanedValue = value.toString().replace(/DH/gi, '').trim();

  // Remove spaces (thousand separators) and replace comma with dot
  cleanedValue = cleanedValue.replace(/\s/g, '').replace(',', '.');

  return parseFloat(cleanedValue) || 0;
}

/**
 * Format input field for MAD (for real-time formatting)
 * @param {string} value
 * @returns {string}
 */
export function formatMADInput(value) {
  const number = parseMAD(value);
  return formatMAD(number);
}

/**
 * Format number for input field (without DH suffix, for editing)
 * @param {number} value
 * @returns {string} - "45,50" format
 */
export function formatMADForInput(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }

  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export default {
  formatMAD,
  parseMAD,
  formatMADInput,
  formatMADForInput
};
