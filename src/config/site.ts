export const CONTACT_EMAIL = "tove.watte@gmail.com";
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;

export const getProductSlug = (entryId: string) => entryId.replace(/\/data$/, "");

/** Shared by a product's name on its card and on its page, so the name morphs between them. */
export const ringTransitionName = (slug: string) => `ring-${slug}`;

/** The view-transition-class both ends carry; global.css styles how the name travels. */
export const RING_TRANSITION_CLASS = "ring-name";
