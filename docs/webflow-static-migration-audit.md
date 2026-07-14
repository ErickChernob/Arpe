# ARPE — Webflow Static Export Migration Audit

**Scope:** Full audit of the exported Webflow site in this repository, in preparation for converting it into a fully independent static site (HTML/CSS/JS/assets only) deployable to traditional Apache hosting (Hostinger, GoDaddy, etc.).

**Status:** Audit only. No project files were modified as part of this phase.

**Repository snapshot audited:** 10 HTML pages, 3 CSS files, 1 JS file, ~110 image assets, no build tooling, no CMS, no forms backend, no server-side code.

---

## 0. Executive Summary

This is a small (10-page) marketing/informational site for a construction/hydraulic-infrastructure company, exported from Webflow. The good news: it has **no Webflow CMS, no Webflow Ecommerce, no Membership, and no live Webflow-hosted form processing** — confirming the brief. It is close to being "just HTML/CSS/JS," but it is not yet fully independent:

- It loads **jQuery from Webflow's own CDN** (`d3e54v103j8qbb.cloudfront.net`), tied to this site's Webflow site ID.
- It loads **Google Fonts via a third-party loader script** (`ajax.googleapis.com/.../webfont.js`), not self-hosted fonts.
- `js/webflow.js` is the **stock Webflow site-runtime bundle** (jQuery-plugin style), required for the mobile nav menu and the `data-ix` fade animations to work. It runs entirely client-side and does not need Webflow hosting to execute, but it does reference `formdata.webflow.com` for form submission (dead code path here, see §7).
- Three pages (`detail_blog.html`, `detail_portfolio.html`, `detail_team.html`) are **orphaned Webflow CMS Collection Page templates** — never linked from navigation, containing empty CMS bindings (`{{name}}`, `w-dyn-bind-empty`) and no real content.
- `404.html` and `ui-elements.html` are **unmodified Webflow "Startup Template" boilerplate** pages, full of dead links to a template's demo pages (`/home-business`, `/about/about-1`, etc.) that don't exist in this site.
- A hidden **sign-up popup form** on `servicios.html` is dead code: nothing in the site ever triggers it open, and its Webflow-hosted submission endpoint won't work once the site is off Webflow.
- There is **no WhatsApp integration, no `tel:`/`mailto:` links, no contact form** anywhere today — `contacto.html` shows the email/phone/address as plain, non-interactive text. (The brief mentions WhatsApp/external-link contact as the target pattern; that isn't implemented yet and should be treated as a to-do rather than an existing feature to "preserve.")
- No analytics, tracking pixels, or third-party widgets of any kind were found (no GA/GTM/Meta Pixel/Hotjar/etc.).
- No `robots.txt`, `sitemap.xml`, `.htaccess`, or canonical tags exist.
- `lang="en"` is set on every page, but all visible content is Spanish.

None of this is architecturally hard to fix. The interactive behavior on the real (linked) pages is limited to: mobile nav toggle, simple load/scroll fade-ins, and one empty lightbox placeholder — all easily reproducible in a few dozen lines of vanilla CSS/JS. The bulk of the work is decluttering template leftovers, localizing external dependencies, and adding the missing SEO/deployment plumbing.

---

## 1. Webflow-specific files, scripts, classes, attributes, metadata, CDN references, dependencies

**Files that are Webflow build artifacts:**
- `css/webflow.css` — Webflow's generic component/utility stylesheet (icon font, `.w-*` component classes: nav, container, row/col grid, buttons, forms, lightbox, dyn-list, richtext, etc.). Auto-generated, should not be hand-edited.
- `css/normalize.css` — standard Nicolas Gallagher normalize reset, bundled by Webflow. Not Webflow-specific itself, but part of the export pipeline.
- `css/arpe-temporal.webflow.css` — the site's **custom** design (all `feature-section`, `hero-block-overlay`, `color-block`, etc. classes, plus 3 CSS custom properties `--royal-blue`, `--medium-orchid`, `--lime-green`). This is the one file with ARPE-specific design and must be preserved carefully.
- `js/webflow.js` — Webflow's client-side runtime (bundled/minified; includes IX2 engine, nav/dropdown/slider/tabs/lightbox controllers, a small vendor bundle including a bezier-easing helper and lodash-like utilities). ~200KB unminified-looking but is the standard published bundle.

**Webflow-specific HTML metadata (present on every page):**
- `<!--  This site was created in Webflow. https://webflow.com  -->` and `<!--  Last Published: ... -->` HTML comments.
- `<html data-wf-page="..." data-wf-site="66887030a54ef0cebd65015a" lang="en">` — internal Webflow page/site IDs, meaningless outside Webflow.
- `<meta content="Webflow" name="generator">`.
- `data-wf-page-id` / `data-wf-element-id` on the one live `<form>` (servicios.html).
- `data-w-id` GUIDs on a few `index.html` links (leftover interaction-binding IDs; currently unused since no IX2 config targets them, see §7).
- `data-collapse`, `data-animation`, `data-duration`, `data-easing`, `data-easing2`, `data-hover`, `data-delay`, `data-no-scroll` on nav elements — Webflow nav-widget configuration, read by `webflow.js`.
- `data-ix="..."` attributes — Webflow's **legacy (IX1)** interaction trigger names (see §7).
- `data-wait` on the popup form submit button (Webflow form-submission UX string).
- `data-new-link="true"` on a couple of `<strong>` footer elements — Webflow editor bookkeeping attribute, harmless, safe to strip.
- Utility classes with the `w-` prefix throughout (`w-nav`, `w-container`, `w-row`, `w-col`, `w-col-6`, `w-button`, `w-inline-block`, `w-form`, `w-lightbox`, `w-dropdown`, `w-richtext`, `w-dyn-list`, `w-dyn-item`, `w-dyn-bind-empty`, `w-clearfix`, `w-icon-nav-menu`, `w-icon-dropdown-toggle`, `w-mod-js`, `w-mod-touch`, `w--current`).
- Inline `<script>` in every `<head>`: the touch-detection snippet that adds `w-mod-js`/`w-mod-touch` classes to `<html>`. This is Webflow boilerplate but harmless and trivial to keep or replace with a one-line equivalent.

**External CDN dependencies:**
- `https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js` — Google/Monotype's WebFont Loader (legacy, last released ~2017). Not a Webflow domain, but a required third party for font loading.
- `https://fonts.googleapis.com` / `https://fonts.gstatic.com` — `preconnect` hints for Google Fonts (used indirectly by the WebFont loader above).
- `https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=66887030a54ef0cebd65015a` — **jQuery, served from Webflow's own CloudFront distribution**, with a `?site=` query string tied to this site's Webflow ID. This is a genuine Webflow-hosting dependency, even though the payload itself is just jQuery 3.5.1.
- `https://daks2k3a4ib2z.cloudfront.net/577a17a71a78df7357099a96/577a17a81a78df7357099b0b_Icon-close.png` — a Webflow-asset-CDN-hosted close icon, used only by the dead sign-up popup on `servicios.html`.
- `https://webflow.com/templates/designers/rowan-hartsuiker` — a credit link to the original template designer, present in `ui-elements.html` (which isn't part of the real site, see §5/§11).

---

## 2. Webflow dependencies required for interactive components

| Component | Currently implemented via | Depends on `webflow.js`? | Notes |
|---|---|---|---|
| Mobile navigation (hamburger) | `.w-nav` + `.w-nav-button` + `data-collapse="medium"` etc., toggled by Webflow's nav controller | **Yes** | No pure-CSS fallback exists today; menu open/close, ARIA state, and outside-click-to-close are all handled by `webflow.js`. Must be reimplemented in custom JS (small, ~30-50 lines) or kept as CSS-only checkbox/details pattern. |
| Dropdown menus | `.w-dropdown` / `.w-dropdown-toggle` / `.w-dropdown-list` | **Yes** (present only in the two orphaned template pages `404.html` and the unused `ui-elements.html`) | Not used on any real, linked page. No action needed unless these pages are kept. |
| Tabs | Not used anywhere in the site | N/A | `.w-tabs` classes are defined in `webflow.css` (dead CSS) but never referenced in any HTML file. |
| Sliders | Not used anywhere in the site | N/A | `.w-slider` classes exist in `webflow.css` (dead CSS) but no HTML uses them. |
| Accordions | Not used anywhere in the site | N/A | No accordion markup found. |
| Scroll interactions | `data-ix="fade-in-on-scroll"` on the "long-feature-block" icons on `index.html` | **Yes** | Legacy IX1 scroll-trigger, driven by `webflow.js`'s IX engine. Easily replaced with an `IntersectionObserver` + CSS transition. |
| Hover effects | Handled entirely by CSS (`:hover` rules in `arpe-temporal.webflow.css` / `webflow.css`) | No | Pure CSS — nothing to migrate. |
| Page-load animations | `data-ix="fade-in-on-load"`, `-load-2`, `-load-3` on hero/subpage titles across most pages | **Yes** | Legacy IX1 load-trigger. Replaceable with a CSS `@keyframes` fade-in applied on `DOMContentLoaded`, no JS engine required. |
| Popup / modal (sign-up form) | `data-ix="hide-popup"` / `data-ix="close-sign-up-popup"` on `servicios.html` | **Yes**, but **dead** | Nothing in the site ever opens this popup (no "show" trigger exists anywhere). It's inert leftover markup. Recommend deleting it in cleanup rather than porting it. |
| Video lightbox | `.w-lightbox` anchor on `nosotros.html`, with an **empty** `w-json` payload (`"items": []`) | **Yes**, but **non-functional** | No video/image is actually attached — clicking it does nothing meaningful today. Needs either real content wired in, or removal, during the visual-preservation phase (flag to the client). |
| Responsive behavior | CSS media queries at `max-width: 991px / 767px / 479px` (and one `min-width: 768px`) in both `webflow.css` and `arpe-temporal.webflow.css` | No (pure CSS) | Fully preservable without any JS. |
| Active/current nav-link state (`w--current`) | Baked statically into each page's exported HTML by Webflow at publish time (not computed at runtime) | No | Already static-safe — no JS needed to keep this working, but it **must be kept in sync by hand** if pages are renamed or new pages added later, since nothing will recompute it automatically anymore. |

**Bottom line:** the only interaction that needs a genuine custom-JS rebuild for the live site is the **mobile nav toggle** and the **fade-in-on-load/scroll** effects. Everything else either doesn't apply (tabs/sliders/accordions unused) or is dead code that can simply be deleted (popup form, empty lightbox, orphaned dropdown pages).

---

## 3. External dependencies inventory

| Category | Item | Source | Required for real site? |
|---|---|---|---|
| Fonts | Open Sans, Montserrat, Source Sans Pro (multiple weights/italics) | Google Fonts, loaded via `ajax.googleapis.com/.../webfont.js` → `fonts.googleapis.com`/`fonts.gstatic.com` | Yes |
| JS libraries | jQuery 3.5.1 | Webflow's CloudFront (`d3e54v103j8qbb.cloudfront.net`), site-ID-scoped URL | Yes (required by `webflow.js`) |
| JS libraries | WebFont Loader 1.6.26 | `ajax.googleapis.com` | Yes, for the current font-loading method (could be replaced by native `@font-face`/`<link>`) |
| JS libraries | Webflow site runtime (`webflow.js`) | Local file, already vendored in `js/` | Yes, for nav + fade animations, until replaced |
| Images | All product/marketing photography and SVG icons | Local `images/` folder | Yes |
| Images | One dead-popup close icon | Webflow asset CDN (`daks2k3a4ib2z.cloudfront.net`) | No — only used by dead popup, safe to drop |
| Videos | None found | — | N/A |
| Analytics / tracking pixels | **None found** (no GA, GTM, Meta/Facebook Pixel, Hotjar, Clarity, etc.) | — | N/A |
| Third-party widgets | **None found** (no chat widgets, maps embeds, reviews widgets) | — | N/A |
| Embedded content (iframes) | **None found** in any page | — | N/A |
| WhatsApp integration | **None found** — no `wa.me`/`api.whatsapp.com` links, no `tel:`/`mailto:` links anywhere, including on `contacto.html` | — | Not yet implemented; treat as new work, not a migration risk |
| Contact form | One Webflow-hosted popup form on `servicios.html` | Local markup + Webflow form backend (`formdata.webflow.com`, referenced inside `webflow.js`) | No — dead/unreachable UI, and per the brief, form processing is explicitly out of scope |

---

## 4. Resources loaded from Webflow/CDN domains

| Domain | What's loaded | Where |
|---|---|---|
| `d3e54v103j8qbb.cloudfront.net` (Webflow's CDN) | jQuery 3.5.1, via a site-ID-scoped URL | Every page, just before `js/webflow.js` |
| `daks2k3a4ib2z.cloudfront.net` (Webflow asset CDN) | One PNG close-icon for the dead popup | `servicios.html` only |
| `ajax.googleapis.com` | WebFont Loader script | Every page's `<head>` |
| `fonts.googleapis.com`, `fonts.gstatic.com` | `preconnect` hints + actual font/CSS delivery triggered by the WebFont loader | Every page's `<head>` |
| `webflow.com` | A text credit link to the original template's designer page (not a resource load) | `ui-elements.html` only |
| `webflow.com` (referenced inside `js/webflow.js`, not fetched by these pages) | `formdata.webflow.com` form-submission endpoint hostname appears in the bundle's source but is never actually hit because the one form here has no working Webflow site behind it | `js/webflow.js` (dead code path for this project) |

No `website-files.com` / `assets-global.website-files.com` references were found — this export doesn't hot-link any Webflow-hosted image assets; all images are local.

---

## 5. HTML structure review

**Webflow-specific attributes found:**
`data-wf-page`, `data-wf-site`, `data-wf-page-id`, `data-wf-element-id`, `data-w-id`, `data-ix`, `data-animation`, `data-collapse`, `data-duration`, `data-easing`, `data-easing2`, `data-hover`, `data-delay`, `data-no-scroll`, `data-wait`, `data-new-link`, `data-name` (on form fields), plus the `w-*` class family.

**Safe to remove outright (no functional or visual role once off Webflow):**
- `data-wf-page`, `data-wf-site`, `data-wf-page-id`, `data-wf-element-id` — purely Webflow-editor bookkeeping, never read by anything in a static deployment.
- `data-new-link="true"` — editor bookkeeping.
- The two Webflow HTML comments (`This site was created in Webflow…` / `Last Published…`).
- `<meta name="generator" content="Webflow">`.
- `data-w-id` on the four `index.html` service links — currently unused (no matching IX2 config references them; see §7). Safe to drop once confirmed no future interaction is planned for them.

**Must remain (for now) because current JS/CSS still reads them:**
- All `w-*` classes (`w-nav`, `w-container`, `w-row`, `w-col-*`, `w-button`, `w-inline-block`, `w-form`, `w-lightbox`, `w-dropdown`, `w-icon-*`, `w-mod-*`, `w--current`) — these are the selectors targeted by `webflow.css` and by `webflow.js`'s component controllers. Removing them without rewriting the corresponding CSS/JS will break layout and behavior.
- `data-collapse`, `data-animation`, `data-duration`, `data-easing`, `data-easing2`, `data-hover`, `data-delay` on nav/dropdown elements — read directly by `webflow.js`'s nav/dropdown controllers.
- `data-ix="..."` — read by `webflow.js`'s legacy IX1 engine; needed until the fade-in effects are reimplemented in custom CSS/JS.
- `role="banner"`, `role="navigation"`, `role="list"`, `role="listitem"` — these are good, standard ARIA roles; keep them regardless of Webflow.

**Accessibility / semantic HTML issues to address later (not urgent, but worth a backlog item):**
- `lang="en"` on every page despite 100% Spanish content — should be `lang="es"` (or `es-MX`).
- All body copy images use empty `alt=""` (e.g. every icon, hero image, and content photo). Decorative icons are fine with empty `alt`, but content-bearing images (e.g. the hero/feature photos) should get descriptive `alt` text.
- No `<h1>` exists on `index.html` (the hero uses `<h1 class="overall-hero-title">` — actually confirmed present — but subpages like `nosotros.html`/`servicios.html` use `<h2 class="subpage-title">` as their top-level heading with no page `<h1>` at all). Worth normalizing heading hierarchy per page.
- Nav toggle button (`.w-nav-button`) has no visible text or `aria-label`, relying purely on an icon glyph — should get an `aria-label="Menu"` equivalent for screen readers.
- The empty `class="feature-text-block"` `<div>` at the end of `aviso-de-privacidad.html` (line 45) is a stray, content-less leftover element.
- `detail_blog.html` / `detail_team.html` / `detail_portfolio.html` have **empty `<title>`** and empty meta description/OG tags (literal `content=""`), which is invalid/unhelpful if these pages are ever kept or crawled.

---

## 6. CSS review

- **Webflow-generated utility styles:** all of `css/webflow.css` (grid `.w-row`/`.w-col-*`, `.w-container`, `.w-button`, `.w-nav*`, `.w-dropdown*`, `.w-slider*`, `.w-tabs*`, `.w-lightbox`, `.w-form*`, `.w-richtext`, `.w-dyn-*`, the `webflow-icons` icon font, and the base `.w-mod-js`/`.w-mod-touch` rules). This file should be treated as a vendored dependency, not hand-edited.
- **Duplicate rules:** normal for a Webflow export — the same selector is legitimately redefined across the four breakpoints (base, 991px, 767px, 479px) in both `webflow.css` and `arpe-temporal.webflow.css`. This is expected responsive-override structure, not accidental duplication; don't try to "deduplicate" it away, as doing so would likely break the responsive cascade.
- **Unused styles:** `webflow.css` still defines `.w-slider*`, `.w-tabs*`, and most of `.w-dropdown*` even though none of those components are used on any real, linked page (only the two template/orphan pages use dropdowns). These rules are inert dead weight (a few KB) but harmless to leave in place during the fidelity phase; candidates for trimming in the optimization phase once the whole file is otherwise verified stable.
- **Responsive breakpoints in use:** `max-width: 991px`, `767px`, `479px`, and one `min-width: 768px` rule — standard Webflow tablet/landscape-phone/portrait-phone breakpoints. Consistent across both stylesheets.
- **Classes that must not be renamed during the fidelity phase:** every `w-*` class (they're the load-bearing hooks for `webflow.css` and `webflow.js`), and every custom class defined in `arpe-temporal.webflow.css` (≈330 distinct selectors — e.g. `feature-section`, `hero-block-overlay`, `color-block`, `long-feature-block`, `subpage-header`, `simple-footer`, etc.). Renaming any of these without a matching CSS update will silently break the visual design.
- **Styles that depend on Webflow JavaScript:** the mobile-menu open/closed states (`webflow.js` toggles inline styles/height on `.w-nav-menu` and adds `.w--open` to `.w-nav-button`), and the `.w-lightbox` overlay/gallery styling (only triggered via JS, currently pointed at an empty gallery). The fade-in `data-ix` effects rely on inline styles that `webflow.js`'s IX engine injects at runtimes — there is no CSS-only fallback for them today (elements are visible-by-default in plain CSS with JS disabled, which is an acceptable, if unanimated, degrade).
- CSS custom properties `--royal-blue`, `--medium-orchid`, `--lime-green` are used — modern, framework-agnostic, no migration concern.

---

## 7. JavaScript review

- **Essential:** `js/webflow.js` (until nav + fade effects are reimplemented), the jQuery bundle it depends on, and the inline touch-detection snippet in `<head>` (adds `w-mod-touch`, used by some CSS selectors for touch-device tweaks).
- **Unused/dead:** the WebFont Loader script technically "works," but is a legacy library (last updated ~2017) doing something a native `<link rel="stylesheet">`/`@font-face` could do without a runtime dependency. The Webflow form-submission code paths inside `webflow.js` (targeting `formdata.webflow.com`) are present in the bundle but structurally dead here, since the one form on the site (`servicios.html` popup) is never opened by any UI element and, even if it were, would fail once the site is no longer registered with Webflow's backend.
- **Interactions that must be recreated with custom JavaScript:**
  1. Mobile nav hamburger toggle (open/close, ARIA state, click-outside-to-close).
  2. `data-ix="fade-in-on-load"` / `-2` / `-3` (page-load fade-ins on hero/subpage titles).
  3. `data-ix="fade-in-on-scroll"` (scroll-triggered fade-ins on the three "long-feature-block" icons on `index.html`).
- **Interactions that can be replaced with CSS alone:** all hover effects (already CSS-only); the load-fade effects could arguably be done with a pure-CSS `animation: fadeIn ... forwards` on page load with no JS at all, which is the simplest and most robust replacement. The scroll-triggered fade needs a small `IntersectionObserver` (a few lines of vanilla JS), since CSS alone can't detect scroll-into-view without newer `animation-timeline: view()` (not yet safe to rely on for broad compatibility).
- **Scripts that may stop working outside Webflow hosting:** the popup sign-up form's submission handling (targets Webflow's hosted form backend, which won't recognize this site once decoupled) — moot, since the popup is unreachable UI anyway; recommend deleting the whole popup block instead of trying to fix its submission.
- **IX2 (Webflow's advanced interactions engine):** `webflow.js` **does** include the IX2 runtime (`Webflow.require("ix2")`, along with `"ix"` (legacy), `"lottie"`, `"rive"`, and `"spline"` module hooks — all part of the generic Webflow bundle, not evidence of actual use). However, **no IX2 configuration JSON was found anywhere in the exported HTML** — there is no embedded interactions data object, and the four `data-w-id` GUIDs present on `index.html` have no corresponding trigger/keyframe data referencing them. All real interactivity in this export uses the **older, simpler `data-ix="<name>"` (IX1) attribute system**, not IX2. Conclusion: **IX2 is present only as unused runtime capability inside `webflow.js`; there is no IX2 config to port, complete or partial.** Only the small set of named IX1 triggers listed above needs to be reproduced.

---

## 8. Internal link / URL structure review

All internal links use flat, extension-ful, same-directory relative paths (`index.html`, `nosotros.html`, `servicios.html`, `contacto.html`, `aviso-de-privacidad.html`) with no subdirectories, no query strings, and no path-based routing. This structure maps **cleanly and directly onto Apache/traditional hosting** — copying the whole tree into `public_html/` and it will resolve as-is with zero URL changes needed. Two dead-link caveats:

- `404.html` and `ui-elements.html` contain absolute-path links to template pages that don't exist in this project (`/home-business`, `/home-iphone-app`, `/old-home`, `/about/about-1..4`, `/features/features-1..2`, `/pricing/pricing-1..5`, `/blog-variations/blog-1..3`, `/contact-pages/contact-2..5`, `/sign-up-forms/sign-up-1..2`). These will 404 if ever clicked; since these pages are template leftovers not linked from real navigation, the simplest fix is deleting/rebuilding these two pages rather than fixing the dead links inside them.
- No page currently declares a canonical URL or uses "clean URLs" (extension-less paths); if the client wants pretty URLs later (e.g. `/nosotros` instead of `/nosotros.html`), that's an **optional** Apache rewrite addition, not a requirement — current `.html` URLs work fine on any standard host.

---

## 9. Metadata / SEO / operational review

| Item | Status |
|---|---|
| Page titles | Present and reasonably descriptive on `index.html`, `contacto.html`, `servicios.html` (all three share the exact same title — a missed opportunity for per-page titles), `nosotros.html`, `aviso-de-privacidad.html`, `404.html`. **Empty** on `detail_blog.html`/`detail_team.html`/`detail_portfolio.html` (orphaned template pages). |
| Meta descriptions | Present (and, again, identical across most real pages) except on the three orphaned detail pages, where it's empty or generic template text. |
| Canonical tags | **None found anywhere.** Should be added (`https://www.arpesa.com.mx/...` or whatever the production domain is) once the domain is finalized. |
| Open Graph metadata | `og:title`, `og:description`, `og:type` present on real pages; **no `og:image` or `og:url`** anywhere. Should be added for better link-preview quality on WhatsApp/social shares (relevant given the contact channel is meant to be WhatsApp). |
| Favicons | `images/favicon.png` (`rel="shortcut icon"`) and `images/webclip.png` (`rel="apple-touch-icon"`) are present and correctly referenced on every page. No modern `rel="icon"` with explicit sizes, no `manifest.json`, no `theme-color` meta — minor, optional polish. |
| `robots.txt` | **Absent.** Should be added before go-live (even a permissive one) to avoid default-crawl ambiguity. |
| `sitemap.xml` | **Absent.** Recommended for a 5-real-page marketing site to help search engines index it fully. |
| 404 behavior | `404.html` exists with the right visual shell, but is unmodified Webflow template content (English "Sorry, this page does not exist" boilerplate, plus dead links, see §8). Needs content rewritten to match ARPE's branding/language, and needs to actually be wired up as the Apache custom error document (see §10). |
| Analytics / tracking | **None present.** Nothing to migrate; add if/when the client wants analytics. |

---

## 10. Deployment considerations (Apache / traditional hosting)

- **Relative paths:** all CSS/JS/image references use consistent relative paths (`css/...`, `js/...`, `images/...`) from the site root, with no leading slash issues. Safe to drop into `public_html/` as-is.
- **Absolute paths:** the only absolute (root-relative) internal paths are the dead template links in `404.html`/`ui-elements.html` (`/home-business`, etc. — see §8). No real page uses root-relative internal links that could break if the site were deployed in a subdirectory.
- **Uppercase/lowercase filenames:** several image filenames are capitalized (`Color.png`, `Blanco.png`, `Logo.png`, `Photo-1.jpg`, etc.). All current `<img src>` references match the actual on-disk casing exactly (verified — zero broken references), so this is **not currently a problem**, but Linux/Apache filesystems are case-sensitive, unlike the Windows/Mac environments a developer might edit on — any future edit that introduces a case mismatch (e.g. typing `color.png`) will 404 silently in production. Recommend normalizing to a single case convention (lowercase-with-hyphens) during cleanup to remove this class of risk entirely, or at minimum documenting the exact required casing.
- **Spaces or special characters in filenames:** none found — all filenames use only letters, digits, hyphens, and underscores. No URL-encoding concerns.
- **Malformed filenames from the Webflow export process:** a handful of image files have concatenated/duplicated names that look like export artifacts rather than intentional filenames — e.g. `Photo-12_1Photo-12-thumb-130-130-80.jpg`, `Photo-2_1Photo-2-thumb-130-130-80.jpg`, `Photo-3_1Photo-3-thumb-130-130-80.jpg`, `Photo-5_1Photo-5-thumb-130-130-80.jpg`, `Photo-6_2Photo-6-thumb-130-130-80.jpg`. None of these are referenced by any HTML page (see below), so they're safe to remove.
- **Clean URLs / `.html` extensions:** the site currently relies on explicit `.html` extensions everywhere and that works fine on any Apache host without configuration. No action required unless the client explicitly wants extension-less URLs later (optional `.htaccess` rewrite, not a migration blocker).
- **Apache configuration / `.htaccess`:** none exists yet. For a clean traditional-hosting deployment, plan to add a minimal `.htaccess` for: (a) the custom 404 document (`ErrorDocument 404 /404.html`), (b) forcing `www` vs. non-`www` and/or HTTPS canonicalization (host-dependent, decide with client), and (c) basic cache-control headers for static assets (optional optimization).
- **Unused asset cleanup opportunity:** of ~110 files in `images/`, **72 are not referenced by any HTML page** (correcting for `favicon.png`/`webclip.png`, which *are* referenced via `<link>` tags rather than `<img src>` and are therefore **not** actually unused). The genuinely unused ~70 files fall into two buckets:
  1. Webflow-auto-generated responsive/thumbnail variants of images that already exist in full size but whose `srcset`/thumbnail versions are no longer wired into any `<img>` (the site's current markup doesn't use `srcset` at all — zero instances found across all 10 pages), e.g. `Photo-1-thumb-130-130-80.jpg`, `Icon-facebook-p-130x130q80.png`, etc.
  2. Leftover imagery from the original Webflow "Startup Template" that ARPE's content never used (`Home-App.jpg`, `Home-Business-1/2.jpg`, `Job-seeker-image.jpg`, `Button-Google-play*.png`, `UI-Elements.jpg`, `Icon-rss*`, `Icon-google*`, `Testimonial-12.jpg`, `Z-1.jpg`, `constructionsite.png`, plus a few stray uploaded photos not used on any current page: `isis-franca-hsPFuudRg5I-unsplash.jpg`, `jani-brumat-CJTUbgI1N1s-unsplash.jpg`, `martin-martz-29PaIGCEq10-unsplash.jpg`).
  These are all safe to delete during the Cleanup phase (after a final confirmation pass), shrinking the ~20MB `images/` folder meaningfully.

---

## 11. Page-by-page inventory

| Page | Linked from real nav? | Purpose | Notable issues |
|---|---|---|---|
| `index.html` | Yes | Homepage | Only page using `fade-in-on-scroll`; 4 unused `data-w-id` GUIDs on service links |
| `nosotros.html` | Yes | About / Nosotros | Contains the one `.w-lightbox` instance, currently empty/non-functional |
| `servicios.html` | Yes | Services | Contains the dead sign-up popup form (never triggered) |
| `contacto.html` | Yes | Contact | Static text only — no `tel:`/`mailto:`/WhatsApp links, no form |
| `aviso-de-privacidad.html` | Yes (footer link only) | Privacy notice (legal, Mexican Ley Federal de Protección de Datos Personales) | Stray empty `<div class="feature-text-block">` at the end |
| `404.html` | Served by Apache config only (not a nav link) | Error page | Unmodified Webflow "Startup Template" boilerplate; English copy; many dead links to nonexistent template pages |
| `ui-elements.html` | **No** — orphaned | Webflow template style-guide/kitchen-sink page (buttons, footers, nav variants, etc.) | Not part of the real ARPE site; safe candidate for deletion (or retention purely as an internal dev reference, not deployed) |
| `detail_blog.html` | **No** — orphaned | Webflow CMS Collection Page template (blog post detail) | Entirely empty CMS bindings (`w-dyn-bind-empty`), empty title/meta; never had real content |
| `detail_portfolio.html` | **No** — orphaned | Webflow CMS Collection Page template (portfolio detail) | Skeleton only — head + two script tags, no body content at all |
| `detail_team.html` | **No** — orphaned | Webflow CMS Collection Page template (team member detail) | Same empty skeleton as `detail_portfolio.html`; literal `{{name}}` placeholder left in `<title>`/OG tags |

**5 real, in-use pages** (`index`, `nosotros`, `servicios`, `contacto`, `aviso-de-privacidad`) + **1 required infra page** (`404`) + **4 orphaned template leftovers** (`ui-elements`, `detail_blog`, `detail_portfolio`, `detail_team`) that should be explicitly discussed with the client for removal before go-live rather than silently deployed.

---

## 12. Interaction inventory (what must be preserved)

1. **Mobile nav toggle** (hamburger open/close) — present on every real page's `.w-nav`. Must preserve.
2. **Nav "current page" highlighting** (`w--current`/`aria-current`) — already static per-page, just needs manual upkeep going forward. Must preserve.
3. **Page-load fade-ins** (`fade-in-on-load`, `-2`, `-3`) — hero titles/subtitles on `index.html`, `nosotros.html`, `servicios.html`, `contacto.html`, `404.html`. Must preserve (cosmetic, low risk to simplify).
4. **Scroll-triggered fade-ins** (`fade-in-on-scroll`) — the three feature-icon blocks in each of the two `index.html` feature sections (6 elements total). Must preserve.
5. **Hover states** on buttons/nav links/cards — pure CSS, automatically preserved as long as CSS is kept intact.
6. **Responsive layout collapse** at 991/767/479px breakpoints — pure CSS, automatically preserved.
7. ~~Video lightbox on `nosotros.html`~~ — currently non-functional (empty gallery); flag to client: either supply real content for it or remove it. Not "preserving" a working feature, since it doesn't work today.
8. ~~Sign-up popup form on `servicios.html`~~ — dead/unreachable; recommend removing rather than preserving.

---

## 13. Risk assessment

**Low risk**
- Static HTML/CSS structure and responsive breakpoints — directly portable, no logic involved.
- Image/font/asset paths — all relative, all resolvable, no case-sensitivity conflicts found today.
- Internal link structure — flat, `.html`-suffixed, maps 1:1 onto Apache hosting.
- Hover effects, grid layout, typography — pure CSS.
- Removing orphaned/dead pages and unused images — well-isolated, nothing references them.

**Medium risk**
- Replacing `webflow.js`'s mobile-nav controller and the `data-ix` fade effects with custom JS/CSS — small in scope, but must be tested across breakpoints and touch devices to avoid regressions (menu not closing, animations firing twice, etc.).
- Localizing/self-hosting jQuery and Google Fonts — low technical difficulty, but must confirm no other part of `webflow.js` implicitly expects the exact jQuery build/version served from Webflow's CDN.
- SEO/metadata gaps (missing canonical, OG image, `robots.txt`, `sitemap.xml`, `lang="es"` fix, duplicate titles/descriptions across pages) — not risky to fix, but easy to forget and should be tracked explicitly.
- Deciding the fate of the 4 orphaned pages and the empty video lightbox — not a technical risk, but a **product decision** that needs the client's sign-off before cleanup, since deleting content is harder to "undo" than leaving it.

**High risk**
- None identified. This is a small, dependency-light static export with no CMS/database coupling, no build pipeline, and no server-side logic — there is no high-risk migration path here as long as the "don't rename `w-*`/custom CSS classes until the JS/CSS dependent on them is replaced" rule from §5/§6 is respected during the decoupling phase.

---

## 14. Proposed conservative migration plan

This plan assumes each phase is validated (visually and functionally, across breakpoints) before moving to the next, and that no phase touches more than necessary.

### Phase 1 — Visual preservation (baseline lock-in)
- Take full-page screenshots (desktop/tablet/mobile) of all 6 real+infra pages as the "ground truth" reference.
- Do not change any markup or styles yet; this phase is purely about establishing a before/after comparison baseline.

### Phase 2 — Webflow decoupling
- Remove Webflow-only metadata/attributes that carry no functional weight: `data-wf-page`, `data-wf-site`, `data-wf-page-id`, `data-wf-element-id`, `data-new-link`, the Webflow HTML comments, and the `generator` meta tag.
- Self-host jQuery 3.5.1 (or an equivalent pinned version) locally instead of loading it from Webflow's CDN, and update the one `<script src>` per page accordingly.
- Replace the Google WebFont Loader script with either self-hosted font files (`@font-face` + local `woff2`) or a direct `<link>` to Google Fonts' own CSS endpoint (client's choice — self-hosting is the more "fully independent" option per the stated goal).
- Confirm `webflow.css`/`arpe-temporal.webflow.css`/`js/webflow.js` still function correctly with only the above swapped out (no visual/behavioral change expected at this stage).

### Phase 3 — Interaction replacement
- Reimplement the mobile nav toggle in a small vanilla-JS file (open/close, `aria-expanded`, click-outside/escape-to-close).
- Replace `data-ix="fade-in-on-load*"` with a CSS `@keyframes fadeIn` applied on page load (no JS needed).
- Replace `data-ix="fade-in-on-scroll"` with a small `IntersectionObserver`-based utility.
- Remove `js/webflow.js` and jQuery entirely once the above two replacements are verified equivalent, since nothing else in the site depends on them (no tabs/sliders/accordions/dropdowns are used on any real page).
- Decide, with the client, the fate of the empty video lightbox on `nosotros.html` (remove vs. wire up real content) and the dead sign-up popup on `servicios.html` (remove, since it's unreachable and its backend won't work anyway).

### Phase 4 — Cleanup
- Remove or explicitly archive (client decision) the four orphaned pages: `ui-elements.html`, `detail_blog.html`, `detail_portfolio.html`, `detail_team.html`.
- Rewrite `404.html` with ARPE-branded, Spanish-language content and working links only (drop all dead template links).
- Delete the ~70 unreferenced image files identified in §10 (after a final confirmation that they're truly unused).
- Fix `lang="en"` → `lang="es"` (or `es-MX`) site-wide.
- Fix the stray empty `<div class="feature-text-block">` on `aviso-de-privacidad.html`.
- Deduplicate/differentiate the currently-identical page titles and meta descriptions across `index.html`/`servicios.html`/`contacto.html`/etc.

### Phase 5 — Testing
- Cross-browser/cross-device pass (desktop, tablet, mobile — real devices or emulation) for layout, nav toggle, and fade animations.
- Link-check pass across all remaining pages (internal + the two external social links in the footer, if kept) to confirm zero 404s.
- Accessibility pass: nav button `aria-label`, heading hierarchy, `alt` text on content images, color-contrast spot check.
- Validate the custom 404 page is served correctly at the hosting layer.

### Phase 6 — Optimization
- Add `robots.txt` and `sitemap.xml`.
- Add canonical tags, `og:image`/`og:url`, and consistent per-page titles/descriptions once the production domain is finalized.
- Optionally compress/convert imagery (JPEG/PNG → WebP or better-compressed originals) given the ~20MB `images/` folder, and add `loading="lazy"` where not already present (already present on a couple of images, e.g. in `nosotros.html`; extend consistently site-wide).
- Optionally normalize all filenames to a single lowercase-hyphenated convention to eliminate future case-sensitivity risk on Linux hosting.

### Phase 7 — Packaging and deployment
- Final review of the whole tree for absolute local paths (there should be none outside the two removed template pages).
- Add a minimal `.htaccess` for the custom 404 document and any agreed-upon canonicalization (www/non-www, HTTPS).
- Package the final `public_html`-ready tree and deploy via the hosting provider's file manager/FTP, matching the flat root-level structure already in place (no path changes needed).
- Post-deploy smoke test on the live domain: all 5 real pages load, nav works on mobile, fonts render, images load, 404 page fires for a bad URL.

---

*This document is an audit and plan only. No implementation has been performed as part of this phase.*
