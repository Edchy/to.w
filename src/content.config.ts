import { defineCollection, type SchemaContext } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const productSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    price: z.number(),
    sizes: z.array(z.string()),
    description: z.string().optional(),
    material: z.string().optional(),
    technique: z.string().optional(),
    design: z.string().optional(),
    images: z.array(image()),
    date: z.string(),
    body: z.string().optional(),
  });

const jewelry = defineCollection({
  loader: glob({ pattern: "**/data.json", base: "./src/content/jewelry" }),
  schema: productSchema,
});

const knitting = defineCollection({
  loader: glob({ pattern: "**/data.json", base: "./src/content/knitting" }),
  schema: productSchema,
});

export const collections = { jewelry, knitting };
