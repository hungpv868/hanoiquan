# HanoiQuan

Site statique pour **HanoiQuan** — restaurant vietnamien à Paris, deux maisons : `14e` et `Seine`.

- 6 pages × 3 langues (FR par défaut, EN, VI).
- HTML / CSS / JavaScript (ES modules) — sans framework, sans bundler obligatoire.
- Thème dark (par défaut) + light, persisté en `localStorage`.
- Animation et interactions légères, respectant `prefers-reduced-motion`.
- SEO-ready : titres uniques, JSON-LD `Restaurant`, hreflang, sitemap.

---

## 1. Pages

| Route | Rôle |
|---|---|
| `/` | Portail brand · choix de maison |
| `/14e/` | HanoiQuan 14e — carte vietnamienne complète, filter menu |
| `/seine/` | HanoiQuan Seine — spécialiste du pho, timeline interactive |
| `/about/` | Histoire de la maison |
| `/contact/` | Adresses, horaires, FAQ, formulaire général |
| `/reservation/` | Réservation en ligne avec validation |
| `/404.html` | Erreur multilingue |

Versions linguistiques (à générer par build script ou copies manuelles) :
`/`, `/en/`, `/vi/`.

---

## 2. Lancer en local

Le site utilise des chemins absolus (`/assets/...`) et `fetch()` pour charger les
traductions JSON, donc il faut un vrai serveur HTTP (pas `file://`) :

```bash
# Python (le plus simple)
python3 -m http.server 8000

# Node (si vous l'avez)
npx http-server . -p 8000

# Bun
bunx serve . -p 8000
```

Puis ouvrir <http://localhost:8000>.

---

## 3. Structure du projet

```
hanoiquan/
├── index.html                     # Accueil FR
├── 14e/index.html                 # Branche 14e
├── seine/index.html               # Branche Seine
├── about/index.html
├── contact/index.html
├── reservation/index.html
├── 404.html
├── sitemap.xml                    # 6 pages × 3 hreflang
├── robots.txt
│
├── en/   vi/                      # Miroirs linguistiques (à générer)
│
├── assets/
│   ├── css/
│   │   ├── base.css               # Tokens, reset, header, footer, buttons, forms
│   │   ├── home.css               # Hero cinematic + branch cards
│   │   ├── branch-14e.css         # Mosaic featured + filterable menu
│   │   ├── seine.css              # Editorial cinematic + steam + timeline
│   │   └── pages.css              # /about/, /contact/, /reservation/
│   │
│   ├── js/
│   │   ├── main.js                # Entry, toutes les pages
│   │   ├── theme.js               # Light/dark toggle + persist
│   │   ├── i18n.js                # Runtime translation
│   │   └── reservation.js         # Form validation + reset (page /reservation/)
│   │
│   ├── i18n/
│   │   ├── fr.json                # Source — toutes les chaînes
│   │   ├── en.json
│   │   └── vi.json
│   │
│   ├── images/
│   │   └── favicon.svg
│   │
│   ├── data/                      # (à venir : menu, hours, locations)
│   └── fonts/                     # (à venir : Fraunces, Inter, self-hosted)
│
└── README.md
```

---

## 4. Modifier les traductions

Toutes les chaînes traduisibles vivent dans `assets/i18n/fr.json`, `en.json`,
`vi.json`. Un fichier = un objet imbriqué :

```json
{
  "meta":   { "home": { "title": "...", "description": "..." } },
  "common": { "nav":  { "branch14e": "HanoiQuan 14e", ... } },
  "pages":  { "home": { "hero": { "h1": "..." } } },
  "data":   { "menu14e": { "phoBoTai": { "name": "...", "desc": "..." } } }
}
```

### Ajouter une chaîne

1. Ajouter la clé dans `fr.json` (source).
2. Dupliquer dans `en.json` et `vi.json`.
3. Référencer dans le HTML :

```html
<!-- texte simple -->
<h2 data-i18n="pages.home.story.h2">D'une rue de Hanoi…</h2>

<!-- HTML inline (br, sup, lien…) -->
<p data-i18n-html="pages.home.hero.subHtml">…</p>

<!-- attribut (placeholder, alt, aria-label…) -->
<input data-i18n-attr="placeholder:pages.contact.form.namePh">
<button data-i18n-attr="aria-label:common.theme.toLight">…</button>
```

Le texte FR inline dans la page sert de fallback si JSON ne charge pas.

### Changer la langue par défaut

Le défaut est défini en deux endroits :
- `assets/js/i18n.js` → constante `DEFAULT_LOCALE = 'fr'`.
- `<html lang="fr">` dans chaque HTML.

