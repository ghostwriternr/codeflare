export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const response = await fetch("http://localhost:3000/");
      const text = await response.text();
      return Response.json({
        name: text,
      });
    }
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
