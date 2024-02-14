import { redis } from '@lib/db';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { verificationId } = req.query;

  if (!verificationId || typeof verificationId !== 'string') {
    return res.status(400).json({ error: 'Missing verification ID or Address' });
  }

  try {
    const keyExists = await redis.exists(verificationId);

    if (!keyExists) {
      return res.status(404).json({
        error: "Verification ID not found. Try again.",
        message: "Verification ID not found."
      });
    }

    const transaction = await redis.get(verificationId);

    return transaction
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