### Vérifier l'intégrité d'un JSON

```bash
python3 -c "import json; json.load(open('assets/i18n/fr.json'))"
```

---

## 5. Remplacer les images

Tous les visuels sont actuellement des **placeholders CSS** (gradients
radiaux ou backgrounds stylisés). Pour passer à des photos réelles :

### Pour un emplacement « image »

Le markup est :

```html
<div class="home-story__media"
     role="img"
     data-i18n-attr="aria-label:pages.home.story.imageAlt"
     aria-label="…"></div>
```

Remplacer par un `<picture>` avec sources responsive :

```html
<picture>
  <source type="image/avif"
          srcset="/assets/images/home/story-400.avif 400w,
                  /assets/images/home/story-800.avif 800w,
                  /assets/images/home/story-1200.avif 1200w"
          sizes="(min-width: 768px) 50vw, 100vw">
  <source type="image/webp"
          srcset="/assets/images/home/story-400.webp 400w,
                  /assets/images/home/story-800.webp 800w,
                  /assets/images/home/story-1200.webp 1200w"
          sizes="(min-width: 768px) 50vw, 100vw">
  <img src="/assets/images/home/story-800.jpg"
       width="800" height="1000"
       alt="…"
       loading="lazy" decoding="async"
       data-i18n-attr="alt:pages.home.story.imageAlt">
</picture>
```

