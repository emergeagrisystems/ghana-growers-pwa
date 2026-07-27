import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Server-side Supabase configuration is required.");
}

const rpcUrl = `${supabaseUrl}/rest/v1/rpc/consume_hq_integration_nonce`;
const nonceTableUrl = `${supabaseUrl}/rest/v1/hq_integration_nonces`;
const headers = {
  apikey: serviceRoleKey,
  ...(!serviceRoleKey.startsWith("sb_secret_") ? { Authorization: `Bearer ${serviceRoleKey}` } : {}),
  "Content-Type": "application/json"
};
const testNonces = [];

async function consume(nonce) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      p_nonce_value: nonce,
      p_expires_at: new Date(Date.now() + (5 * 60 * 1000)).toISOString()
    }),
    cache: "no-store"
  });

  assert.equal(response.status, 200, "Nonce-consumption RPC must remain available.");
  const result = await response.json();
  assert.equal(typeof result, "boolean", "Nonce-consumption RPC must return a boolean scalar.");
  return result;
}

async function cleanup() {
  await Promise.all(testNonces.map(async (nonce) => {
    const response = await fetch(`${nonceTableUrl}?nonce_value=eq.${encodeURIComponent(nonce)}`, {
      method: "DELETE",
      headers,
      cache: "no-store"
    });

    assert.equal(response.ok, true, "Synthetic nonce cleanup must succeed.");
  }));
}

try {
  const sequentialNonce = randomUUID();
  testNonces.push(sequentialNonce);
  assert.equal(await consume(sequentialNonce), true);
  assert.equal(await consume(sequentialNonce), false);

  const concurrentNonce = randomUUID();
  testNonces.push(concurrentNonce);
  const concurrentResults = await Promise.all([
    consume(concurrentNonce),
    consume(concurrentNonce)
  ]);

  assert.equal(concurrentResults.filter(Boolean).length, 1);
  assert.equal(concurrentResults.filter((accepted) => !accepted).length, 1);

  console.log("PASS sequential database replay rejection");
  console.log("PASS concurrent database replay rejection");
} finally {
  await cleanup();
}
