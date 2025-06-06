export async function POST(req) {
  try {
    const { conversation } = await req.json();

    if (!conversation || !conversation.messages) {
      return new Response(JSON.stringify({ error: "Invalid request: 'conversation' or 'messages' missing." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiApiKey = process.env.API_KEY;
    const geminiApiUrl = process.env.API_URL;

    if (!geminiApiKey) {
      console.error("Server: GEMINI_API_KEY is not set.");
      return new Response(JSON.stringify({ error: "Server configuration error: API key missing." }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = `${geminiApiUrl}?key=${geminiApiKey}`;
    const headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiApiKey,
    };

    const filteredMessages = conversation.messages.filter(msg => !msg.error && !msg.loading);

    const payload = {
      contents: filteredMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    };

    const geminiRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const errorBody = await geminiRes.json();
      console.error("Server: Gemini API Error:", errorBody);
      const errorMessage = errorBody?.error?.message || `Gemini API responded with status ${geminiRes.status}`;
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: geminiRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiData = await geminiRes.json();
    const botResponse = geminiData.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ response: botResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Server: Proxy Error:", error);
    return new Response(JSON.stringify({ error: `Internal server error: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}