# ARPE — Deployment Guide

This guide covers deploying `public_html_ready/` (or the equivalent `public_html_ready.zip`) to a traditional Apache/cPanel hosting account (Hostinger, GoDaddy, or similar). No build step, database, or server-side runtime is required — it is plain HTML/CSS/JS/static assets.

---

## 1. Back up current hosting before touching anything

1. Log in to the hosting control panel (cPanel, hPanel on Hostinger, or the GoDaddy dashboard).
2. Open **File Manager** and navigate to `public_html/`.
3. Select everything currently inside `public_html/` and download it as a `.zip` (most panels have a "Compress" → then download the archive option). Save this zip somewhere safe on your own computer, dated (e.g. `public_html-backup-2026-07-14.zip`).
4. If the account has a database (this site doesn't need one, but check in case something else is hosted on the same account), export it via phpMyAdmin as an extra precaution.
5. Do not delete anything on the server yet — just confirm the backup zip downloaded successfully and opens correctly before proceeding.

## 2. Where `index.html` must be located

- `index.html` must sit **directly inside** `public_html/` — i.e. `public_html/index.html`, not `public_html/some-folder/index.html`.
- The provided `public_html_ready/` folder (or `public_html_ready.zip`) is already structured this way: extracting/copying its *contents* (not the folder itself) into `public_html/` puts `index.html` at the correct level.
- Double-check after upload that visiting `https://yourdomain/` (with no path) loads the homepage — if it instead shows a directory listing or 404, `index.html` was likely uploaded one level too deep (inside a nested `public_html_ready` folder). Move the files up one level in File Manager if so.

## 3. How to upload the files

**Option A — File Manager (simplest for most users):**
1. Upload `public_html_ready.zip` into `public_html/` using File Manager's Upload button.
2. Right-click the uploaded zip and choose **Extract**, extracting into `public_html/` itself (not a subfolder).
3. Delete the uploaded zip file afterward (optional, keeps the directory tidy) — it is not needed by the live site.
4. Confirm `public_html/index.html`, `public_html/.htaccess`, `public_html/css/`, `public_html/js/`, `public_html/images/`, `public_html/fonts/` all exist at the top level.

**Option B — FTP/SFTP:**
1. Connect with an FTP client (FileZilla, Cyberduck, etc.) using the credentials from the hosting panel.
2. Navigate the remote side to `public_html/`.
3. Upload the **contents** of the extracted `public_html_ready/` folder (select all files/folders inside it, not the folder itself) directly into `public_html/`.
4. Make sure hidden files transfer too — `.htaccess` starts with a dot and some FTP clients hide dotfiles by default; enable "show hidden files" in the client settings before uploading, and verify `.htaccess` actually landed on the server afterward.

**Either way**, once uploaded, `public_html/` should contain exactly: `index.html`, `nosotros.html`, `servicios.html`, `contacto.html`, `aviso-de-privacidad.html`, `404.html`, `robots.txt`, `sitemap.xml`, `.htaccess`, `css/`, `js/`, `images/`, `fonts/` — nothing else.

## 4. Configuring the domain

- If the domain is already pointed at this hosting account (nameservers/DNS already set), no further DNS action is needed — uploading to `public_html/` is sufficient.
- If this is a new domain or the domain currently points elsewhere, update the domain's nameservers (or A record) to point at the new hosting account's IP, per the specific host's domain-connection instructions (Hostinger/GoDaddy both have a "Connect Domain" wizard in their panel). DNS changes can take up to 24-48 hours to fully propagate.
- The site's canonical URLs, sitemap, and Open Graph tags are all hardcoded to `https://arpesa.com.mx` (taken from the reference URL supplied for this project). If the final production domain is different, update:
  - `robots.txt` (the `Sitemap:` line)
  - `sitemap.xml` (all five `<loc>` entries)
  - The `rel="canonical"`, `og:url`, `og:image`, and `twitter:image` `<meta>` tags in `index.html`, `nosotros.html`, `servicios.html`, `contacto.html`, and `aviso-de-privacidad.html`
  - The non-www redirect host in `.htaccess` (`arpesa\.com\.mx` appears twice)

## 5. Verifying SSL

1. Most hosts (Hostinger, GoDaddy, cPanel with AutoSSL) issue a free Let's Encrypt certificate automatically shortly after the domain resolves to the account — check the panel's SSL/TLS section and confirm a certificate is "Active" for the domain (and `www.` subdomain, if used).
2. Once active, visit `http://yourdomain/` (plain HTTP) in a browser — the included `.htaccess` forces a redirect to `https://`. Confirm the browser address bar ends up on `https://` with a padlock icon and no certificate warning.
3. If the SSL certificate isn't active yet and you deploy `.htaccess` as-is, visitors will hit a redirect to an HTTPS endpoint that doesn't have a valid certificate yet — either wait for SSL to finish issuing before pointing the domain live, or temporarily comment out the "Force HTTPS" block in `.htaccess` (lines under `# Force HTTPS`) until the certificate is confirmed active, then re-enable it.

## 6. Clearing hosting cache

- Some hosts (Hostinger's LiteSpeed cache, GoDaddy's built-in caching, or any cPanel with LiteSpeed/Varnish) cache pages at the server level. After uploading or updating files, clear this cache so visitors don't see a stale version:
  - **Hostinger**: hPanel → Website → Cache Manager → Purge Cache (or the LiteSpeed Cache icon if present).
  - **cPanel/LiteSpeed**: look for a "LiteSpeed Web Cache Manager" icon and use its Purge/Flush option.
  - **GoDaddy Managed Hosting**: Settings → Cache → Clear Cache, if the plan includes server-side caching.
- Also do a hard-refresh in your own browser (Ctrl/Cmd+Shift+R) when testing, since the browser's own cache can also serve a stale copy independent of the server.

## 7. How to test the site after deployment

Run through this checklist on the live domain:

- [ ] `https://yourdomain/` loads the homepage with the hero section, images, and fonts rendering correctly (not fallback system fonts).
- [ ] Navigate to each page via the top nav: Nosotros, Servicios, Contacto — all load, and the nav highlights the current page correctly.
- [ ] Footer "Aviso de Privacidad" link works.
- [ ] On a phone or narrow browser window, tap the hamburger menu — it opens and closes, and links inside it work.
- [ ] Scroll the homepage — the small icon/text blocks under "Bienvenido a ARPE" and "Innovación y Excelencia" fade into view as they enter the viewport.
- [ ] Visit a nonexistent URL (e.g. `https://yourdomain/this-does-not-exist`) — confirm the custom 404 page appears (not the hosting provider's default error page).
- [ ] View page source on a couple of pages and confirm there are no requests to any `webflow.com`, `website-files.com`, or `cloudfront.net` URLs (browser DevTools → Network tab, filter by "webflow" or "cloudfront", should show zero results).
- [ ] Check DevTools → Console for JavaScript errors on each page (should be none).
- [ ] Confirm HTTPS padlock shows with no mixed-content warnings.
- [ ] Test on both a desktop-width window and a phone (or DevTools device emulation) to confirm responsive layout looks right at both ends.

## 8. How to roll back if necessary

1. In File Manager (or via FTP), delete the newly uploaded files from `public_html/` — or simply rename the `public_html/` folder to something like `public_html_new_broken/` and create a fresh empty `public_html/` (safer than deleting, since it preserves the new files for debugging).
2. Re-upload the backup zip made in Step 1 and extract it into `public_html/`, restoring the previous site exactly as it was.
3. Purge hosting cache again (Step 6) so visitors immediately see the restored version.
4. If only specific files misbehave rather than the whole site, you can selectively restore just those files from the backup zip instead of the entire rollback — File Manager lets you extract a single file from within a zip without restoring everything.

---

*For technical details on what changed during the migration/QA process (removed dependencies, replaced interactions, known limitations), see `MIGRATION_NOTES.md` and `FINAL_QA_REPORT.md` in this same directory.*
