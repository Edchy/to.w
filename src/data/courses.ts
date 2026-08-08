export type Course = {
  slug: string;
  title: string;
  intro: string;
  date: string;
  /** Split form of `date`, for typographic display on the homepage teaser. */
  day: string;
  month: string;
  time: string;
  price: string;
  spots: string;
  place: string;
  body: string[];
  includes: string[];
  /** Set to false when the course is full — hides the form, shows a note. */
  open: boolean;
};

export const courses: Course[] = [
  {
    slug: "silverring-12-sep",
    title: "Skapa din egen silverring",
    intro:
      "Välkommen till en kväll där vi skapar tillsammans. Under min guidning får du designa och forma din egen unika ring.",
    date: "12 september",
    day: "12",
    month: "september",
    time: "18.00–20.00",
    price: "1 800 kr per deltagare",
    spots: "Max 5 deltagare",
    place: "Åsgatan 2, Järna",
    body: [
      "Under kursens två timmar arbetar deltagarna med hårt vax och formar sin egen ring. Under tiden serveras ett gott tilltugg samt dryck, i en avslappnad och personlig miljö.",
      "Efter kursen tar jag hand om samtliga vaxmodeller och gjuter dem i återvunnet sterling silver, så att varje deltagares design blir till ett färdigt, hållbart smycke.",
      "Vi kommer hålla till i en keramikkällare under kaféet på Åsgatan i Järna där det även kommer att finnas keramik att köpa med sig hem efter att kvällen är slut.",
    ],
    includes: [
      "Allt material för vaxmodellering",
      "Gjutning i återvunnet sterling silver",
      "Tilltugg och dryck",
      "Keramikskål att förvara det färdiga smycket i",
    ],
    open: true,
  },
];
