/**
 * Truncates a string to a specified length and adds an ellipsis in the middle or end of the string
 * @param text - The string to truncate
 * @param leftLength - Maximum length of the left side of the truncated string
 * @param rightLength - Maximum length of the right side of the truncated string
 * @returns Truncated string
 */
const truncate = (text: string, leftLength = 4, rightLength = 4) => {
  if (!text) return text;

  // If the string is shorter than or equal to the combined length, return it as is
  if (text.length <= leftLength + rightLength + 3) return text;

  const start = text.slice(0, leftLength);
  const end = text.slice(-rightLength);

  return `${start}...${end}`;
};

export { truncate };
