
try {
  const server = Bun.serve({
    routes: {
      // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },

    port: 3000,
    development: process.env.NODE_ENV !== "production" && {
      // Enable browser hot reloading in development
      hmr: true,

      // Echo console logs from the browser to the server
      console: true,
    },
    idleTimeout: 10, // 10 seconds
  });

  console.log(`Server running on http://localhost:${server.port}`);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

