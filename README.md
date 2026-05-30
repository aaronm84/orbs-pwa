# Orbs

A relaxing chain reaction puzzle game, packaged as an installable **Progressive Web App (PWA)**.

This started life as a Quasar + Capacitor mobile game intended for the App Store.
It has been converted to a PWA so it can be installed straight to a phone's home
screen from the browser — no app store required. It runs offline, launches
full-screen (standalone), and uses the device's Vibration API for haptics and
`localStorage` for saving progress/settings.

## Install the dependencies

```bash
npm install
```

## Develop (PWA mode, with service worker + manifest)

```bash
npm run dev          # quasar dev -m pwa
```

To run as a plain SPA without the service worker (handy for fast iteration):

```bash
npm run dev:spa      # quasar dev
```

## Build for production

```bash
npm run build        # quasar build -m pwa  -> outputs to dist/pwa
```

## Preview the production build locally

The PWA must be served over HTTP (opening `index.html` via `file://` won't work,
and service workers require HTTPS or `localhost`):

```bash
npm run serve        # serves dist/pwa at http://localhost:9000
```

## Installing on your phone

The app must be served over **HTTPS** (or `localhost`) for the service worker and
"Add to Home Screen" to work. Deploy `dist/pwa` to any static host — e.g.
Netlify, Vercel, Cloudflare Pages, or GitHub Pages — then:

- **iOS (Safari):** open the site, tap the **Share** button, then **Add to Home
  Screen**.
- **Android (Chrome):** open the site, then use the **Install app** prompt or the
  ⋮ menu → **Install app / Add to Home screen**.

Once installed it launches in standalone full-screen mode with the Orbs icon.

### Deploying to GitHub Pages

Because the app uses the Vue Router **hash** mode, it works on GitHub Pages
without server-side routing config. If you serve it from a project subpath
(e.g. `https://user.github.io/orbs-pwa/`), set the public path in
`quasar.config.js` before building:

```js
build: {
  publicPath: '/orbs-pwa/',
}
```

## PWA implementation notes

- **Mode/scaffolding:** `src-pwa/` holds the service-worker registration and the
  web app manifest. PWA options live in the `pwa` block of `quasar.config.js`.
- **Manifest:** `src-pwa/manifest.json` — standalone display, portrait
  orientation, dark theme (`#1a1a2e`), with standard + maskable icons.
- **Icons:** generated from `public/app-icon.svg` into `public/icons/`
  (192/256/384/512 + maskable + Apple touch icons).
- **Caching:** the app shell and small bell sound effects are precached for
  offline use. The large background-music tracks (~24 MB total) are cached at
  runtime on first play (`CacheFirst`) to keep the install small and fast.
- **Native plugins:** the Capacitor plugins used by the game
  (`@capacitor/preferences`, `@capacitor/haptics`, `@capacitor/status-bar`,
  `@capacitor/app`) all ship web implementations, so they degrade gracefully in
  the browser — storage falls back to `localStorage`, haptics to the Vibration
  API, and the status-bar/app-state calls are guarded to native-only.

## Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js)
and [Quasar PWA mode](https://v2.quasar.dev/quasar-cli-vite/developing-pwa/introduction).
