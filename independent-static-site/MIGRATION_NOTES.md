# ARPE — Migration Notes (Webflow export → independent static site)

This directory (`independent-static-site/`) is a fully independent copy of the
Webflow export that lives at the repository root. The original export was
**not modified** — this folder can be regenerated or diffed against it at any
time, and it can be deployed as-is by copying its contents into a host's
`public_html/` directory.

Reference used for fidelity checks: `https://arpesa.com.mx/` (per the task
brief). **Note:** this build environment's outbound network policy blocks
the live domain and Webflow's own CDN (`*.cloudfront.net` for
`d3e54v103j8qbb` and `daks2k3a4ib2z`), so the live site itself could not be
fetched or screenshotted directly from here. All fidelity verification was
instead done against the exported HTML/CSS (which is the same code that
generates the live site) plus local rendering in headless Chromium. See
"Known limitations" below for the one place this matters concretely.

---

## 1. Removed Webflow dependencies

| Removed | Replaced with |
|---|---|
| `js/webflow.js` (Webflow's site runtime bundle) | `js/nav.js` + `js/animations.js` (vanilla JS, see §2) |
| jQuery 3.5.1 loaded from `https://d3e54v103j8qbb.cloudfront.net/...?site=...` (Webflow's CDN) | Removed entirely — nothing in the rebuilt JS needs it |
| Google WebFont Loader (`ajax.googleapis.com/.../webfont.js`) + `WebFont.load({...})` + the two `fonts.googleapis.com`/`fonts.gstatic.com` `preconnect` hints | Self-hosted `css/fonts.css` + `fonts/*.woff2` (see §5) |
| `<!-- This site was created in Webflow -->` / `<!-- Last Published: ... -->` HTML comments | Removed |
| `<meta name="generator" content="Webflow">` | Removed |
| `data-wf-page`, `data-wf-site` on every `<html>` tag | Removed |
| `data-wf-page-id`, `data-wf-element-id` (on the dead sign-up popup form) | Removed along with the popup itself (see below) |
| `data-new-link="true"` bookkeeping attribute (footer `<strong>` tags) | Removed |
| 4 unused `data-w-id` GUIDs on `index.html` service links | Removed (confirmed via the earlier audit that no IX2 config ever referenced them) |
| The dead "Sign up for a free account" popup on `servicios.html` (`data-ix="hide-popup"`/`"close-sign-up-popup"`, its Webflow-CDN-hosted close icon, and its Webflow-form-backend-targeted `<form>`) | Removed entirely. It was never reachable — nothing in the site ever set the trigger that would show it, and its form action (`formdata.webflow.com`, referenced inside `webflow.js`) would not work once off Webflow anyway. This was confirmed dead code in the migration audit, not a working feature. |
| `lang="en"` on every page | Changed to `lang="es"` (site content is 100% Spanish) |
| `rel="shortcut icon" type="image/x-icon"` pointing at a `.png` (mime-type mismatch) | Changed to `rel="icon" type="image/png"` |

**Not removed / kept as-is:**
- All Webflow-generated CSS (`css/normalize.css`, `css/webflow.css`) and the site's custom stylesheet (`css/arpe-temporal.webflow.css`) — untouched, since removing/renaming any `.w-*` class or custom class risks breaking the visual design (per the "preserve visual appearance" requirement). This also means some Webflow-authored CSS for components not used anywhere in this site (`.w-tabs`, `.w-slider`, most `.w-dropdown`) is still present as dead weight — left alone per the "don't aggressively optimize yet" instruction. Safe to prune in a later optimization pass once confirmed unused on every page (the previous audit already did this check: tabs/sliders are unused everywhere; dropdowns are only used on the two orphaned template pages, `404.html` and `ui-elements.html`).
- All `w-*` classes and `data-collapse`/`data-animation`/`data-duration`/`data-easing`/`data-easing2`/`data-hover`/`data-delay`/`data-no-scroll` attributes on nav/dropdown elements — these are the exact hooks the replacement JS (`nav.js`) reads, and the exact hooks `webflow.css` still styles from. Removing them would require rewriting the CSS too, which was out of scope (visual fidelity must be preserved).
- The `data-ix="..."` attribute names (`fade-in-on-load`, `-2`, `-3`, `fade-in-on-scroll`) — kept as-is and reused as the selectors for the new `animations.js`, so the HTML diff for this part is minimal.

---

## 2. Replaced interactions

| Interaction | Old (Webflow) | New (vanilla JS/CSS) |
|---|---|---|
| Mobile nav hamburger (open/close, all 5 real pages + the 2 orphaned template pages) | `webflow.js` nav controller, toggling `data-nav-menu-open` / `.w--open` | `js/nav.js` — same attribute/class contract, so zero CSS changes were needed. Adds `aria-expanded`, closes on outside click, Escape, nav-link click, and on resize past the page's `data-collapse` breakpoint. |
| Dropdown menus (only present on the orphaned `404.html`/`ui-elements.html`/`detail_blog.html` template pages — no real, linked page uses one) | `webflow.js` dropdown controller, toggling `.w--open` on `.w-dropdown-list` | `js/nav.js` — same toggle contract; supports `data-hover`/`data-delay` exactly like the original, closes on outside click/Escape. |
| Page-load fade-ins (`fade-in-on-load`/`-2`/`-3`) | Webflow's legacy IX1 engine inside `webflow.js` | `js/animations.js` reveals elements on a 0/200/400ms stagger (matching the 3 distinct trigger names) by adding an `ix-visible` class; `css/interactions.css` defines the actual fade+translate transition. |
| Scroll-triggered fade-ins (`fade-in-on-scroll`, the 6 "long-feature-block" icon rows on `index.html`) | Webflow's legacy IX1 engine | `js/animations.js` uses a single `IntersectionObserver` (threshold 0.2, fires once) to add `ix-visible`. |
| Hover states, responsive layout/breakpoints | Pure CSS already | Untouched — no JS was ever involved. |
| Tabs, sliders, accordions | Not used anywhere in this site (confirmed in the audit and re-confirmed here) | Nothing to build. |

**Important note on the fade effects:** no Webflow IX2 configuration exists anywhere in this export (confirmed in the audit phase — the site only ever used the older, simpler `data-ix` trigger names, and `webflow.js`'s bundled IX2 engine was never actually fed any per-site interaction data). There is no original animation "spec" to copy exactly; the timing/easing used here (500ms ease, 20px translate, 0/200/400ms stagger) is a reasonable, standard reconstruction of Webflow's classic default "fade in" preset, not a byte-for-byte port of a captured config. Treat the exact timing as a starting point for visual sign-off, not a guaranteed pixel-for-pixel match of whatever the live site currently does.

**Progressive enhancement:** the CSS that hides elements before they fade in
is scoped under `.w-mod-js` (a class the inline touch-detection snippet in
`<head>` already added, independent of the new external scripts). If
JavaScript is disabled entirely, `.w-mod-js` is never added, so the hidden
state's selector never matches and all content renders fully visible
immediately — nothing is ever permanently hidden for no-JS visitors. This is
the same behavior the original Webflow implementation had.

---

## 3. External dependencies that remain

| Dependency | Status |
|---|---|
| Google Fonts (Open Sans, Montserrat, Source Sans Pro) | **Localized** — see §5. No remaining runtime dependency on Google's servers. |
| jQuery | **Removed entirely.** Nothing in the rebuilt site needs it (no tabs/sliders/accordions/lightbox-with-content/live-form on any real page). |
| Analytics / tracking (Google Analytics, Meta Pixel, etc.) | **None existed in the source** and none were added. The task brief said to preserve these if present; the audit already confirmed none exist anywhere in this export. |
| WhatsApp / `tel:` / `mailto:` links | **None existed in the source.** `contacto.html` shows email/phone/address as plain static text, not as clickable links, in both the original export and this migrated copy. Nothing was fabricated here — adding real WhatsApp/`tel:`/`mailto:` links is new work for the client to request explicitly, not a "preserve existing integration" migration task. |
| Embedded maps / video embeds / third-party widgets | **None existed in the source.** Nothing to preserve or remove. |
| Video lightbox on `nosotros.html` (`.w-lightbox` anchor) | Left in place, inert (no JS drives it now, same as before — its Webflow JSON payload was already empty, `"items": []`, so it never showed real content even under the original `webflow.js`). See "Manual review" below. |

---

## 4. Files that must be reviewed manually

- **`404.html`** — now wired up as the real Apache error document (via `.htaccess`), but its content is still 100% unmodified Webflow "Startup Template" boilerplate: English copy ("Sorry, this page does not exist (anymore)"), a "Startup" logo instead of ARPE's, and a dropdown nav full of links to demo pages that don't exist in this project (`/home-business`, `/about/about-1..4`, `/pricing/pricing-1..5`, etc.). This was flagged in the original audit as needing a content rewrite; it was **not** rewritten here because that's a content/copy decision, not a technical dependency-removal task, and rewriting it unilaterally risked overstepping "don't redesign/change content." **Recommend the client (or a follow-up task) replace this page's copy and prune the dead links before go-live.**
- **`ui-elements.html`, `detail_blog.html`, `detail_portfolio.html`, `detail_team.html`** — orphaned Webflow template/CMS-collection leftovers, not linked from any real navigation (confirmed again in this pass). They were kept (not deleted) for rollback safety and had their Webflow-specific markup cleaned up like every other page, but they still contain no real ARPE content (`detail_team.html`/`detail_portfolio.html` are literally empty skeletons; `detail_blog.html` has only empty CMS bindings). They were given `<meta name="robots" content="noindex, nofollow">` so they can't accidentally get indexed, but **recommend deleting them entirely before deployment** unless the client has a concrete plan to populate them.
- **`ui-elements.html` — 2 unlocalized image references**: `Icon-facebook.png` and `Button-App-Store.png` are still hotlinked from Webflow's asset CDN (`daks2k3a4ib2z.cloudfront.net`). This build environment's network policy blocked that CDN, so these two could not be downloaded and localized like every other asset. They will very likely still resolve fine in production (it's a public, unauthenticated asset CDN), but should be downloaded and moved into `images/` manually before final go-live, or the orphaned page should simply be removed (see above).
- **Video lightbox on `nosotros.html`** — the anchor/markup was preserved as-is (per "preserve visual appearance"), but it points at an empty gallery (`"items": []`) and has never shown real content, before or after this migration. Decide with the client whether to (a) supply a real video/image and build a small custom lightbox for it, or (b) remove the dead link.
- **Now-orphaned CSS selectors**: removing the dead sign-up popup left its supporting classes (`.sign-up-popup`, `.popup-block`, `.popup-close-button`, `.close-icon`, `.popup-sign-up-form`, `.popup-title`, `.fields-column-left/right`, `.dark-field`, `.sign-up-bottom-text`, `.success-message`, `.error-bg`) unused in `css/arpe-temporal.webflow.css`. Per "don't aggressively optimize yet," they were **not** removed from the CSS in this pass — flagging for a future cleanup/optimization pass.
- **Duplicate/near-duplicate page titles and meta descriptions**: `index.html`, `servicios.html`, and `contacto.html` all currently share the exact same `<title>` and meta description (inherited from the original export, not something this migration changed). Worth differentiating per page for SEO in a follow-up content pass — the brief asked to preserve, not rewrite, existing copy, so this was left alone.

---

## 5. Localized assets

- **Fonts**: downloaded self-hosted `.woff2` files for Open Sans, Montserrat, and Source Sans Pro directly from Google Fonts' CDN (the same files Google's own loader would have fetched), covering every weight/style combination the original `WebFont.load(...)` call requested. **Scope decision:** only the `latin` and `latin-ext` Unicode subsets were downloaded (20 files, ~650KB total) — the original Google-hosted CSS also serves `cyrillic`, `cyrillic-ext`, `greek`, `greek-ext`, `hebrew`, and `vietnamese` subsets, but this site's content is 100% Spanish, so those subsets would never actually be used and were deliberately dropped to avoid ~5x the font payload for zero visual benefit. If the client ever needs to render non-Latin text, those subsets would need to be added back. Montserrat and Open Sans are variable fonts (Google serves one file per style/subset covering the whole weight range — hence several `@font-face` blocks in `css/fonts.css` intentionally point at the same `-var.woff2` file); Source Sans Pro is not, so it has one file per weight.
- **Favicon / apple-touch-icon**: these were already local (`images/favicon.png`, `images/webclip.png`) in the original export — nothing to download, just corrected the `rel`/`type` attributes (see §1).
- **Open Graph / Twitter card image**: the original export had `og:title`/`og:description`/`twitter:title`/`twitter:description` but **no `og:image` or `twitter:image` at all** on any page — there was nothing Webflow-hosted to localize here, only a gap to fill. Added `images/christopher-burns-8KfCR12oeUM-unsplash-1.jpg` (already a local asset used on `index.html`) as the site-wide default social preview image, referenced as an absolute URL (`https://arpesa.com.mx/images/...`) on the 5 real pages, per Open Graph's spec requiring absolute image URLs. This image is a landscape photo (5659×3773, ~1.5:1) rather than the ideal 1.91:1 OG ratio — acceptable for now since generating a custom-cropped asset was out of scope (no image-editing tooling was introduced, per "no build tools" constraint); social platforms will center-crop it automatically.
- **jQuery / `webflow.js`**: evaluated for localization, then removed entirely once confirmed unnecessary (see §1/§3) rather than self-hosted, since nothing in the rebuilt site calls into either.
- **Not localized (by design, per the brief):** nothing else needed it — there are no analytics/tracking/maps/video-embed scripts in this export to begin with.

---

## 6. Deployment requirements

- Upload the entire contents of `independent-static-site/` (not the repository root) into the host's `public_html/` (or equivalent) directory. No build step, no `npm install`, no server-side runtime required — it is plain HTML/CSS/JS/static assets.
- Apache with `mod_rewrite` and `mod_expires` enabled is assumed by `.htaccess` (both are wrapped in `<IfModule>` guards, so the site still works — just without those specific behaviors — if either module is unavailable).
- `.htaccess` currently:
  - Serves `404.html` as the custom error document.
  - Forces HTTPS.
  - Forces the non-`www` host (`arpesa.com.mx`, matching the canonical/OG URLs used throughout) — remove that block if the client prefers `www.arpesa.com.mx` instead.
  - Adds optional, additive support for extension-less URLs (`/nosotros` → `nosotros.html`) without changing any existing `.html` links or canonical tags.
  - Disables directory listing.
  - Sets basic cache lifetimes for images/CSS/JS/fonts.
- `robots.txt` and `sitemap.xml` assume the production domain is `https://arpesa.com.mx` (taken directly from the reference URL given for this task). Update both if the final domain differs.
- Canonical tags, `og:url`, and `sitemap.xml` all hardcode `https://arpesa.com.mx` — update if the domain changes before launch.

---

## 7. Known limitations

- **Live-site comparison was not directly possible.** This build environment's network policy blocks `arpesa.com.mx` and Webflow's asset/script CDNs (`*.cloudfront.net`). All fidelity work was verified against the exported source (which is the same code driving the live site) plus local rendering, not a live side-by-side screenshot diff against the production URL. If a true pixel diff against the live site is required, it needs to be run from an environment that can actually reach `arpesa.com.mx`.
- **A concrete consequence of the above was caught during testing and is worth flagging explicitly:** when the *original, unmodified* export is served in this same sandboxed environment, its hero fade-in text and other `data-ix` content **never appear at all**, because the original relies on jQuery loaded from Webflow's CDN (`d3e54v103j8qbb.cloudfront.net`), which this sandbox's network policy blocks — so `webflow.js` silently fails to run. This is not a defect in the original site (it works fine wherever that CDN isn't blocked), but it is a real illustration of the risk of depending on a third-party-controlled CDN for core page content to even become visible. The independent version in this folder no longer has that single point of failure, since fonts are self-hosted and the interactions no longer depend on any external script loading successfully.
- **The fade-in/fade-in-on-scroll timing is a reconstruction, not a port** — see §2. No original IX2/IX1 timing config exists in this export to copy exactly.
- **`ui-elements.html`'s 2 Webflow-CDN-hosted icons were not localized** — see §4.
- Browser support for `IntersectionObserver` (used for the scroll-fade effect) is universal in all current browsers; the one documented fallback (used if it's ever unavailable) is to simply show the content immediately with no animation, never to hide it permanently.

---

## 8. Pages and breakpoints tested

Rendered and visually reviewed with headless Chromium at three breakpoints — **desktop (1440×900), tablet (768×1024), mobile (375×812)** — matching the site's own CSS breakpoints (991/767/479px):

| Page | Desktop | Tablet | Mobile | Notes |
|---|---|---|---|---|
| `index.html` | ✅ | ✅ | ✅ | Mobile nav toggle tested interactively (opens/closes, `aria-expanded` toggles correctly); scroll-triggered fades verified via real `scrollTo` + wait (not just a screenshot, since full-page screenshot capture doesn't reliably trigger `IntersectionObserver` — confirmed this was a test-harness quirk, not a site bug, by checking element state directly). |
| `nosotros.html` | ✅ | ✅ | ✅ | Video lightbox anchor renders in place (inert, see §3/§4). |
| `servicios.html` | ✅ | ✅ | ✅ | Confirmed sign-up popup removal didn't affect layout of the rest of the page. |
| `contacto.html` | ✅ | ✅ | ✅ | |
| `aviso-de-privacidad.html` | ✅ | ✅ | ✅ | Long legal text renders unchanged. |
| `404.html` | ✅ | ✅ | ✅ | Dropdown-menu interaction tested interactively (click toggles `.w--open`), confirmed working; content itself flagged for manual rewrite (§4). |

Not screenshot-tested (orphaned/non-linked, no real content to visually check): `ui-elements.html`, `detail_blog.html`, `detail_portfolio.html`, `detail_team.html` — confirmed only that their head/script tags are consistent with every other page.

**Not tested in this pass** (would need a real browser, not headless Chromium, or real devices): actual touch-device gesture behavior, Safari/iOS-specific rendering quirks, print stylesheets (none exist), and screen-reader behavior beyond the `aria-expanded`/`aria-label` attributes added to the nav/dropdown toggles.
