import { createTRPCRouter, publicProcedure } from "@server/trpc";
import { fetchMetadataForTokenIds } from "@server/utils/cruxApi";
import { mapAxiosErrorToTRPCError } from "@server/utils/mapErrors";
import axios from "axios";
import { z } from "zod";

export const apiRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({
      url: z.string()
    }))
    .query(async ({ input }) => {
      const { url } = input;
      try {
        const request = await axios.get((process.env.API_URL) + url);
        return request.data;
      } catch (error: unknown) {
        throw mapAxiosErrorToTRPCError(error)
      }
    }),
  post: publicProcedure
    .input(z.object({
      url: z.string(),
      body: z.any(),
    }))
    .mutation(async ({ input }) => {
      const { url, body } = input;
      try {
        const request = await axios.post(process.env.API_URL + url, body);
        return request.data;
      } catch (error: unknown) {
        throw mapAxiosErrorToTRPCError(error);
      }
    }),
  getPackTokenMetadata: publicProcedure
    .input(z.object({
      tokenIds: z.array(z.string())
    }))
    .mutation(async ({ input }) => {
      const { tokenIds } = input;

      const metadata = await fetchMetadataForTokenIds(tokenIds);
      return metadata;
    })
})