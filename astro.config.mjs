import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Pages marked noindex (the form's thank-you page) stay out of the sitemap.
const unlisted = ["/kurser/tack/"];

export default defineConfig({
  site: "https://tovewatte.se",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => !unlisted.some((path) => new URL(page).pathname.startsWith(path)),
    }),
  ],
});
