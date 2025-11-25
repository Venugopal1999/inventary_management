# Tech Stack (Free-Tier-Friendly)

## Overview

This document outlines the complete technology stack for the Inventory Management System, optimized for free-tier deployment and cost-effective development.

---

## Stack Components

| Layer | Recommended Stack | Why / Free Option |
|-------|------------------|-------------------|
| **Frontend** | React + Tailwind CSS (Vite) | Matches requirement; open-source & zero cost. |
| **Backend** | Laravel 10 (PHP 8+) + Livewire v3 + Spatie Permissions | Exactly as specified; works locally or on free Render/Vercel backend. |
| **Database** | PostgreSQL (Render / Neon / Supabase Free Tier) | Cloud PostgreSQL with free hosting & SSL. |
| **Auth & RBAC** | Laravel Breeze / Jetstream + Spatie Permissions | Handles login, registration, roles, seeding. |
| **Multi-Tenancy** (optional) | Stancl Tenancy (free Composer package) | Provides tenant isolation; local use free. |
| **Hosting** (Full-stack) | Render.com (Free Web Service + Free Postgres) or Railway.app (Free runtime) | Free persistent hosting + DB. |
| **Version Control & CI/CD** | GitHub + GitHub Actions | Auto-deploy to Render/Railway; free public repos. |
| **Storage** (Images / Docs) | Cloudinary Free Plan or Supabase Storage | 10 GB+ free, API-ready. |
| **Email / Notifications** | Mailtrap / Resend (Free Tier) | For testing PO/SO email templates. |
| **Reporting & Exports** | Laravel-Excel + CSV/XLSX exports | Open-source. |
| **Scanning & Barcodes** | JsBarcode / QuaggaJS (Front-end) | Free libraries; no paid API. |

---

## Detailed Stack Breakdown

### Frontend Layer
- **Framework**: React with Vite build tool
- **Styling**: Tailwind CSS for rapid UI development
- **Benefits**: Fast development, modern tooling, zero licensing costs

### Backend Layer
- **Framework**: Laravel 10 (PHP 8+)
- **Real-time UI**: Livewire v3 for reactive components
- **Authorization**: Spatie Permissions for role-based access control
- **Benefits**: Mature ecosystem, excellent documentation, free to use

### Database Layer
- **Engine**: PostgreSQL
- **Hosting Options**:
  - Render.com (Free tier with persistent storage)
  - Neon (Serverless PostgreSQL, free tier)
  - Supabase (Free tier with 500MB storage)
- **Benefits**: Robust ACID compliance, SSL included, cloud-hosted

### Authentication & RBAC
- **Authentication**: Laravel Breeze or Jetstream
- **Permissions**: Spatie Laravel-Permission package
- **Features**: Login, registration, role management, permission seeding
- **Benefits**: Production-ready, well-maintained, free

### Multi-Tenancy (Optional)
- **Package**: Stancl Tenancy
- **Features**: Database isolation per tenant
- **Benefits**: Free Composer package, suitable for SaaS scenarios

### Hosting Options
- **Render.com**: Free web service + free PostgreSQL database
- **Railway.app**: Free runtime with usage limits
- **Benefits**: Zero initial cost, easy deployment, SSL included

### Version Control & CI/CD
- **Repository**: GitHub
- **CI/CD**: GitHub Actions
- **Benefits**: Free for public repos, automated deployments

### Storage
- **Cloudinary**: Free tier (10GB storage, 25GB bandwidth)
- **Supabase Storage**: Free tier included with database
- **Benefits**: CDN, API access, image transformations

### Email & Notifications
- **Development**: Mailtrap (email testing)
- **Production**: Resend (Free tier: 100 emails/day)
- **Benefits**: No cost for testing, minimal cost for production

### Reporting & Exports
- **Package**: Laravel-Excel (Maatwebsite)
- **Formats**: CSV, XLSX
- **Benefits**: Open-source, no licensing fees

### Barcode & Scanning
- **Barcode Generation**: JsBarcode (client-side)
- **Barcode Scanning**: QuaggaJS (camera-based scanning)
- **Benefits**: Free JavaScript libraries, no API costs

---

## Cost Summary

**Total Monthly Cost for Development & Small-Scale Production**: $0

All components leverage free tiers sufficient for:
- Development and testing
- Small to medium production deployments
- Up to 100k requests/month
- Up to 10GB storage
- Multiple team members

---

## Scaling Considerations

When you need to scale beyond free tiers:
- **Database**: Upgrade to paid PostgreSQL tier ($7-15/month)
- **Hosting**: Move to paid Render/Railway plans ($7-20/month)
- **Storage**: Upgrade Cloudinary or Supabase ($9-25/month)
- **Email**: Scale Resend or migrate to AWS SES (pay per email)

Total estimated cost at scale: $30-60/month for moderate production use.
