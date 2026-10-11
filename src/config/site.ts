export const CONTACT_EMAIL = "tove.watte@gmail.com";
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;

export const getProductSlug = (entryId: string) => entryId.replace(/\/data$/, "");

/** "1 400 kr", or "pris kommer" while a piece has no price yet. */
export const priceLabel = (price?: number) =>
  price === undefined ? "pris kommer" : `${new Intl.NumberFormat("sv-SE").format(price)} kr`;
