import { expect, type Page, type Route, test } from "@playwright/test";

const SMOKE_BOOK_ID = process.env.E2E_BOOK_ID || "5047";
const SMOKE_EPISODE_ID = process.env.E2E_EPISODE_ID || "1696169";

const json = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(data),
});

const smokeBook = {
  book_id: Number(SMOKE_BOOK_ID),
  name: "E2E Smoke Book",
  title: "Smoke test book summary",
  des: "<p>Smoke test book description</p>",
  img: "/images/book.png",
  img_full: "/images/book.png",
  view: 1200,
  chapter: 1,
  comment: 0,
  heart: 0,
  flower: 0,
  date_at: "2026-01-01T00:00:00.000Z",
  update_at: "2026-01-01T00:00:00.000Z",
  end: "not_end",
  rate: 3,
  star: 0,
  status: "publish",
  tag: ["smoke"],
  category1: { id: 1, name: "Smoke Category" },
  category2: { id: 2, name: "Smoke Subcategory" },
  writer: {
    user_id: 1,
    writer_name: "Smoke Writer",
    fullname: "Smoke Writer",
    img: "",
    isFollowing: false,
  },
  use_freecoin: true,
  remaining_paid_count: 0,
  remaining_paid_total: 0,
  total_remaining_count: 0,
  total_remaining_total: 0,
  ep_purchase_reward: {
    has_promotion: false,
    campaign: null,
  },
};

const smokeEpisode = {
  ep_id: Number(SMOKE_EPISODE_ID),
  book_id: Number(SMOKE_BOOK_ID),
  name: "E2E Smoke Episode",
  title: "E2E Smoke Episode",
  des: "<p>Smoke reader content paragraph with enough text for the reader page.</p>",
  content: "<p>Smoke reader content paragraph with enough text for the reader page.</p>",
  isBuy: true,
  view: 10,
  coin: 0,
  freecoin: 0,
  publish_datetime: "2026-01-01T00:00:00.000Z",
  order_by: 1,
};

const smokeEpisodeGroups = {
  groups: [
    {
      group_id: 1,
      name: "Smoke Volume",
      list: [smokeEpisode],
    },
  ],
};

const smokeCategories = [
  {
    id: "all",
    name: "All",
    color: "#ef304b",
    img_bg: "",
  },
  {
    id: "23",
    name: "Smoke Category",
    color: "#ef304b",
    img_bg: "",
  },
];

const smokeCategoryBooks = {
  code: 200,
  status: "success",
  data: {
    books: [
      {
        ...smokeBook,
        id: Number(SMOKE_BOOK_ID),
        writer_name: "Smoke Writer",
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    },
  },
};

async function fulfillBackendApi(route: Route) {
  const url = new URL(route.request().url());
  const pathname = url.pathname.replace(/\/+$/, "");

  if (pathname === "/get_website") {
    await route.fulfill(json({ status: "success", data: { rp: "", cat_pic_default: "inactive" } }));
    return;
  }

  if (pathname === `/bookdetail/${SMOKE_BOOK_ID}` || pathname === `/book/${SMOKE_BOOK_ID}`) {
    await route.fulfill(json({ code: 200, status: "success", data: smokeBook }));
    return;
  }

  if (pathname === `/bookgroup/${SMOKE_BOOK_ID}`) {
    await route.fulfill(json({ code: 200, status: "success", data: smokeEpisodeGroups }));
    return;
  }

  if (pathname === `/bookdetail/purchase/${SMOKE_BOOK_ID}`) {
    await route.fulfill(json({
      code: 200,
      status: "success",
      data: {
        remaining_paid_count: 0,
        remaining_paid_total: 0,
        total_remaining_count: 0,
        total_remaining_total: 0,
        fast_ticket: null,
      },
    }));
    return;
  }

  if (pathname === `/check-novel-pack/${SMOKE_BOOK_ID}`) {
    await route.fulfill(json({
      code: 200,
      status: "success",
      data: {
        btn_novel: null,
        btn_novel_pack: null,
        btn_novel_pack_show_lead_label: false,
        content_type: "novel",
      },
    }));
    return;
  }

  if (pathname === "/active-categories" || pathname === "/book-category/all") {
    await route.fulfill(json({ code: 200, status: "success", data: smokeCategories }));
    return;
  }

  if (pathname === "/book-category/list") {
    await route.fulfill(json(smokeCategoryBooks));
    return;
  }

  if (pathname === "/book-category/banner") {
    await route.fulfill(json({ code: 200, status: "success", data: [] }));
    return;
  }

  if (pathname === "/getAllBookHome") {
    await route.fulfill(json({
      code: 200,
      status: "success",
      data: {
        groupBookHome: [],
        banner: [],
        banners: [],
      },
    }));
    return;
  }

  await route.fulfill(json({ code: 200, status: "success", data: [] }));
}

async function installSmokeApiMocks(page: Page) {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const isAppRequest = ["127.0.0.1", "localhost"].includes(url.hostname);

    if (isAppRequest && url.pathname.startsWith("/api/read/episode/")) {
      await route.fulfill(json({ code: 200, status: "success", data: smokeEpisode }));
      return;
    }

    if (isAppRequest) {
      await route.continue();
      return;
    }

    const acceptsJson = route.request().headers().accept?.includes("application/json");
    const isBackendApi = route.request().resourceType() === "xhr"
      || route.request().resourceType() === "fetch"
      || acceptsJson;

    if (!isBackendApi) {
      await route.continue();
      return;
    }

    await fulfillBackendApi(route);
  });
}

async function expectNoNextErrorOverlay(page: Page) {
  await expect(page.getByText(/Unhandled Runtime Error|Console Error|Application error/i)).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await installSmokeApiMocks(page);
});

test("login route opens login UI safely", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("dialog").first()).toBeVisible();
  await expectNoNextErrorOverlay(page);
});

test("book detail route renders book content", async ({ page }) => {
  await page.goto(`/book/${SMOKE_BOOK_ID}`, { waitUntil: "domcontentloaded" });

  await expect(page.getByText("E2E Smoke Book").first()).toBeVisible();
  await expect(page.getByText("Smoke Writer").first()).toBeVisible();
  await expectNoNextErrorOverlay(page);
});

test("read route renders episode content", async ({ page }) => {
  await page.goto(`/read/${SMOKE_BOOK_ID}/${SMOKE_EPISODE_ID}`, { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "E2E Smoke Episode" })).toBeVisible();
  await expectNoNextErrorOverlay(page);
});

test("category route renders category books", async ({ page }) => {
  await page.goto("/cat/list?type=tran&categoryId=all&tab=new&page=1", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("E2E Smoke Book").first()).toBeVisible();
  await expectNoNextErrorOverlay(page);
});

test("cart route shows auth guard when logged out", async ({ page }) => {
  await page.goto("/cart", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoNextErrorOverlay(page);
});

test("checkout route shows auth guard when logged out", async ({ page }) => {
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoNextErrorOverlay(page);
});
