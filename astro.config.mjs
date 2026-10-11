import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Pages marked noindex (the form's thank-you page, the /v2/ homepage) stay out of the sitemap.
const unlisted = ["/kurser/tack/", "/v2/"];

export default defineConfig({
  site: "https://tovewatte.se",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => !unlisted.some((path) => new URL(page).pathname.startsWith(path)),
    }),
  ],
});
