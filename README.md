# MeetPoint Restaurant Management System

MeetPoint is a restaurant ordering and operations demo app built with Next.js and SQLite. It covers customer ordering, live status tracking, kitchen/staff workflow, and manager/admin controls in a single app.

## Features

- Customer menu browsing and ordering
- Table-based checkout with order tracking token
- Live order tracking page for customers
- Staff dashboard for order progression
- Manager dashboard for order visibility and cancellation
- Admin dashboard for staff/manager account management
- SQLite-backed persistence with built-in demo seed data

## Tech stack

- Next.js 16
- React 19
- Node.js built-in SQLite
- JWT-based session auth
- Tailwind CSS

## Requirements

- Node.js 22.13 or newer
- npm or pnpm

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Initialize the database and seed demo data:

   ```bash
   npm run seed
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open the app in your browser:

   ```text
   http://localhost:3000
   ```

## Demo accounts

These accounts are created automatically by the seed step and do not require environment variables:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@rms.local | Admin123! |
| Manager | manager@rms.local | Manager123! |
| Staff | staff@rms.local | Staff123! |

## Available scripts

```bash
npm run dev      # start the development server
npm run build    # production build
npm run start    # run production build
npm run lint     # run ESLint checks
npm run seed     # initialize the database and seed demo data
npm run db:reset # delete the database and regenerate demo data
```

## Demo data included

The seed process creates:

- starter menu items
- 3 user roles (admin, manager, staff)
- 5 demo orders in different statuses:
  - CONFIRMED
  - PREPARING
  - READY
  - SERVED
  - CANCELLED

This makes the staff dashboard, manager dashboard, and customer tracking flow immediately usable for demos.

## App flow

- Customers browse the menu at `/menu`
- Customers place an order at `/checkout`
- Customer tracking is available at `/track/[id]` using the tracking token
- Staff sign in at `/login` and operate from `/staff`
- Managers sign in at `/login` and operate from `/manager`
- Admins sign in at `/login` and operate from `/admin`

## Notes

- The app stores data in `data/rms.db`.
- The database is initialized automatically when the app first runs or when you execute `npm run seed`.
- Seed values are embedded in code for demo behavior and are designed for local development and demos rather than production credentials.
