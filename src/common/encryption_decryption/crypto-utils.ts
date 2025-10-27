import * as crypto from 'crypto';

// Load the secret key from environment variables
const secretKey = process.env.COOKIES_ENCRYPTION;

if (!secretKey) {
  throw new Error('COOKIES_ENCRYPTION is not defined in environment variables');
}

// Convert the key into a valid 256-bit key for AES-256
const key = crypto.createHash('sha256').update(secretKey).digest();

console.log('Encryption key initialized successfully',key);

// Encrypt function
export function encrypt(data: string | null | undefined): string | null {
  if (!data || typeof data !== 'string') return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}


// Decrypt function
export function decrypt(encryptedData: string): string {
  const [iv, encrypted] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
