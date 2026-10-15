Project: "BellWether" full-stack AI retail app for Google AI Builder Cup 2026.
Backend: FastAPI in /backend. Frontend: React in /frontend.
Stack: React 18 + Vite + TypeScript, Tailwind CSS v4 (tokens in @theme), React Router,
TanStack Query, Framer Motion, Recharts, lucide-react. No UI kits (no shadcn, MUI,
Chakra) - every component is hand-built to match the design system.

BRAND ("The Shopfront"):
- Product name: "BellWether". Defined once in src/lib/brand.ts (name, tagline,
  descriptor, copy strings). Never type the name inline in components.
- NEVER use: Jauhari, जौहरी, jeweller, jharokha, loupe, gem, "Jeweller's Table",
  or any jewellery/saree-specific language or imagery anywhere.
- Concept: "The Shopfront". Warm, editorial, general retail (apparel, footwear,
  home, beauty, kitchen, accessories, gifting). The arch is a shopfront
  window/doorway (rename any "loupe" interaction/class to "lens").
- Positioning: closed-loop retail intelligence. Shopper intent flows to merchant
  decisions. Headline promise: "Hear what shoppers want. Stock what they'll buy."
- Currency is INR. formatCurrency() from src/lib/brand.ts
  (Intl.NumberFormat("en-IN", {style:"currency", currency:"INR",
  maximumFractionDigits:0})) is the only way to render money. formatCompactINR()
  for lakh/crore KPIs.
- All product photos pass through .photo-warm (warm multiply overlay of apricot
  at ~12% plus saturate(0.92)) so off-palette colours in photos don't break
  the palette.
- AI backend is the Gemini API (not Vertex). UI status text says "Gemini", never
  "Vertex" or "Live API".

DESIGN SYSTEM:
- Palette tokens only (never raw hex in components):
  paper #FFF3EA, blush #FFDCCF, apricot #FFB690, persimmon #F4552F, coral #FF7A66,
  hibiscus #E8336F, flamingo #FF9DB5, vermilion #C3261F, oxblood #4B0F1B.
- FORBIDDEN: blue, green, teal, purple/violet/plum, gold/yellow, brown, pure black
  (#000) and pure white (#fff) anywhere, including shadows and gradients.
  Shadows use oxblood at low opacity. Text is oxblood, never black.
- Signature shape: ARCH (border-radius: 999px 999px 24px 24px) for images/hero
  elements. Other cards use rounded-3xl. No glassmorphism, no neon glows, no
  blue-purple gradients, no generic "sparkle AI" icons.
- Backgrounds: warm gradient meshes (radial gradients of apricot/coral/hibiscus on
  paper) plus a subtle SVG film-grain overlay at ~6% opacity.
- Typography: Fraunces (display, big, tight tracking, soft axis) / Bricolage
  Grotesque (UI) / JetBrains Mono (data, SQL). Headlines are large (clamp 3rem-8rem).
- Motion: Framer Motion, spring-based, purposeful (reveal on scroll, hover lifts).
  Respect prefers-reduced-motion.
- Copy tone: warm, human, slightly poetic. No "revolutionize / supercharge /
  AI-powered" buzzwords.
- Accessibility: semantic HTML, visible focus rings (hibiscus), alt text, AA contrast,
  keyboard-operable everything.
- Responsive: mobile-first; every screen must work at 375px.

API CONTRACT (backend in /backend):
GET  /health
GET  /api/search?q=&category=&max_price=&limit=  -> {results: Product[& score]}
POST /api/search/visual (multipart: image, hint?) -> {attributes, results, explanations}
POST /api/chat {session_id, message} -> {reply, products_mentioned: Product[]}
POST /api/merchant/ask {question} -> {sql, columns, rows, insight, chart_type}
GET  /api/merchant/alerts -> {alerts: [{product, stock, velocity, recommendation}]}
GET  /api/merchant/demand-gaps?days= -> {gaps: [{theme, query_count, example_queries, suggested_action}]}
GET  /api/products/trending -> {results: Product[]}
GET  /api/products/{id}/complete-the-look -> {results: Product[& reason]}
GET  /api/merchant/forecast?product_id= -> {series, days_of_cover, stockout_date, recommendation}
Product = {id, name, category, description, price, color, image_url, stock}
Categories: Apparel, Footwear, Home & Living, Beauty, Kitchen, Accessories.

Code rules: small components, typed API layer in src/lib/api.ts, one place for types,
loading/empty/error states on every data view, no console errors.
