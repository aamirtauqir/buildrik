import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
