# Mutux - Enterprise Gaming Gear Rental Platform

**Mutux** is a high-performance P2P and B2C gaming gear rental marketplace and ecosystem designed for gamers, creators, and esports professionals. It enables renting top-tier hardware (GPUs, gaming laptops, VR headsets, mechanical keyboards, monitors, and consoles) with built-in trust, escrow protection, and verification workflows.

🌐 **Production Deployment (Live Demo):** [https://startup-k23-hcmus.vercel.app](https://startup-k23-hcmus.vercel.app)

---

## 1. Installation, Configuration & Running Guide

### Prerequisites
- **Node.js**: v20.x or higher (LTS recommended)
- **npm**: v10.x or higher
- **Docker & Docker Desktop**: Required for running the local PostgreSQL database
- **Git**: For version control

---

### Option 1: Automated One-Click Quickstart (Recommended)
The repository includes scripts to verify Docker status, spin up the database container, install dependencies, apply migrations, and launch both frontend and backend development servers concurrently.

- **On Windows (Command Prompt / PowerShell):**
  ```cmd
  start.bat
  ```

- **On Linux / macOS:**
  ```bash
  chmod +x start.sh
  ./start.sh
  ```

---

### Option 2: Step-by-Step Manual Setup

#### Step 1: Start the PostgreSQL Database
```bash
docker compose up -d postgres
```

#### Step 2: Configure and Start the Backend Service
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma client, run migrations, and seed mock data:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   ```
5. Start the NestJS development server:
   ```bash
   npm run start:dev
   ```
   *Backend API is accessible at:* `http://localhost:8080/api/v1`

#### Step 3: Configure and Start the Frontend Application
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *Frontend Web Application is accessible at:* `http://localhost:3000`

---

### Verification and Testing

- **Backend Test Suite (Unit, HTTP, Integration):**
  ```bash
  cd backend
  npm run test          # Run unit tests
  npm run test:http     # Run HTTP API/e2e tests
  npm run test:all      # Run complete verification (lint, unit, integration, build)
  ```

- **Frontend Verification & Linting:**
  ```bash
  cd frontend
  npm run typecheck     # Run TypeScript compiler checks
  npm run lint          # Run ESLint validation
  npm run build         # Validate production bundle compilation
  ```

- **Detailed Testing Scenario flows:**
  For manual testing walkthroughs and core feature flows, refer to `test-flow.md`.

---

## 2. Sample Data, Database Scripts & Demo Accounts

### Database Schema & Seed Scripts
- **Database Schema:** Defined in `backend/prisma/schema.prisma`.
- **Sample Data Seed:** The database seed script at `backend/prisma/seed.ts` populates initial system categories, mock users, and hardware listings. To apply seeds:
  ```bash
  cd backend
  npx prisma db seed
  ```

### Demo Test Accounts
*Default password for all test accounts is:* `password123`

| Role | Username / Email | KYC Status | Test Scope / Target |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@mutux.vn` | - | Equipment moderation, KYC approval, dispute resolution |
| **Lender** | `lender1@gmail.com` | Approved | Gear listing creation and management |
| **Renter** | `renter1@gmail.com` | Approved | Rental booking, wallet deposits, and payment |
| **Pending User** | `renter4@gmail.com` | Pending | Testing identity verification (KYC) request flows |

*For a full list of pre-seeded test accounts, refer to `account.md`.*

---

## 3. Technology Declarations & Reference Sources

### Core Tech Stack
- **Backend Framework:** NestJS 11 (Node.js framework)
- **Database & ORM:** Prisma 7 with PostgreSQL 15 database engine
- **Authentication & Security:** Passport.js with JWT Strategy (`@nestjs/jwt`, `@nestjs/passport`), `bcrypt` hashing
- **Data Validation & Transfer:** `class-validator`, `class-transformer`
- **Frontend Framework:** Next.js 14 (App Router)
- **Styling & UI Library:** Tailwind CSS v3, Radix UI Primitives, Lucide React
- **Client Page Progress Indicator:** Nextjs-toploader

### Integrated APIs & External Resources
- **Mock Payment Gateway:** A mock PayOS webhook integration to simulate external wallet deposits.
- **REST API Specs & Client:** The complete REST endpoint specification is compiled in `backend/docs/api.md`. Request payloads and tests are organized under the `backend/docs/bruno` collection.
- **UI Design System Template:** Based on the **Vanguard Elite** gaming aesthetic design sketches (located in `frontend/design/sketch/Vanguard elite`).

### Development Environment & AI Code Statement
- **AI Agent Framework:** Built using the Antigravity AI Agent framework. Rules, workspace tools, and skills are defined under the `.agents/` directory.