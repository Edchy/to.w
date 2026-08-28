import type { ImageMetadata } from "astro";
import silverringImg from "../assets/img/kurser/silverring-kurs.jpg";

/** One occasion of a course. The course itself is described once, and runs on these dates. */
export type CourseDate = {
  slug: string;
  date: string;
  time: string;
  /** Split form of `date`, for typographic display on the homepage teaser. */
  day: string;
  month: string;
  /** Set to false when that occasion is full — drops it from the signup dropdown. */
  open: boolean;
};

export type Course = {
  slug: string;
  title: string;
  intro: string;
  /** Shown alongside the facts panel. */
  image: ImageMetadata;
  imageAlt: string;
  /** Listed in the facts panel; each one is its own option in the signup form. */
  dates: CourseDate[];
  price: string;
  /** Number of places per occasion. Display strings are derived from this — see `spotsLabel` / `spotsWord`. */
  spots: number;
  place: string;
  body: string[];
  includes: string[];
};

export const courses: Course[] = [
  {
    slug: "silverring",
    title: "Skapa din egen silverring",
    intro:
      "Välkommen till en kväll där vi skapar tillsammans. Under min guidning får du designa och forma din egen unika ring.",
    image: silverringImg,
    imageAlt: "Två händer som bär flera handgjorda silverringar",
    dates: [
      {
        slug: "12-sep",
        date: "12 september",
        time: "18.00–20.00",
        day: "12",
        month: "september",
        open: true,
      },
      {
        slug: "26-sep",
        date: "26 september",
        time: "16.00–18.00",
        day: "26",
        month: "september",
        open: true,
      },
    ],
    price: "1 800 kr per deltagare",
    spots: 5,
    place: "Åsgatan 2, Järna",
    body: [
      "Under kursens två(ish) timmar kommer ni få arbeta med hårt vax och forma er egen ring. Under tiden serveras dryck och tilltugg.",
      "Efter kursen tar jag hand om samtliga vaxmodeller och gjuter dem i återvunnet sterling silver, så att varje deltagares design blir till ett färdigt, hållbart smycke.",
      "Vi kommer hålla till i en keramikkällare under kaféet på Åsgatan i Järna där det även kommer att finnas keramik att köpa med sig hem efter att kvällen är slut.",
    ],
    includes: [
      "Allt material för vaxmodellering",
      "Gjutning i återvunnet sterling silver",
      "Tilltugg och dryck",
      "Keramikskål att förvara det färdiga smycket i",
    ],
  },
];

/** Every open occasion across all courses, paired with its course — for the teaser and the form. */
export const openOccasions = courses.flatMap((course) =>
  course.dates.filter((date) => date.open).map((date) => ({ course, date })),
);

const SWEDISH_NUMBERS = ["noll", "en", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio"];

/** Spelled-out count for running prose: "de fem platserna". Falls back to digits above ten. */
export const spotsWord = (spots: number) => SWEDISH_NUMBERS[spots] ?? String(spots);

/**
 * Spot count for display: "Max 5 deltagare".
 * The facts panel covers every date at once, so it passes `perOccasion` to say so.
 */
export const spotsLabel = (spots: number, perOccasion = false) =>
  `Max ${spots} deltagare${perOccasion ? " per tillfälle" : ""}`;
