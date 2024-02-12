import { v4 as uuidv4 } from 'uuid';
import { redis } from '@lib/db';

export async function generateVerificationId() {
  const verificationId = uuidv4();
  await redis.set(verificationId, '{}', { EX: 3600 }); // Store in Redis
  return verificationId;
}