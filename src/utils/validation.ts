// HTML encoding for XSS prevention
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

export const validateId = (id: number): number => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid ID provided");
  }
  return id;
};