// Shared data for the variant studies (/v/1 – /v/19, some numbers retired): every piece with its facts and order mail, plus the links that keep a visitor inside the variant they are viewing.
import { getCollection } from "astro:content";
import type { ImageMetadata } from "astro";
import { CONTACT_EMAIL_HREF, getProductSlug, priceLabel } from "../../config/site";
import type { HeroKind } from "./Hero.astro";
import type { RingFinish } from "./TurningRing.astro";

/** Each study mixes: `look` is the direction whose layout and type it uses (v1, v2, v4, v5.css);
 * `hero` swaps the direction's own hero for a shared one (Hero.astro); `footer` picks a footer layout; `palette` and `font` override colours
 * and the display face. `of` makes a study a copy of another: it takes that study's own tweaks
 * (styled on data-base) and changes only what it sets itself, e.g. the hero. `ring` picks a finish for
 * the 3D ring (TurningRing.astro). */
export const VARIANTS = [
  { n: "1", look: "1", name: "Spec", footer: "split" },
  { n: "2", look: "2", name: "Tidning", footer: "center" },
  { n: "12", look: "2", name: "Tidning s/v", hero: "type", palette: "ink", footer: "center" },
  { n: "13", look: "5", name: "Arkiv × Tidning", hero: "ring", font: "serif", footer: "center" },
  { n: "14", look: "4", name: "Affisch typ", hero: "type", palette: "bw-blue", footer: "row" },
  { n: "16", of: "13", look: "5", name: "13 delad", hero: "ring-split", ring: "clean", font: "serif", footer: "center" },
  { n: "17", of: "13", look: "5", name: "13 bildtext", hero: "ring-caption", ring: "satin", font: "serif", footer: "center" },
  { n: "18", of: "13", look: "5", name: "13 utfallande", hero: "ring-bleed", ring: "mirror", font: "serif", footer: "center" },
  { n: "19", of: "13", look: "5", name: "16 skog", hero: "ring-split", ring: "warm", palette: "forest", font: "serif", footer: "center" },
] as const satisfies readonly {
  n: string;
  of?: string;
  look: "1" | "2" | "4" | "5";
  name: string;
  hero?: HeroKind;
  ring?: RingFinish;
  footer: "row" | "split" | "center";
  palette?: "ink" | "bw-blue" | "forest";
  font?: "serif";
}[];

type Variant = (typeof VARIANTS)[number] & { of?: string; hero?: HeroKind; ring?: RingFinish; palette?: string; font?: string };

/** The study the live site runs (its pages at the site root render it with v = "live"). */
export const LIVE = "17";

export const getVariant = (v: string): Variant =>
  VARIANTS.find((variant) => variant.n === (v === "live" ? LIVE : v)) ?? VARIANTS[0];

const baseUrl = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;

export const liveHref = (path = "") => `${baseUrl}${path ? `${path.replace(/^\/|\/$/g, "")}/` : ""}`;

/** A link inside variant `v`: vHref("2", "smycken") → /v/2/smycken/; on the live site (v = "live")
 * the same link at the root: /smycken/ */
export const vHref = (v: string, path = "") =>
  v === "live" ? liveHref(path) : `${baseUrl}v/${v}/${path ? `${path.replace(/^\/|\/$/g, "")}/` : ""}`;

export type Piece = {
  slug: string;
  title: string;
  kind: string;
  price: string;
  description?: string;
  body?: string;
  facts: { term: string; value: string }[];
  images: ImageMetadata[];
  nytt: boolean;
  date: string;
  orderHref: string;
};

// The data has some blanks and "tba"s.
const clean = (value?: string) => (value?.trim() && value.trim() !== "tba" ? value.trim() : undefined);

/** Every piece, newest first. */
export async function getPieces(): Promise<Piece[]> {
  const entries = (await getCollection("jewelry")).sort((a, b) => a.data.date.localeCompare(b.data.date));

  return entries
    .map((entry) => {
      const { title, kind, price, sizes, description, body, material, technique, design, images, nytt, date } = entry.data;
      const sizeLine =
        sizes.length === 1 ? `Storlek / variant: ${sizes[0]}` : `Storlek / variant (välj: ${sizes.join(", ")}):`;
      const orderBody = `Hej Tove,\n\nJag vill gärna beställa ${title} (${priceLabel(price)}).\n\n${sizeLine}\nAntal:\nLEVERANS: [post / hämtas i ateljén / överlämning i Järna]\nAdress, om post:\nTelefon:\nÖvrigt:\n\nVänliga hälsningar,`;

      return {
        slug: getProductSlug(entry.id),
        title,
        kind: kind ?? "smycke",
        price: priceLabel(price),
        description: clean(description),
        body: clean(body),
        facts: [
          { term: "Material", value: clean(material) },
          { term: "Teknik", value: clean(technique) },
          { term: "Form", value: clean(design) },
          { term: sizes.length === 1 ? "Storlek" : "Storlekar", value: sizes.join(", ") || undefined },
        ].filter((fact): fact is { term: string; value: string } => Boolean(fact.value)),
        images,
        nytt: Boolean(nytt),
        date,
        orderHref: `${CONTACT_EMAIL_HREF}?subject=${encodeURIComponent(`Beställning: ${title}`)}&body=${encodeURIComponent(orderBody)}`,
      };
    })
    .reverse();
}

export const variantPaths = () => VARIANTS.map(({ n }) => ({ params: { v: n } }));
