import { createBookingBackend } from "./backend.mjs";
import { createBookingHandler } from "./handler.mjs";

const configuredSecret = Deno.env.get("SUPABASE_SECRET_KEY");
const legacySecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const backend = createBookingBackend({
  supabaseUrl: Deno.env.get("SUPABASE_URL"),
  serverKey: configuredSecret || legacySecret,
  legacyJwt: !configuredSecret && Boolean(legacySecret),
});

Deno.serve(createBookingHandler({
  backend,
  log: (entry: object) => console.info(JSON.stringify(entry)),
}));
