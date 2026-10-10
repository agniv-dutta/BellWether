Project: "BellWether" frontend - AI retail app for Google AI Builder Cup 2026.
Backend: FastAPI at VITE_API_URL (see endpoints below). Frontend only in /frontend.
Stack: React 18 + Vite + TypeScript, Tailwind CSS v4 (tokens in @theme), React Router,
TanStack Query, Framer Motion, Recharts, lucide-react. No UI kits (no shadcn, MUI,
Chakra) - every component is hand-built to match the design system.

DESIGN SYSTEM ("The Jeweller's Table"):
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

API CONTRACT (backend already built):
GET  /health
GET  /api/search?q=&category=&max_price=&limit=  -> {results: Product[& score]}
POST /api/search/visual (multipart: image, hint?) -> {attributes, results, explanations}
POST /api/chat {session_id, message} -> {reply, products_mentioned: Product[]}
POST /api/merchant/ask {question} -> {sql, columns, rows, insight, chart_type}
GET  /api/merchant/alerts -> {alerts: [{product, stock, velocity, recommendation}]}
Product = {id, name, category, description, price, color, image_url, stock}

Code rules: small components, typed API layer in src/lib/api.ts, one place for types,
loading/empty/error states on every data view, no console errors.
