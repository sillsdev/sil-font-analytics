// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://deno.land/x/supabase@1.3.1/mod.ts";

serve(async (req) => {
  //  { font_name, source, document_id, language_tag, event_type }
  const row = await req.json();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_DB_URL")!,
      //Deno.env.get("SUPABASE_ANON_KEY")!
      "public-anon-key"
    );
    const result = await supabase.from("Event").insert(row);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error_name: error.name,
        error_message: error.message,
        stack: error.stack,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

/*
supabase functions deploy report-font-use --no-verify-jwt \
curl -L -X POST 'https://iznwztlpmhqdmcqsdhts.functions.supabase.co/report-font-use' \
   --header 'Content-Type: application/json' \
   --data '{"font_name":"test font", "source":"testing", "document_id":"test 123", "language_tag":"en", "event_type":"test event"}'
*/
