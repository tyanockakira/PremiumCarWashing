import { createBookingBackend } from "./backend.mjs";
import { createBookingHandler } from "./handler.mjs";
import { createTurnstileVerifier } from "./turnstile.mjs";

const configuredSecret = Deno.env.get("SUPABASE_SECRET_KEY");
const legacySecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const backend = createBookingBackend({
  supabaseUrl: Deno.env.get("SUPABASE_URL"),
  serverKey: configuredSecret || legacySecret,
  legacyJwt: !configuredSecret && Boolean(legacySecret),
});

const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
const verifyTurnstile = createTurnstileVerifier({ secret: turnstileSecret });

Deno.serve(createBookingHandler({
  backend,
  verifyTurnstile,
  log: (entry: object) => console.info(JSON.stringify(entry)),
}));
