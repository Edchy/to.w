import { defineConfig, fontProviders } from "astro/config";

const base = process.env.PUBLIC_BASE_PATH ?? "/";

export default defineConfig({
  site: "https://edchy.github.io",
  base,
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
      name: "JuneExpt Active",
      cssVariable: "--font-june-active",
      formats: ["otf"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/JuneExpt-Active-TRIAL.otf"],
          },
        ],
      },
    },
  ],
});
