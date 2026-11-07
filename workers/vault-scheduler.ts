import { setCloudflareEnv } from "../api/lib/env";
import { setDb } from "../api/queries/connection";
import { runScheduledMaintenance } from "../api/lib/scheduled-jobs";

type SchedulerEnv = Record<string, unknown> & {
  DB?: D1Database;
};

export default {
  async scheduled(_controller: unknown, env: SchedulerEnv, ctx: ExecutionContext): Promise<void> {
    setCloudflareEnv(env);
    if (!env.DB) {
      console.error("[scheduler] DB binding missing");
      return;
    }
    setDb(env.DB);
    ctx.waitUntil(
      runScheduledMaintenance().then((report) => {
        console.log("[scheduler]", JSON.stringify(report));
      }),
    );
  },

  async fetch(): Promise<Response> {
    return new Response("thevault-scheduler is cron-only. It does not serve the site.", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
