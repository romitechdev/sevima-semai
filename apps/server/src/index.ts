import { createServer } from "node:http";
import { appRouter } from "./routes/index.js";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const port = Number(process.env.PORT) || 3002;
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (!url.pathname.startsWith("/trpc")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Uint8Array);
  }
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : Buffer.concat(chunks);

  const fetchReq = new Request(url, {
    method: req.method ?? "GET",
    headers,
    body: body as any,
    duplex: "half",
  } as any);

  const fetchRes = await fetchRequestHandler({
    endpoint: "/trpc",
    router: appRouter,
    req: fetchReq,
  });

  res.writeHead(fetchRes.status, Object.fromEntries(fetchRes.headers));
  if (fetchRes.body) {
    const reader = fetchRes.body.getReader();
    const pump = () =>
      reader.read().then(({ done, value }) => {
        if (done) {
          res.end();
          return;
        }
        res.write(Buffer.from(value));
        pump();
      });
    pump();
  } else {
    res.end();
  }
});

server.listen(port, () => {
  console.log(`tRPC server running on http://localhost:${port}/trpc`);
});
