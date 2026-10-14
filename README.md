# Resource Reservation Management System

A full-stack, containerized web application built with Next.js 16, Prisma ORM, and Neon PostgreSQL. Designed for reliable cross-platform development (Windows, Linux/Ubuntu, and macOS) and seamless production deployment via Docker.

---

## Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Database:** [Neon PostgreSQL](https://neon.tech/) (routed via `@neondatabase/serverless` HTTP driver adapter)
* **ORM:** [Prisma](https://www.prisma.io/)
* **Authentication:** NextAuth / Google OAuth
* **Containerization:** Docker & Docker Compose (Debian Bookworm base with OpenSSL 3.0.x runtime)

---

## Prerequisites

Ensure you have the following installed on your machine:

* [Git](https://git-scm.com/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Docker Compose V2 on Linux)
* [Node.js 22 LTS](https://nodejs.org/) *(optional if using Docker strictly)*

---

## Environment Configuration

Create a `.env` file in the root directory of your project:

```env
# Database Connection Strings (Neon)
DATABASE_URL="postgresql://user:password@ep-example-endpoint.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-example-endpoint.aws.neon.tech/neondb?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## Setup & Execution

### Option 1: Running with Docker (Recommended)

Containerization ensures full environment parity across Windows, Linux, and macOS while isolating native OpenSSL and Node runtime dependencies.

1. **Build and start the application:**
   ```bash
   npm run docker:up
   ```
2. **Stream live application logs:**
   ```bash
   npm run docker:logs
   ```
3. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

4. **Stop the container:**
   ```bash
   npm run docker:down
   ```

---

### Option 2: Running Locally with Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Sync database schema:**
   ```bash
   npx prisma db push
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## Available npm Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Starts the local development server with Turbopack |
| `npm run build` | `next build` | Compiles the production build |
| `npm run start` | `next start` | Runs the compiled production build locally |
| `npm run docker:up` | `docker compose up --build -d` | Builds and starts the Docker container in the background |
| `npm run docker:logs` | `docker compose logs -f web` | Streams live logs from the running Docker container |
| `npm run docker:down` | `docker compose down` | Stops and removes active Docker containers |
| `npm run docker:restart` | `docker compose restart web` | Restarts the application container service |

---

## Database & Prisma Workflow

The application utilizes the **Neon HTTP Driver Adapter** to send queries over standard HTTPS (Port 443), preventing socket drops on restricted networks.

* **Apply schema changes to database:**
  ```bash
  npx prisma db push
  ```
* **Open Prisma Studio (Visual DB Editor):**
  ```bash
  npx prisma studio
  ```
* **Re-generate client after schema edits:**
  ```bash
  npx prisma generate
  ```

---

## Network & Clock Synchronization Troubleshooting

### 1. Mobile Hotspot / Cellular Network Timeouts (Ubuntu/Linux)
If database queries time out over mobile hotspots or USB tethering:
* **DNS Resolution:** Use comma-separated primary/secondary DNS servers (e.g., `1.1.1.1,8.8.8.8`).
* **IPv6 Protocol Fallback:** Disable IPv6 under your OS network connection settings if your cellular carrier has broken IPv6 routes.
* **MTU Size Adjustment:** Lower interface MTU to `1350` (`nmcli connection modify <SSID> 802-11-wireless.mtu 1350`).
* **Router NAT Settings:** Set NAT type to *Cone* instead of *Symmetric* in your router control panel to allow persistent TCP sockets.

### 2. Google OAuth `Token used too early` Error
If Google OAuth fails during local execution due to a timestamp mismatch:
* This is caused by WSL2/Docker clock drift after host system sleep.
* **Fix on Windows PowerShell:**
  ```powershell
  w32tm /resync
  wsl --shutdown
  npm run docker:up
  ```