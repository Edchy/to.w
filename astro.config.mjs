import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Pages marked noindex (stubs, the form's thank-you page, the type lab) stay out of the sitemap.
const unlisted = ["/projekt/", "/stickning/", "/kurser/tack/", "/typlab/"];

export default defineConfig({
  site: "https://tovewatte.se",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => !unlisted.some((path) => new URL(page).pathname.startsWith(path)),
    }),
  ],
});
