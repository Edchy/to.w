# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People discovering or following Tove Wätte's work who want to explore the artistic practice, browse available jewelry, join a workshop, or make direct contact.

## Product Purpose

TO.W is Tove Wätte's personal website and public home for handmade jewelry, photographs from the wider practice, and occasional workshops. Success means the visitor can understand the breadth of the work, distinguish exploration from shopping, and reach the relevant product, course, or contact path without friction.

## Positioning

The site presents the finished objects together with the hands, materials, environments, and process around them. It is an artist's practice with a direct ordering path, not a conventional ecommerce storefront.

## Operating Context

Visitors browse image-led pages on desktop and mobile. Jewelry is ordered through email rather than checkout. Workshop interest is collected through a Netlify form and confirmed personally.

## Capabilities and Constraints

- Astro and TypeScript, statically generated.
- No ecommerce checkout or CMS.
- `/smycken` is the complete jewelry collection; the homepage combines selected products with the photographic archive.
- Product and workshop facts come from the repository's content data.
- Mobile image collections retain at least two columns where the content remains a collection.

## Brand Commitments

- Name: TO.W / Tove Wätte.
- Handmade, direct, understated, and personal rather than retail-polished.
- Real photography leads; isolated transparent product renders are not part of the public presentation.
- The architectural uppercase wordmark and body copy use the approved Avenir, Montserrat, Corbel, URW Gothic, source-sans-pro, sans-serif stack. Chillax remains a selected display voice.

## Evidence on Hand

- Jewelry catalog, pricing, sizes, descriptions, and photography in `src/content/jewelry/`.
- Practice photography in `src/content/gallery/`.
- Workshop dates and details in `src/data/courses.ts`.
- Existing TO.W wordmark and `public/t-fav.svg` favicon artwork.
- No testimonials, press claims, or ecommerce infrastructure should be invented.

## Product Principles

- Let real work and materials lead before explanatory interface chrome.
- Give each route one distinct job: visual introduction, collection, course, or contact.
- Keep ordering and workshop actions explicit without making the site feel transactional.
- Prefer a small, intentional composition over repeating every available item.
- Preserve direct, factual Swedish copy and accessible reading order.

## Accessibility & Inclusion

Keyboard navigation, visible focus, reduced-motion support, meaningful image alternatives, and responsive reading order are required across the public site.
