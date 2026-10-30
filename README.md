# Drago Katić Development

Version 1.0.0 · https://dkd.rs

The website of Drago Katić Development: custom web applications, websites, online stores and WordPress work.
Plain HTML, CSS and JavaScript (no framework on the page, a small Bootstrap subset for the grid), with two small
PHP files: `contact.php` (the contact form) and `download.php` (a privacy-friendly download counter).

## What is here

- `index.html`, `websites.html`, `ecommerce.html`, `seo.html`, `case-studies.html`, `privacy.html`, `credits.html`, `404.html`: the pages
- `css/`, `js/`, `fonts/`, `images/`: the stylesheet bundle, scripts, self-hosted fonts and pictures
- `themes/`: fifteen demo websites of fictional businesses, each written from scratch with its own design
- `contact.php`, `download.php`, `stats/`: server side (PHP 8.1 or newer, SQLite for the download counter)
- `sw.js`, `site.webmanifest`, `app/`: offline support and the installable app shell
- `.htaccess`: Apache rules (headers, caching, Content-Security-Policy)

## Try it locally

```bash
php -S 127.0.0.1:8000
# http://127.0.0.1:8000/
```

`contact.php` sends mail with PHP's `mail()`; set `MAIL_TO` and `MAIL_FROM` at the top of the file for your own domain.
`download.php` creates its SQLite file on the first counted download; the folder it uses must be writable and closed to the web.

## Licence

The code (HTML, CSS, JavaScript and PHP, including the demo themes) is free software under the GNU General Public License,
version 2 or (at your option) any later version: see `LICENSE.txt`.
Texts, the logo, photographs, fonts and screenshots are not covered by it: see `NOTICE.md`.

## Credits

Every photographer, type designer and software author the site stands on is named, with the licence, on https://dkd.rs/credits.html
(and in `credits.html` here). Developed by Drago Katić Development together with Claude (Anthropic).
