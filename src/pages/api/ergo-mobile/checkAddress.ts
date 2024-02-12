import { redis } from '@lib/db';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { verificationId } = req.query;

  if (!verificationId) {
    return res.status(400).json({ error: 'Missing verification ID' });
  }

  try {
    const address = await redis.get(verificationId.toString());
    if (address) {
      return res.status(200).json({ address });
    } else {
      // No address set yet
      return res.status(404).json({ message: 'Address not set' });
    }
  } catch (error) {
    console.error('Error accessing Redis:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}