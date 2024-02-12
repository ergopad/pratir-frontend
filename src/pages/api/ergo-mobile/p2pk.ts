import { redis } from '@lib/db';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { p2pkAddress, verificationId } = req.query;

  if (!verificationId || typeof verificationId !== 'string' ||
    !p2pkAddress || typeof p2pkAddress !== 'string') {
    return res.status(400).json({ error: 'Missing verification ID or Address' });
  }

  try {
    const keyExists = await redis.exists(verificationId);

    if (!keyExists) {
      return res.status(404).json({
        error: "Verification ID not found. You must login through the website.",
        message: "Verification ID not found."
      });
    }

    await redis.set(verificationId, p2pkAddress, { EX: 3600 }); // 1 hour expiration

    return res.status(200).json({
      message: "Address added successfully.",
      messageSeverity: "INFORMATION"
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
