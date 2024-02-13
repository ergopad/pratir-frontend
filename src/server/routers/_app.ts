import { createTRPCRouter } from "@server/trpc";
import { apiRouter } from "./api";
import { verifyRouter } from "./verify";

export const appRouter = createTRPCRouter({
  verify: verifyRouter,
  api: apiRouter
});

export type AppRouter = typeof appRouter;