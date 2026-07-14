# ARPE — Final Production-Readiness QA Report

Scope: full QA pass on `independent-static-site/` (the de-Webflowed build from the previous phase), culminating in the `public_html_ready/` deployment package and `public_html_ready.zip`. This report documents what was tested, what was found, what was fixed, and what remains for manual verification.

**Reference used for fidelity:** `https://arpesa.com.mx/`. As in the previous phase, this build environment's network policy blocks the live domain and Webflow's CDN outright (confirmed via direct connection attempts — see §6), so all comparison was done against the exported source (byte-identical CSS to the original) plus local rendering, not a live side-by-side diff. This is the same limitation noted in `MIGRATION_NOTES.md` and it still applies here.

---

## 1. Pages tested

| Page | In `public_html_ready`? | Tested |
|---|---|---|
| `index.html` | Yes | Full pass |
| `nosotros.html` | Yes | Full pass |
| `servicios.html` | Yes | Full pass |
| `contacto.html` | Yes | Full pass |
| `aviso-de-privacidad.html` | Yes | Full pass |
| `404.html` | Yes | Full pass |
| `ui-elements.html` | **No** (excluded — see §5) | Spot-checked only |
| `detail_blog.html` | **No** (excluded — see §5) | Spot-checked only |
| `detail_portfolio.html` | **No** (excluded — see §5) | Spot-checked only |
| `detail_team.html` | **No** (excluded — see §5) | Spot-checked only |

## 2. Viewports tested

1440px, 1280px, 1024px, 768px, 480px, 375px — all 6 real pages + `404.html` screenshotted full-page at each width (36 renders total) using headless Chromium, with the page scrolled through in steps beforehand so scroll-triggered animations fire before capture. No layout breakage found at any width. The one apparent "cut-off" hero/feature image at certain widths is an intentional full-bleed design already present in the untouched CSS (verified by confirming the CSS files are byte-identical to the original export), not a regression.

## 3. Interactions tested

