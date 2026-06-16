import { BootstrapResponse } from "../../src/types";
import {
  migrateIfNeeded,
  readAllCategories,
  getKVConfig,
  isDefaultAuthCode,
  getDefaultCategories,
  getDefaultBackground,
  getDefaultPrefs,
} from "./utils/dbHelpers";

interface Env {
  // @ts-expect-error - D1Database is provided by Cloudflare environment
  DB?: D1Database;
}

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    if (!env.DB) {
      const fallback: BootstrapResponse = {
        categories: getDefaultCategories(),
        background: getDefaultBackground(),
        prefs: getDefaultPrefs(),
        isDefaultCode: true,
      };
      return jsonResponse(fallback, 200);
    }

    await migrateIfNeeded(env.DB);

    const [categories, kv, defaultCode] = await Promise.all([
      readAllCategories(env.DB),
      getKVConfig(env.DB),
      isDefaultAuthCode(env.DB),
    ]);

    const response: BootstrapResponse = {
      categories: categories.length > 0 ? categories : getDefaultCategories(),
      background: kv.background,
      prefs: kv.prefs,
      isDefaultCode: defaultCode,
    };
    return jsonResponse(response, 200);
  } catch (error) {
    console.error("Bootstrap API Error:", error);
    return jsonResponse(
      {
        categories: getDefaultCategories(),
        background: getDefaultBackground(),
        prefs: getDefaultPrefs(),
        isDefaultCode: true,
        error: "Failed to load configuration, using defaults",
      } as BootstrapResponse,
      500
    );
  }
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
