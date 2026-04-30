import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  site: "https://tovewatte.se",
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Cutive Mono",
      cssVariable: "--font-body",
      formats: ["ttf"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/CutiveMono-Regular.ttf"],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Chillax",
      cssVariable: "--font-chillax",
      formats: ["woff2"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Chillax-Variable.woff2"],
          },
        ],
      },
    },
  ],
});
