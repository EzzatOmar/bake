
try {
  const server = Bun.serve({
    routes: {
      // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },

    port: process.env.PORT || 3000,
    development: process.env.NODE_ENV !== "production" && {
      // Disable HMR temporarily due to CSS modules bug in Bun 1.3.3
      // See: https://github.com/oven-sh/bun/issues/18258
      hmr: false,

      // Echo console logs from the browser to the server
      console: true,
    },
    idleTimeout: 10, // 10 seconds
  });

  console.log(`Server running on http://localhost:${server.port}`);
  console.log(`boards: http://localhost:${server.port}/index`);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

