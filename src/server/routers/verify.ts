import { redis } from "@lib/db";
import { createTRPCRouter, publicProcedure } from "@server/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const verifyRouter = createTRPCRouter({
  initVerification: publicProcedure
    .input(z.object({
      verificationId: z.string()
    }))
    .mutation(async ({ input }) => {
      const { verificationId } = input;
      if (typeof verificationId === 'undefined') {
        throw new TRPCError({
          message: 'An id is required to update an item',
          code: 'BAD_REQUEST',
        });
      }
      try {
        await redis.set(verificationId, '', { EX: 3600 });
        return verificationId;
      } catch (error) {
        console.error('Error initiating verification process:', error);
        throw new TRPCError({
          message: `Failed to add item with id ${verificationId}`,
          code: 'INTERNAL_SERVER_ERROR',
        });
      }
    }),
  getAddress: publicProcedure
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
        const address = await redis.get(verificationId);
        if (address) {
          return address;
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
})