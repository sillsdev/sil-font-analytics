/* This is a supabase "edge function" (Deno) which just wraps the automatically generated API for inserting 
   a row in the Report database. It allows anonymous reporting, and does some very minimal validation.
*/

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

import { createRouter } from "https://deno.land/x/http_router@1.1.0/mod.ts";
import { type RouteHandlerContext } from "https://deno.land/x/http_router@1.1.0/mod.ts";

const ReportParams = [
  { name: "source", required: true },
  { name: "source_version" },
  { name: "document_id", required: true },
  { name: "font_name", required: true },
  { name: "font_version" },
  { name: "font_styles" },
  { name: "font_features" },
  { name: "language_tag", required: true },
  { name: "ip_address" },
  { name: "event_time" },
  { name: "event_type", required: true },
];

const router = createRouter({
  "/": () => new Response("Hello"), // Any HTTP request method
  "/api/v1/status": () => new Response("I am here."), // Any HTTP request method
  "/api/v1/report-font-use": {
    POST: async (req: Request, ctx: Readonly<RouteHandlerContext>) => {
      let response: Response | undefined = undefined;
      try {
        const incomingParams = await req.json();
        console.log(`report-font-use: ${JSON.stringify(incomingParams)}`);

        // Validate all required parameters are present
        for (const param of ReportParams) {
          if (param.required && incomingParams[param.name] === undefined) {
            response = new Response(
              `The required parameter "${param.name}" is missing`,
              { status: 400 }
            );
          }
        }

        // Validate there are no unrecognized parameters
        for (const key of Object.keys(incomingParams)) {
          if (!ReportParams.some((v) => v.name === key)) {
            response = new Response(
              `The parameter ${key} is not recognized by this API.`,
              { status: 400 }
            );
          }
        }

        if (response === undefined) {
          const result = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/rest/v1/Report`,
            {
              method: "POST",
              headers: {
                apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
                Authorization: `Bearer ${Deno.env.get(
                  "SUPABASE_SERVICE_ROLE_KEY"
                )!}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
              body: JSON.stringify(incomingParams),
            }
          );

          if (result.status === 201) {
            // Successfully inserted
            response = new Response(result.body, {
              status: result.status,
              statusText: result.statusText,
            });
          } else {
            response = new Response(
              `The API was happy but the database rejected the insert. ${result.body}`,
              {
                status: result.status,
                statusText: result.statusText,
              }
            );
          }
        }
      } catch (error) {
        response = new Response(
          JSON.stringify({
            note: "Normally, even with bad data, you wouldn't be seeing this, which happens only if there is an exception inside of the fetch().",
            error_name: error.name,
            error_message: error.message,
            stack: error.stack,
          }),
          { status: 500 }
        );
      }
      console.log(
        `Response: ${response.status} ${response.statusText} ${response.body}`
      );
      return response;
    },
  },
});

serve(router);

/*
Are you alive?
curl -i --location --request GET 'https://font-analytics.languagetechnology.org'
curl -i --location --request GET 'https://sil-font-analytics.deno.dev/'
curl -i --location --request GET 'https://sil-font-analytics.deno.dev/api/v1/status'
curl -i --location --request GET 'https://sil-font-analytics-zhdxhn4jn46g.deno.dev/'

Just the required

curl -i --location --request POST 'https://font-analytics.languagetechnology.org/api/v1/report-font-use' \
--header 'Content-Type: application/json' \
-d '{"source":"test","document_id":"1","font_name":"Bar","language_tag":"UND","event_type":"configure_project"}'

Missing source


curl -i --location --request POST 'https://sil-font-analytics.deno.dev/api/v1/report-font-use' \
--header 'Content-Type: application/json' \
-d '{"document_id":"huh","font_name":"Padauk","language_tag":"my-MY","event_type":"configure_project"}'

Unrecognized field

curl -i --location --request POST 'https://sil-font-analytics.deno.dev/api/v1/report-font-use' \
--header 'Content-Type: application/json' \
-d '{"color":"red", "source":"foo","document_id":"huh","font_name":"Padauk","language_tag":"my-MY","event_type":"configure_project"}'

All fields

curl -i --location --request POST 'https://sil-font-analytics.deno.dev/api/v1/report-font-use' \
--header 'Content-Type: application/json' \
-d '{"source":"foo","document_id":"huh","font_name":"Padauk","language_tag":"my-MY","event_type":"configure_project", "source_version":"2022-04-05", "font_version":"1.0","font_styles":"what is this", "font_features":"some features", "ip_address":null,"event_time":"2022-06-22T21:51:00+0000"}'


*/
