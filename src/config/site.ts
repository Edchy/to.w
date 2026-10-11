export const CONTACT_EMAIL = "tove.watte@gmail.com";
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;

/** The original site (the design before the studies) is kept at /v/0/. Its pages build their links
 * from this, so a visitor clicking round /v/0/ stays inside it; everywhere else it is the site root. */
export const linkBase = (url: URL) => {
  const base = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;
  return url.pathname.startsWith(`${base}v/0/`) ? `${base}v/0/` : base;
};

export const getProductSlug = (entryId: string) => entryId.replace(/\/data$/, "");

/** Shared by a product's name on its card and on its page, so the name morphs between them. */
export const ringTransitionName = (slug: string) => `ring-${slug}`;

/** The view-transition-class both ends carry; global.css styles how the name travels. */
export const RING_TRANSITION_CLASS = "ring-name";

/** "1 400 kr", or "pris kommer" while a piece has no price yet. */
export const priceLabel = (price?: number) =>
  price === undefined ? "pris kommer" : `${new Intl.NumberFormat("sv-SE").format(price)} kr`;
