import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// 从环境变量获取加密密钥
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // 如果没有设置加密密钥，使用默认密钥（仅用于开发环境）
    console.warn('ENCRYPTION_KEY not set, using default key for development');
    return 'xiaozhi-default-encryption-key-32b';
  }
  return key;
}

// 确保密钥长度为 32 字节（256 位）
function padKey(key: string): Buffer {
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * 加密文本
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  const key = padKey(getEncryptionKey());
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // 返回 IV + 加密内容
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * 解密文本
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  
  try {
    const key = padKey(getEncryptionKey());
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText;
  }
}
