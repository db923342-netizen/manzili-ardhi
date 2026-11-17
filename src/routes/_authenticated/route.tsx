import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Client-only gate: the session lives in browser storage.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw redirect({ to: "/login", search: { redirect: location.pathname } });
      return { user: data.user };
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      throw redirect({ to: "/login", search: { redirect: location.pathname } });
    }
  },
  component: () => <Outlet />,
});
