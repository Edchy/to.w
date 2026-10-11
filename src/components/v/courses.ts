// The courses on the course page: the real ones from src/data/courses.ts, the silver ring course with
// the hands photo (trying it; before: the bench photo, now unused/kurser/IMG_3309.jpg).
import type { ImageMetadata } from "astro";
import handsPhoto from "../../assets/img/hero/hands.webp";
import { courses, type Course } from "../../data/courses";

export type StudyCourse = { course: Course; image: ImageMetadata; imageAlt: string };

export const studyCourses: StudyCourse[] = courses.map((course) =>
  course.slug === "silverring"
    ? { course, image: handsPhoto, imageAlt: "Händer med flera handgjorda silverringar." }
    : { course, image: course.image, imageAlt: course.imageAlt },
);
