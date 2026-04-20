import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
fonts: [
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
  ],
});
