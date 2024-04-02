import { redis } from "@lib/db";
import { createTRPCRouter, publicProcedure } from "@server/trpc";
import { mapAxiosErrorToTRPCError } from "@server/utils/mapErrors";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import { UnsignedTransaction } from "ergo-lib-wasm-nodejs";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";

export const transactionRouter = createTRPCRouter({
  addMobileResponse: publicProcedure
    .input(z.object({
      reducedTransaction: z.string(),
      unsignedTransaction: z.string(),
      address: z.string()
    }))
    .mutation(async ({ input }) => {
      const { reducedTransaction, unsignedTransaction, address } = input;
      const verificationId = uuidv4()

      const txId = UnsignedTransaction.from_json(
        unsignedTransaction
      ).id().to_str();

      try {
        const jsonData = { reducedTransaction, address };
        const serializedData = JSON.stringify(jsonData);
        const setTx = await redis.set(verificationId, serializedData, { EX: 3600 });
        // console.log(setTx)
        if (setTx) {
          return {
            verificationId,
            txId
          };
        }
      } catch (error: unknown) {
        throw mapAxiosErrorToTRPCError(error)
      }
    }),
  checkMobileScan: publicProcedure
    .input(z.object({
      verificationId: z.string()
    }))
    .query(async ({ input }) => {
      const { verificationId } = input;
      if (typeof verificationId === 'undefined') {
        throw new TRPCError({
          message: 'An id is required to check this item',
          code: 'BAD_REQUEST',
        });
      }

      try {
        const complete = await redis.get(verificationId);
        if (complete === 'scanned') {
          return 'scanned';
        }
        else return null
      } catch (error) {
        console.error('Error verifying:', error);
        throw new TRPCError({
          message: `Failed to verify item ${verificationId}`,
          code: 'INTERNAL_SERVER_ERROR',
        });
      }
    }),
  checkMobileSuccess: publicProcedure
    .input(z.object({
      transactionId: z.string()
    }))
    .query(async ({ input }) => {
      const { transactionId } = input
      const url = `/crux/tx_status/${transactionId}`
      const request = await axios.get((process.env.CRUX_API) + url);
      // console.log(request.data)
      if (request.data.num_confirmations >= 0) {
        return request.data.num_confirmations
      }
      else return null
    })
})