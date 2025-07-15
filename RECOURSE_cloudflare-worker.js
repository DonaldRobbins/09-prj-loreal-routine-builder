// Cloudflare Worker script for L'Oreal Routine Builder
// This worker acts as a proxy between your front-end application and OpenAI's API
// It helps maintain security by keeping your API key private and handles CORS

export default {
  async fetch(request, env) {
    // Set up CORS headers to allow cross-origin requests from any domain
    // This is necessary for your front-end application to communicate with this worker
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests (OPTIONS method)
    // Browsers send these before actual requests to check if they're allowed
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Get the OpenAI API key from the worker's environment variables
    // Make sure to set this in your Cloudflare Workers dashboard
    const apiKey = env.OPENAI_API_KEY;
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    // Parse the incoming request body as JSON
    const userInput = await request.json();

    // Prepare the request body for OpenAI API
    // Using gpt-4 with specific parameters for optimal routine recommendations
    const requestBody = {
      model: "gpt-4o",
      messages: userInput.messages,
      max_tokens: 800, // Maximum length of the response
      temperature: 0.5, // Lower value for more focused, consistent responses
      frequency_penalty: 0.8, // Reduces repetition in responses
    };

    try {
      // Make the request to OpenAI
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Parse the response
      const data = await response.json();

      // Return the response with CORS headers
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    } catch (error) {
      // If there's an error, return it with CORS headers
      return new Response(
        JSON.stringify({ error: "An error occurred processing your request" }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  },
};
