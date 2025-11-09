// Email encryption utilities using AES-GCM and SHA-256

export async function encryptEmail(email: string): Promise<{ ciphertext: string; digest: string }> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive key from ENVELOPE_MASTER_KEY
  const masterKey = process.env.ENVELOPE_MASTER_KEY;
  if (!masterKey) {
    throw new Error('ENVELOPE_MASTER_KEY is not set');
  }
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Encrypt email
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedEmail = encoder.encode(email);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedEmail
  );
  
  // Combine salt, iv, and ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertextBuffer.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertextBuffer), salt.length + iv.length);
  
  // Convert to base64
  const ciphertext = btoa(String.fromCharCode(...combined));
  
  // Create SHA-256 digest
  const digestBuffer = await crypto.subtle.digest('SHA-256', encodedEmail);
  const digest = Array.from(new Uint8Array(digestBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return { ciphertext, digest };
}

export async function decryptEmail(ciphertext: string, masterKey: string): Promise<string> {
  // Decode from base64
  const combined = new Uint8Array(
    atob(ciphertext)
      .split('')
      .map(c => c.charCodeAt(0))
  );
  
  // Extract salt, iv, and encrypted data
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encryptedData = combined.slice(28);
  
  // Derive key
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encryptedData
  );
  
  return new TextDecoder().decode(decryptedBuffer);
}