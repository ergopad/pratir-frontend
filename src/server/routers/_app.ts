import { createTRPCRouter } from "@server/trpc";
import { apiRouter } from "./api";
import { transactionRouter } from "./transaction";
import { verifyRouter } from "./verify";

export const appRouter = createTRPCRouter({
  verify: verifyRouter,
  api: apiRouter,
  transaction: transactionRouter
});

export type AppRouter = typeof appRouter;