// File validation utilities
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILENAME_LENGTH = 255;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'application/pdf'
];

export const validateFile = (file) => {
  const errors = [];

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push(`Unsupported file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File too large: ${formatFileSize(file.size)} (max ${formatFileSize(MAX_FILE_SIZE)})`);
  }

  // Check filename length
  if (file.name.length > MAX_FILENAME_LENGTH) {
    errors.push(`Filename too long: ${file.name.length} characters (max ${MAX_FILENAME_LENGTH})`);
  }

  // Check for empty files
  if (file.size === 0) {
    errors.push('File is empty');
  }

  // Basic security check for suspicious extensions
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif'];
  const fileName = file.name.toLowerCase();
  if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
    errors.push('Potentially unsafe file extension detected');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  return true;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const sanitizeFileName = (fileName) => {
  // Remove or replace unsafe characters
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_') // Replace unsafe chars with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .substring(0, MAX_FILENAME_LENGTH); // Truncate if too long
};

export const validateFileSignature = async (file) => {
  // Read first few bytes to verify file signature
  const buffer = await file.slice(0, 8).arrayBuffer();
  const view = new Uint8Array(buffer);
  
  if (file.type === 'application/pdf') {
    // PDF should start with %PDF-
    if (view[0] !== 0x25 || view[1] !== 0x50 || view[2] !== 0x44 || view[3] !== 0x46) {
      throw new Error('Invalid PDF file: File header does not match PDF format');
    }
  } else if (file.type.startsWith('image/')) {
    // Basic image format validation
    const isValidImage = 
      (view[0] === 0xFF && view[1] === 0xD8) || // JPEG
      (view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4E && view[3] === 0x47) || // PNG
      (view[0] === 0x47 && view[1] === 0x49 && view[2] === 0x46) || // GIF
      (view[0] === 0x42 && view[1] === 0x4D); // BMP
    
    if (!isValidImage) {
      throw new Error('Invalid image file: File header does not match expected image format');
    }
  }
  
  return true;
}; 