import { createServer } from "node:http";

const PORT = Number(process.env.SITEMAP_API_PORT || 3101);
let dynamicSourcesFail = false;

const json = (response, payload, status = 200) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(payload));
};

const rejectUnavailableDynamicSource = (response) => {
  if (!dynamicSourcesFail) return false;
  json(response, { code: 503, status: "unavailable", data: null }, 503);
  return true;
};

const articlesByPage = {
  1: [
    { id: 101, name: "First article", img: "", view: 1, update_at: "2026-08-01T00:00:00.000Z" },
  ],
  2: [
    { id: 102, name: "Second article", img: "", view: 2, update_at: "2026-08-02T00:00:00.000Z" },
  ],
};

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://127.0.0.1:${PORT}`);

  if (url.pathname === "/health") {
    json(response, { ok: true });
    return;
  }

  if (url.pathname === "/__control/dynamic-failure" && request.method === "POST") {
    dynamicSourcesFail = url.searchParams.get("enabled") === "true";
    json(response, { dynamicSourcesFail });
    return;
  }

  if (url.pathname === "/get_website") {
    json(response, { status: "success", data: { rp: "", cat_pic_default: "inactive" } });
    return;
  }

  if (url.pathname === "/articles") {
    if (rejectUnavailableDynamicSource(response)) return;

    const page = Number(url.searchParams.get("page") || 1);
    json(response, {
      code: 200,
      status: "success",
      message: "",
      data: {
        list: articlesByPage[page] || [],
        pagination: {
          page,
          limit: 1,
          total: 2,
          totalPages: 2,
          nextPage: page < 2 ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null,
        },
      },
    });
    return;
  }

  if (url.pathname === "/book-category/all") {
    if (rejectUnavailableDynamicSource(response)) return;

    json(response, {
      code: 200,
      status: "success",
      message: "",
      data: [
        { id: 7, name: "Fantasy", description: "", color: [], img_bg: "", order_by: 1 },
        { id: 8, name: "Romance", description: "", color: [], img_bg: "", order_by: 2 },
      ],
    });
    return;
  }

  if (url.pathname === "/getAllBookHome") {
    json(response, {
      code: 200,
      status: "success",
      message: "",
      data: { popup: [], slides: [], groupBookHome: [] },
    });
    return;
  }

  json(response, { code: 404, status: "not_found", data: null }, 404);
});

server.listen(PORT, "127.0.0.1");

const close = () => server.close(() => process.exit(0));
process.on("SIGINT", close);
process.on("SIGTERM", close);
