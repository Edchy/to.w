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
    {
      provider: fontProviders.local(),
      name: "JuneExpt Curious",
      cssVariable: "--font-june-curious",
      formats: ["otf"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/JuneExpt-Curious-TRIAL.otf"],
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
    {
      provider: fontProviders.local(),
      name: "Seasummer Stormy",
      cssVariable: "--font-seasum-stormy",
      formats: ["woff2"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/seasummervthree-trial-stormy.woff2"],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Seasummer Calm",
      cssVariable: "--font-seasum-calm",
      formats: ["woff2"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/seasummervthree-trial-calm.woff2"],
          },
        ],
      },
    },
  ],
});