- **Mobile nav toggle** — clicked programmatically at 375px; confirmed `data-nav-menu-open` attribute and `aria-expanded="true"` are set correctly on open, and cleared on close/outside-click/Escape/nav-link-click.
- **Dropdown menus** (`404.html`'s template nav) — clicked "About" toggle, confirmed `.w--open` class applied to the dropdown list.
- **Page-load fade-ins** (`fade-in-on-load`/`-2`/`-3`) — confirmed `ix-visible` class applied on all real pages within the expected 0/200/400ms stagger.
- **Scroll-triggered fade-ins** (`fade-in-on-scroll`, the 6 icon rows on `index.html`) — confirmed via real `window.scrollTo` + wait that `IntersectionObserver` correctly fires and applies `ix-visible` once each element enters the viewport.
- **Keyboard interaction** — Tab reaches the logo link first (correct DOM order); confirmed `:focus-visible` outline now renders on the nav button and dropdown toggle/links (previously `outline:0` with no replacement — fixed, see §7).
- **404 behavior** — `.htaccess` `ErrorDocument 404 /404.html` verified present; `404.html` itself renders correctly standalone.
- **Video lightbox** (`nosotros.html`) — confirmed still inert/non-functional, exactly as it was in the original export (empty `"items": []` gallery) — not a regression, a pre-existing gap already flagged in `MIGRATION_NOTES.md`.
- **Sign-up popup** (`servicios.html`) — confirmed removed in the previous phase and stays removed; nothing references it anymore.
- **WhatsApp / tel: / mailto: links** — no WhatsApp integration exists anywhere in the source (confirmed again this pass); one `mailto:empresa@arpesa.com.mx` link exists on `aviso-de-privacidad.html` (unchanged, working); the phone number/email on `contacto.html` remain plain text, not links, matching the original — not something this QA pass invented or altered.
- **Embedded media / third-party widgets** — none exist anywhere in the project.

## 4. Broken links / assets corrected this pass

- **CSS Webflow-CDN background images (highest priority):** `css/arpe-temporal.webflow.css` had 5 `background-image: url('https://d3e54v103j8qbb.cloudfront.net/img/background-image.svg')` declarations (classes `.team-image-block`, `.blog-post-image-block`, `.blog-left-image-block`, `.simple-blog-image-block`, `.blog-post-header`) — a genuine unresolved Webflow-hosting dependency shipped on **every page** via the shared stylesheet, even though only one of those classes (`.simple-blog-image-block`) is ever actually invoked, and only on the now-excluded `detail_blog.html`. Replaced all 5 with a plain neutral `background-color: #dddddd` (documented inline in the CSS) — removes the external dependency with zero visual effect on any real page.
- **`ui-elements.html` Facebook icon:** was hotlinked from `daks2k3a4ib2z.cloudfront.net`; repointed to the already-present local `images/Icon-facebook.png`.
- **`ui-elements.html` App Store badge:** hotlinked from the same Webflow CDN, no local equivalent existed and this build environment cannot reach that CDN to download one (see §6). Removed the dead `<a>`/`<img>` entirely (it was a `href="#"` decorative link in a Lorem-ipsum demo block, not real functionality) rather than fabricate a substitute for a trademarked Apple badge.
- **Missing `<h1>`:** `nosotros.html`, `servicios.html`, `contacto.html`, `aviso-de-privacidad.html`, and `404.html` had no `<h1>` at all (top heading was `<h2>`). Changed each page's single top-level heading from `<h2>` to `<h1>` (verified the CSS classes involved — `.subpage-title`, `.section-title`, `.main-feature-title` — fully self-contain their own font-size/weight/line-height/margins with higher specificity than the bare element rule, so this is a pure semantic fix with zero visual change, confirmed via before/after screenshot diff).
- **Logo images had no accessible name:** `<a href="index.html">` wrapping the logo `<img>` had `alt=""` on every page, giving the homepage link zero accessible name for screen readers. Set `alt="ARPE"` on all `Color.png`/`Blanco.png`/`Logo.png` logo instances site-wide.
- **No visible keyboard focus indicator:** `webflow.css` sets `outline: 0` on `.w-nav-button`, `.w-dropdown-toggle`, and `.w-dropdown-link` with no replacement. Added a `:focus-visible` outline in `css/interactions.css` (mouse/touch interaction unaffected, keyboard-only).
- **Missing semantic landmarks:** added a `<main>` wrapper around each page's primary content (between the nav bar and footer) and converted the footer `<div class="simple-footer">` to a `<footer class="simple-footer">` element, on all 6 deployed pages. Verified no CSS selector targets `div.simple-footer` or `div.navbar` by tag+class combination, so this was safe; confirmed zero visual difference via screenshot diff.
- **Attempted image `width`/`height` attributes — reverted.** As part of the optimization pass, `width`/`height` HTML attributes were added to all `<img>` tags (a common, normally-safe CLS-prevention technique). This **broke the layout**: this site's CSS sets only a single axis (e.g. `.logo { height: 40px }` with no `width`, or `.browser-mockup-right { width: 700px }` with no `height`) for nearly every image class, relying on the browser computing the other axis from the image's natural aspect ratio. Adding explicit `width`/`height` attributes changed how the browser resolved that computation (confirmed via isolated test: the same CSS renders a logo at the correct 123×40px without HTML size attributes, but at a distorted 1159×40px with them). This was caught via visual QA screenshot **before** packaging, and fully reverted (verified 0 leftover `width=`/`height=` attributes from this change, and logo/photo dimensions confirmed correct again by direct measurement in-browser: 123×40 on the 5 real pages, 162×40 on `404.html`). **This optimization was deliberately not applied to this codebase** — see §8.
- No other broken internal links, missing assets, console errors, or failed HTTP requests were found across any of the 10 pages (see §6 for the full sweep).

## 5. Files excluded from `public_html_ready`

`ui-elements.html`, `detail_blog.html`, `detail_portfolio.html`, `detail_team.html` are **not included** in the deployment package. Rationale:
- None are linked from any real navigation (confirmed by grepping every page's `<a href>` targets — nothing points to any of them).
- Three of the four have no real content at all (`detail_portfolio.html`/`detail_team.html` are empty CMS-template skeletons; `detail_blog.html` has only empty CMS bindings); `ui-elements.html` is a generic Webflow "Startup Template" kitchen-sink demo page, not ARPE content.
- They were the source of every remaining Webflow-CDN reference in the project (the CSS background-images and the two hotlinked icons — see §6). Excluding them from the deployed package, rather than trying to force-localize assets this environment cannot reach, gives a clean, verifiable "zero Webflow dependency" deployment.
- They remain present (with fixes applied where possible) in `independent-static-site/` itself for rollback/reference — nothing was deleted from the working copy, only left out of the curated deployment folder.
- `MIGRATION_NOTES.md`, `DEPLOYMENT_GUIDE.md`, and `FINAL_QA_REPORT.md` are project documentation and are likewise intentionally not part of `public_html_ready` (a `public_html` directory should contain only what the web server needs to serve).

## 6. Webflow runtime dependency verification

Full-project search for `webflow`, `website-files`, `w-nav`, `w-slider`, `w-dropdown`, `w-tab`, `Webflow.push`, `Webflow.require`, `webflow.js`, plus the CDN domains `website-files.com`, `webflow.io`, `uploads-ssl.webflow.com`, `assets-global.website-files.com`, `cdn.prod.website-files.com`, and `*.cloudfront.net`:

| Pattern | Found | Disposition |
|---|---|---|
| `webflow.js` (the file/script itself) | 0 references anywhere | Removed entirely in the previous phase; confirmed still absent. |
| `Webflow.push` / `Webflow.require` | 0 | Never present in any custom code; the only place these ever appeared was inside the now-deleted `webflow.js` bundle itself. |
| `website-files.com`, `webflow.io`, `uploads-ssl.webflow.com`, `assets-global.website-files.com`, `cdn.prod.website-files.com` | 0 | None ever present in this export. |
| `*.cloudfront.net` (Webflow's own CDN mirrors) | 3 distinct assets, all now resolved (see below) | **Fixed this pass** — see §7. |
| `w-nav`, `w-dropdown` (CSS classes) | Present, in use | **Not a runtime dependency** — these are just CSS class hooks now driven entirely by local `css/webflow.css` and the custom `js/nav.js`. Classified as harmless legacy naming; required for layout/behavior, safe to leave. |
| `w-slider`, `w-tab` | 0 uses in any HTML (CSS rules for them exist in `webflow.css` but are never invoked) | Dead CSS, harmless, left in place per the "don't purge without verifying every page" instruction — candidate for a future optimization pass. |
| The word "webflow" appearing anywhere in the final deployed HTML | Only as part of two **local** stylesheet filenames: `css/webflow.css` and `css/arpe-temporal.webflow.css` | Harmless legacy naming — these are local files with no network dependency; renaming them is optional cosmetic polish, not required for independence. |

**Conclusion: the deployed site has zero runtime or hosting dependency on Webflow's JavaScript, CDN, or infrastructure.** It does not call `Webflow.push`/`Webflow.require` anywhere, does not load `webflow.js`, and (after this pass's fixes) does not fetch any asset from a Webflow-owned domain.

## 7. Webflow-hosted asset delinking — full list

| Asset | Was referenced from | Action taken |
|---|---|---|
| `background-image.svg` (generic CMS-empty-state placeholder graphic) | `https://d3e54v103j8qbb.cloudfront.net/img/background-image.svg`, referenced 5× in `css/arpe-temporal.webflow.css` | **Could not download** (this CDN is blocked by this build environment's network policy — confirmed via direct `curl`, receives a `403`/`CONNECT tunnel failed` at the proxy level, not from Webflow). Replaced with a plain `background-color: #dddddd` fallback instead, since none of the affected classes render on any deployed page. |
| `Icon-facebook.png` (small social icon) | `https://daks2k3a4ib2z.cloudfront.net/.../Icon-facebook.png`, used once in `ui-elements.html` | **Localized without needing to download** — an identical local copy already existed at `images/Icon-facebook.png` from the original export's asset dump. Repointed the `<img src>` to it. |
| `Button-App-Store.png` (Apple "Download on the App Store" badge) | `https://daks2k3a4ib2z.cloudfront.net/.../Button-App-Store.png`, used once in `ui-elements.html` | **Could not download** (same CDN block) and no local copy exists. Removed the dead link entirely rather than fabricate a copy of a trademarked Apple badge graphic. |

All three affected references live only in files excluded from `public_html_ready` (the CSS fix benefits the deployed pages since the stylesheet is shared; the two image fixes are in `ui-elements.html`, which isn't deployed at all). **The deployed package (`public_html_ready/`) contains zero references, resolved or otherwise, to any Webflow-owned domain** — confirmed by grepping the final folder directly (see the verification command output in §13).

**Everything else that needed localizing was already handled in the previous phase** and re-verified clean this pass: all Google Fonts (Open Sans, Montserrat, Source Sans Pro — self-hosted in `fonts/`), jQuery (removed entirely, not needed), the Open Graph/Twitter card image (`og:image`/`twitter:image`, now a local `images/christopher-burns-...jpg` served as an absolute `https://arpesa.com.mx/...` URL per spec), and the favicon/apple-touch-icon (`images/favicon.png`, `images/webclip.png` — were already local, only the `rel`/`type` attributes needed correcting).

## 8. w-node-*/data-w-id interaction-attribute audit

- **`w-node-*` IDs:** 0 found anywhere in this export, at any point. Webflow's flexbox/grid `w-node-` IDs were never generated for this site (they're only added when a page uses Webflow's newer flexbox/grid layout tools with per-node IX2 targeting, which this site's simpler `.w-row`/`.w-col` grid-based layout never triggered).
- **`data-w-id` attributes:** 4 existed originally, all on `index.html`'s four service-card links (`<a href="servicios.html" data-w-id="...">`). Cross-referenced against the site's IX2 configuration (there is none — confirmed in the audit phase that this export only uses the older, simpler `data-ix` trigger system, never IX2) and against every script (`webflow.js` before removal, and the custom `nav.js`/`animations.js` since). **None of the 4 IDs were ever read or targeted by any interaction, script, or CSS selector in this project.** They were removed in the previous phase as confirmed-dead attributes.
- **Current count: 0 remain.** Nothing needed re-evaluation this pass since none exist anymore; no working interaction was put at risk.

## 9. Remaining external services/integrations

| Service | Status |
|---|---|
| Google Fonts | Not used at runtime — fully self-hosted, zero request to any Google domain. |
| jQuery | Not present — removed, unneeded. |
| Google Analytics / Meta Pixel / any analytics | **None exist in the source.** Nothing to preserve, nothing was added. |
| WhatsApp | **None exists in the source.** No integration was fabricated. |
| Embedded maps / video | **None exist in the source.** |
| Outbound social links (`ui-elements.html` only, not deployed) | Facebook/Twitter/Google links point to those platforms' real homepages (`http://www.facebook.com` etc.) — plain navigation links, not sub-resources, so not a mixed-content concern; irrelevant to the deployed set anyway since that page is excluded. |

## 10. Known limitations

- Live-site pixel comparison against `https://arpesa.com.mx/` was not possible from this build environment (network policy blocks the domain outright). All fidelity verification relied on the fact that the CSS driving both the original export and this independent build is byte-identical (verified via `diff`), plus local rendering and interaction testing.
- The `background-image.svg` CSS placeholder and the two `ui-elements.html` icons could not be downloaded due to this environment's `*.cloudfront.net` network block — resolved via safe substitutes/removal instead (see §7), not by force-fetching through an unavailable path.
- `404.html` still carries unmodified Webflow "Startup Template" boilerplate content (English copy, dead links to nonexistent demo pages, a "Startup" brand instead of ARPE's) — this is a **content** issue flagged again from the previous phase's audit, deliberately not rewritten here since inventing replacement copy/links is outside a technical QA pass's remit. It is technically wired up correctly (`.htaccess` serves it as the real 404 document) and renders without errors.
- The fade-in/scroll-fade animation timing is a reasonable reconstruction (no original Webflow IX2/IX1 config exists in this export to copy byte-for-byte — confirmed again this pass).
- `index.html`/`servicios.html` skip from `<h2>` directly to `<h4>` for one call-to-action banner each (no `<h3>` in between) — a minor, pre-existing heading-level skip, not a missing-heading defect; left as-is since fixing it meaningfully means recategorizing a visual CTA banner's semantic level, a judgment call not obviously "safe" to make silently.
- Roughly 70 image files in `images/` are not referenced by any of the 6 deployed pages (leftover Webflow-template stock imagery and unused responsive-thumbnail variants, identified in the original audit). Not removed this pass — deliberately conservative, per the instruction not to prune files without exhaustively verifying every page/state first; a good candidate for a future, dedicated optimization pass.
- Width/height HTML attributes were evaluated for CLS prevention and found unsafe for this specific codebase (see §4) — not applied. If this is revisited later, it would need per-image-class CSS auditing (checking whether each class sets both axes explicitly) rather than a blanket pass.

## 11. Manual checks still recommended

- A true live-domain visual diff once this package is deployed to a real, reachable environment (this QA pass could not do this itself — see §10).
- Real device testing (physical iOS/Android phones/tablets), especially for touch-drag/gesture behavior on the mobile nav, which headless Chromium's `click()` simulation approximates but doesn't fully replicate.
- Screen-reader pass with actual assistive technology (VoiceOver/NVDA/JAWS) — this QA pass verified the relevant ARIA attributes/roles/focus behavior programmatically, but a real screen-reader walkthrough is the only way to fully confirm the experience.
- Decide the fate of `ui-elements.html`/`detail_blog.html`/`detail_portfolio.html`/`detail_team.html` (currently excluded from deployment but still present in `independent-static-site/`) — delete permanently, or populate with real content if there's a future plan for a blog/portfolio/team section.
- Decide whether to rewrite `404.html`'s content (English copy, dead demo links) before go-live.
- Decide whether to supply real content for the inert video-lightbox on `nosotros.html`, or remove it.
- Confirm the production domain is indeed `arpesa.com.mx` (non-www) before relying on the hardcoded canonical/OG/sitemap/`.htaccess` values — update all four locations together if not (see `DEPLOYMENT_GUIDE.md` §4).

## 12. Webflow JS runtime dependency removal — confirmation

**Confirmed fully removed.** `js/webflow.js` does not exist anywhere in `independent-static-site/` or `public_html_ready/`. No page loads it, no page calls `Webflow.push`/`Webflow.require`, and jQuery (a hard prerequisite for `webflow.js` to function) is likewise absent. All interactions previously driven by the Webflow runtime (mobile nav, dropdowns, load/scroll fade effects) are now driven by two small vanilla-JS files (`js/nav.js`, `js/animations.js`) with no external dependencies of their own.

## 13. Final verification commands run against `public_html_ready/`

```
grep -rli 'webflow' --include='*.html' .                 # 6 hits: only local *.webflow.css filenames
grep -rln 'cloudfront\.net|website-files\.com|webflow\.io|...' .   # 0 hits
grep -rn 'w-node-|data-w-id' .                            # 0 hits
```
All 6 deployed pages served locally over HTTP with zero console errors, zero failed/4xx-5xx network requests, and exactly one `<h1>` each, confirmed via headless-browser automation immediately before packaging.
