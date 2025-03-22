import crypto from 'crypto';

/**
 * Generates a random string of specified length
 * @param length The length of the random string to generate
 * @returns A random string of the specified length
 */
export function generateRandomString(length: number): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * Generates a secure hash of a string using SHA-256
 * @param data The string to hash
 * @returns The hashed string
 */
export function generateHash(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Encrypts data using AES-256-GCM
 * @param data The data to encrypt
 * @param key The encryption key
 * @returns The encrypted data and IV
 */
export function encrypt(data: string, key: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(key.padEnd(32, '0')),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final()
  ]);

  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex')
  };
}

/**
 * Decrypts data using AES-256-GCM
 * @param encryptedData The encrypted data
 * @param key The decryption key
 * @param iv The initialization vector used for encryption
 * @returns The decrypted data
 */
export function decrypt(encryptedData: string, key: string, iv: string): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key.padEnd(32, '0')),
    Buffer.from(iv, 'hex')
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, 'hex')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
} 