Et retirer `role="img"` + `aria-label` du parent (l'`<img>` les remplace).

### Hero LCP image

Pour l'image hero (above-fold) :

```html
<img src="/assets/images/home/hero-1200.jpg"
     width="1200" height="800"
     alt="…"
     fetchpriority="high"
     decoding="async">
```

Et dans `<head>` :

```html
<link rel="preload" as="image"
      href="/assets/images/home/hero-1200.avif"
      type="image/avif">
```

### Outils d'optimisation

```bash
# AVIF + WebP + JPG en 4 tailles, à partir d'un dossier source
npx @squoosh/cli --avif '{"cqLevel":33}' --webp '{"quality":75}' \
  --resize '{"enabled":true,"width":1200}' \
  -d assets/images/home/ photos-source/*.jpg
```

Ou outil graphique : <https://squoosh.app>.

---

## 6. Déployer (static hosting)

Le site est 100 % statique. Aucun build obligatoire.

### Netlify (recommandé)

1. Pousser le repo sur GitHub.
2. New site from Git → choisir le repo.
3. **Build command** : laisser vide.
4. **Publish directory** : `.`
5. Custom domain → `hanoiquan.fr`, certificat HTTPS auto.

`netlify.toml` minimal (à ajouter à la racine) :

```toml
[build]
  publish = "."

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "no-cache"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/14e"
  to   = "/14e/"
  status = 301
[[redirects]]
  from = "/seine"
  to   = "/seine/"
  status = 301

# 404 handler
[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

### Vercel

Pareil, sans build. Ajouter `vercel.json` :

```json
{
  "trailingSlash": true,
  "headers": [
    { "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
```

### Cloudflare Pages

Pareil, framework preset = `None`, build command vide, output = `.`.

### GitHub Pages

OK aussi, mais limitations : pas de redirect avancé, certificat sur custom domain
plus lent à propager.

---

## 7. Checklist production

### Avant de pousser en prod

#### Contenu
- [ ] Remplacer tous les `[PLACEHOLDER]` (adresses, téléphones, emails, horaires, prénoms, années) dans les HTML **et** dans les 3 JSON.
- [ ] Vérifier les prix EUR sur chaque carte de plat.
- [ ] Faire relire le FR par un natif.
- [ ] Faire relire EN + VI (ou marquer en draft visible).
- [ ] Photos réelles à la place des placeholders CSS.

#### SEO
- [ ] Titres uniques (50–60 car.) ✅ vérifié 6/6 pages
- [ ] Meta description (140–160 car.) ✅ vérifié 6/6 pages
- [ ] Canonical URL ✅ 6/6
- [ ] hreflang `fr` / `en` / `vi` / `x-default` ✅ 6/6
- [ ] Open Graph + Twitter card ✅ 6/6
- [ ] JSON-LD ✅ home / 14e / seine / about / contact / reservation
- [ ] `sitemap.xml` ✅ — soumettre à Google Search Console + Bing
- [ ] `robots.txt` ✅
- [ ] Tester chaque page sur :
  - <https://search.google.com/test/rich-results>
  - <https://validator.schema.org>
  - <https://developers.facebook.com/tools/debug/>

#### Accessibilité (WCAG 2.1 AA)
- [ ] Skip link visible au focus ✅
- [ ] Un seul `<h1>` par page ✅ vérifié
- [ ] `aria-label` sur tous boutons icon-only ✅ (theme, nav, lang switcher)
- [ ] Form labels associés via `for=""` ✅
- [ ] Erreurs form avec `aria-invalid` + live region ✅
- [ ] Focus ring `:focus-visible` ✅
- [ ] Contraste vérifié dark + light (cible 4.5:1)
- [ ] `prefers-reduced-motion` respecté ✅ 5 RM blocks
- [ ] Tester clavier (Tab/Shift-Tab/Enter/Esc/Arrow)
- [ ] Tester avec NVDA (Win) ou VoiceOver (Mac/iOS)
- [ ] Audit avec [axe DevTools](https://www.deque.com/axe/devtools/)

#### Performance (Core Web Vitals)
- [ ] LCP < 2.5s mobile (cible)
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] Lighthouse mobile ≥ 90 sur Performance
- [ ] Pas de console.error en production
- [ ] Images optimisées (AVIF + WebP fallback) avec `width`/`height`
- [ ] Hero image en `preload` + `fetchpriority="high"`
- [ ] Below-fold images en `loading="lazy"`
- [ ] Polices self-hostées avec `font-display: swap`
- [ ] HTTPS forcé

#### Légal RGPD (marché Pháp)
- [ ] Bannière cookies si analytics est ajouté
- [ ] `/mentions-legales/` créé
- [ ] `/politique-confidentialite/` créé
- [ ] Form RGPD checkbox + lien ✅ (déjà dans /reservation/)
- [ ] Pas de Google Fonts CDN (self-host)
- [ ] Pas de Google Maps embed sans consent (utilise les map placeholders CSS pour l'instant)

---

## 8. Intégrer un vrai backend de formulaire

### Reservation form (`/reservation/`)

Le form pointe sur `https://formspree.io/f/[FORM_ID]`. Étapes :

1. Créer un compte sur <https://formspree.io>.
2. Créer un nouveau form, récupérer `FORM_ID`.
3. Dans `reservation/index.html` ligne `<form action="...">`, remplacer
   `[FORM_ID]` par le vrai ID.
4. Dans `assets/js/reservation.js`, fonction `init` → form submit, décommenter
   le `// TODO: POST to Formspree` et remplacer par :

```js
const data = new FormData(form);
const res = await fetch(form.action, {
  method: 'POST',
  body: data,
  headers: { 'Accept': 'application/json' }
});
if (res.ok) showSuccess(form);
else        /* show error toast */;
```

5. Quota free : 50 submissions/mois. Au-delà, payer ou changer de provider.

### Alternatives

- **Netlify Forms** — gratuit, intégré, juste ajouter `data-netlify="true"` au
  `<form>`. Limite : 100 submissions/mois.
- **EmailJS** — JS pur, plus de config mais pas de hosting requis.
- **Formspark, Web3Forms, Basin** — équivalents.

### Email réception

Configurer dans le dashboard Formspree :
- Destinataire : `reservations@hanoiquan.fr`.
- Auto-response : email de confirmation au client.
- Notification mobile via Slack/Discord webhook si voulu.

---

## 9. Notes techniques

### Dépendances JS
**Aucune.** Tout est en ES modules natifs, IO, fetch, Web APIs.

### Browser support
Chrome / Safari / Firefox / Edge — 2 dernières versions. Pas d'IE.

### Build
Optionnel. Si plus tard vous voulez :
- minification JS/CSS,
- génération automatique des miroirs `/en/` et `/vi/` à partir des JSON,
- subsetting et auto-hash des polices,
- traitement images en pipeline,

ajoutez Vite ou esbuild — le projet n'est pas verrouillé sur un build tool.

### Status v1
- ✅ 6 pages × FR (avec data-i18n pour swap dynamic EN/VI)
- ✅ Theme dark/light persisté
- ✅ Reservation form avec validation client
- ✅ JSON-LD `Restaurant` + `Menu` + `ReserveAction`
- ⏳ Photos réelles
- ⏳ Polices self-hostées (Fraunces + Inter)
- ⏳ Miroirs `/en/`, `/vi/` générés (build script)
- ⏳ Backend formulaire connecté
- ⏳ Mentions légales + politique de confidentialité
- ⏳ Bannière cookies + analytics

---

## 10. Licence

(à définir avec l'owner — © HanoiQuan)
