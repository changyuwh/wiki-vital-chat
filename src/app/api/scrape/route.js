export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const getWikipediaTitle = (url) => {
      const match = url.match(/\/wiki\/(.+)$/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
      throw new Error("Invalid Wikipedia URL");
    };

    const pageTitle = getWikipediaTitle(url);

    const fullContentUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=extracts&exintro=false&explaintext=true&exsectionformat=plain`;

    const fullResponse = await fetch(fullContentUrl, {
      headers: {
        'User-Agent': 'WikiVitalChat/1.0 (https://github.com/changyuwh)'
      }
    });
    const fullData = await fullResponse.json();

    const pages = fullData.query?.pages;
    let content = '';
    let title = pageTitle;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      if (pageId !== '-1') {
        const page = pages[pageId];
        content = page.extract || '';
        title = page.title || title;
      }
    }

    return new Response(JSON.stringify({ 
      content,
      title
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Wikipedia API error:", error);
    return new Response(JSON.stringify({ error: `Failed to fetch Wikipedia content: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
