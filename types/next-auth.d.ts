import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      /** Active workspace id resolved from WorkspaceMember at sign-in.
       *  Null for users with no workspace membership (shouldn't happen in
       *  normal flows — sign-up creates a workspace transactionally). */
      workspaceId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    workspaceId?: string | null;
  }
}
