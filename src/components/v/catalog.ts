// Shared site data: every piece with its facts and order mail, and the links to the site's pages.
import { getCollection } from "astro:content";
import type { ImageMetadata } from "astro";
import { CONTACT_EMAIL_HREF, getProductSlug, priceLabel } from "../../config/site";

const baseUrl = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;

/** A link to a page of the site: liveHref("smycken") → /smycken/, liveHref() → / */
export const liveHref = (path = "") => `${baseUrl}${path ? `${path.replace(/^\/|\/$/g, "")}/` : ""}`;

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
