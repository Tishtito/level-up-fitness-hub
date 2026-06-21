import { createFileRoute, redirect } from "@tanstack/react-router";

import { parseAuthContinuation } from "@/lib/auth-continuation";

export const Route = createFileRoute("/register")({
  validateSearch: parseAuthContinuation,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/signup",
      search,
      replace: true,
    });
  },
});
