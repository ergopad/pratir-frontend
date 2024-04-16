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
        error: "Verification ID not found. ",
        message: "Verification ID not found."
      });
    }

    const transaction = await redis.get(verificationId);

    if (!transaction) {
      return res.status(404).json({
        error: "Transaction data not found.",
        message: "Transaction data not found for the provided verification ID."
      });
    }

    const txObject = JSON.parse(transaction)

    await redis.set(verificationId, 'scanned', { EX: 3600 });

    return res.status(200).json({
      message: "Sign the transaction to complete your Blitz request. ",
      reducedTx: txObject.reducedTransaction,
      address: txObject.address
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}