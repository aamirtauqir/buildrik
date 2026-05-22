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

// NextAuth 5 re-exports JWT from @auth/core/jwt; declaration merging must
// land on the canonical module so the session callback's `token` param
// picks up our additions. Augmenting `next-auth/jwt` alone leaves the
// rich type invisible to the @auth/core resolution path used internally.
declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    workspaceId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    workspaceId?: string | null;
  }
}
