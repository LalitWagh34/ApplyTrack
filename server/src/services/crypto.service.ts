/**
 * Cryptographic Vault Service
 * AES-256-GCM authenticated encryption/decryption for OAuth tokens and sensitive credentials at rest.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // 64 hex characters = exactly 32 bytes (256 bits) for AES-256
    this.key = Buffer.from(env.TOKEN_ENCRYPTION_KEY, 'hex');
    if (this.key.length !== 32) {
      throw new Error('TOKEN_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)');
    }
  }

  /**
   * Encrypts plaintext string using AES-256-GCM with a random 12-byte IV.
   * Output format: `${ivHex}:${authTagHex}:${ciphertextHex}`
   */
  public encrypt(plaintext: string): string {
    if (!plaintext) {
      return '';
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    const ivHex = iv.toString('hex');

    return `${ivHex}:${authTag}:${ciphertext}`;
  }

  /**
   * Decrypts formatted AES-256-GCM ciphertext `${ivHex}:${authTagHex}:${ciphertextHex}`.
   */
  public decrypt(encryptedPayload: string): string {
    if (!encryptedPayload) {
      return '';
    }

    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format. Expected iv:authTag:ciphertext');
    }

    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  }
}

export const cryptoService = new CryptoService();
export default cryptoService;
