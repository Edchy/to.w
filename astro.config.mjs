import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Pages marked noindex (the form's thank-you page, the /v/ design studies) stay out of the sitemap.
const unlisted = ["/kurser/tack/", "/v/"];

export default defineConfig({
  site: "https://tovewatte.se",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => !unlisted.some((path) => new URL(page).pathname.startsWith(path)),
    }),
  ],
});
