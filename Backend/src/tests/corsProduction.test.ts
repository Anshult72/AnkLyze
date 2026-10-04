import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../app";

const canonicalOrigin = "https://anklyze-flame.vercel.app";

async function run() {
  const server = createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}/api/v1/auth/login`;
    const preflight = (origin: string) => fetch(url, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    const allowed = await preflight(canonicalOrigin);
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get("access-control-allow-origin"), canonicalOrigin);
    assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");

    const denied = await preflight("https://untrusted.example");
    assert.equal(denied.status, 403);
    const deniedBody = await denied.json() as { error: { code: string } };
    assert.equal(deniedBody.error.code, "CORS_ORIGIN_FORBIDDEN");
    console.log("Production CORS preflight checks passed");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
