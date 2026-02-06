# Replit MD

## Overview

This is a bilingual (Arabic/English) online bookstore web application for a publishing house called "Dar Ali BenZid for Printing & Publishing" (دار علي بن زيد للطباعة والنشر). The app allows users to browse and view books, while admins can manage the book catalog through a dashboard. It supports RTL (Arabic) and LTR (English) layouts with a language toggle.

The current UI branding references "Al-Warraq Bookstore" / "مكتبة الوراق" — this may need to be updated to match the intended publishing house name from the project requirements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Structure

The project follows a monorepo pattern with three top-level directories:

- **`client/`** — React frontend (SPA)
- **`server/`** — Express.js backend API
- **`shared/`** — Shared types, schemas, and API route contracts used by both client and server

### Frontend (`client/src/`)

- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: React Context API for language/i18n; TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming; shadcn/ui component library (New York style)
- **Forms**: react-hook-form with Zod validation via @hookform/resolvers
- **Fonts**: Cairo (sans-serif, body text) and Amiri (serif, headings) — loaded from Google Fonts
- **Internationalization**: Custom `useLanguage` hook with a simple `t(arabicText, englishText)` helper function. Language direction (RTL/LTR) is applied to the document root element dynamically.

**Key Pages**:
- `/` — Home page with hero section and featured books
- `/store` — Book catalog with search and category filtering
- `/books/:id` — Individual book detail page
- `/login` — Authentication page
- `/signup` — Registration page
- `/account` — Customer dashboard (profile editing, order history, loyalty points)
- `/checkout` — Checkout page (requires login)
- `/admin` — Admin dashboard for CRUD operations on books (admin/employee roles)

**Path Aliases**:
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### Backend (`server/`)

- **Framework**: Express.js (v5) running on Node.js with TypeScript (executed via `tsx`)
- **Authentication**: Passport.js with Local Strategy, session-based auth using express-session. Passwords hashed with Node's built-in `scrypt`. Sessions stored via connect-pg-simple (PostgreSQL session store).
- **API Pattern**: RESTful JSON API under `/api/` prefix. Route contracts are defined in `shared/routes.ts` using Zod schemas, providing a typed contract between frontend and backend.
- **Development**: Vite dev server is used as middleware for HMR during development
- **Production**: Client is built to `dist/public/`, server is bundled with esbuild to `dist/index.cjs`

**Key API Endpoints**:
- `POST /api/login` — Authenticate user
- `POST /api/logout` — End session
- `GET /api/user` — Get current authenticated user
- `POST /api/register` — Create new user account
- CRUD endpoints for books (list, get, create, update, delete)
- `GET /api/shipping/wilayas` — List all wilayas with shipping prices
- `PUT /api/admin/shipping/wilayas/:id` — Update wilaya shipping price or active status
- `PUT /api/admin/shipping/wilayas` — Bulk update all wilayas with default price
- CRUD endpoints for orders, categories, customers (admin)

### Database

- **Database**: PostgreSQL (required — `DATABASE_URL` environment variable must be set)
- **ORM**: Drizzle ORM with `drizzle-zod` for automatic Zod schema generation from table definitions
- **Schema Location**: `shared/schema.ts` — contains all table definitions and derived types
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)

**Tables**:
- `users` — id, email (unique, acts as username), password (hashed), role ('admin'|'user'), name, phone, address, city, enabled, createdAt
- `books` — id, titleAr, titleEn, author, descriptionAr, descriptionEn, price (DZD currency), category, image (URL), language ('ar'|'en'|'both'), published (boolean), isbn, stock, createdAt
- `wilayas` — id, code (unique), nameAr, nameEn, shippingPrice (DZD), isActive
- `orders` — id, userId, customerName, phone, address, city, wilayaCode, wilayaName, baladiya, shippingPrice, status, total, notes, createdAt
- `order_items` — id, orderId, bookId, quantity, unitPrice
- `activity_logs` — id, adminId, adminEmail, action, entityType, entityId, details, createdAt

### Shared Contract Layer (`shared/`)

- `shared/schema.ts` — Drizzle table definitions, insert schemas (Zod), and TypeScript types
- `shared/routes.ts` — API route contract object defining method, path, input/output Zod schemas for each endpoint. Both client and server import from this to ensure type safety.

### Build & Scripts

- `npm run dev` — Start development server with Vite HMR
- `npm run build` — Build client (Vite) and server (esbuild) for production
- `npm run start` — Run production build
- `npm run db:push` — Push Drizzle schema to PostgreSQL
- `npm run check` — TypeScript type checking

## External Dependencies

### Required Services
- **PostgreSQL Database** — Required. Must set `DATABASE_URL` environment variable. Used for both application data and session storage (connect-pg-simple).

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — Database ORM and migration tooling
- **express** (v5) — HTTP server framework
- **passport** + **passport-local** — Authentication
- **express-session** + **connect-pg-simple** — Session management backed by PostgreSQL
- **@tanstack/react-query** — Server state management on the client
- **zod** + **drizzle-zod** — Schema validation shared between client and server
- **shadcn/ui components** — Extensive set of Radix UI-based components (accordion, dialog, dropdown, form, select, sheet, table, tabs, toast, tooltip, etc.)
- **wouter** — Client-side routing
- **react-hook-form** — Form state management
- **embla-carousel-react** — Carousel component
- **recharts** — Chart library (available via chart.tsx component)
- **lucide-react** — Icon library
- **framer-motion** — Animations (listed in requirements but may need installation)

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay in development
- `@replit/vite-plugin-cartographer` — Development tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Development banner (dev only)