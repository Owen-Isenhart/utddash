# UTDDash

## Overview
* **UTDDash** is a peer-to-peer marketplace exclusively for the University of Texas at Dallas. It connects students with extra meal swipes to students who want food at a discount.
* Students with unused swipes (that would otherwise go to waste) can accept delivery requests and earn cash.
* Students without meal plans can request food from on-campus dining locations at a discounted price.
* Think DoorDash but powered by meal swipes and limited to the UTD community.
* To prevent fraud and false delivery confirmations, UTDDash uses a **QR code handshake system** to validate in-person delivery.

---

## MVP

* **Auth:**
    * Users must register with a valid `@utdallas.edu` email
    * Email/password authentication with JWT
    * Role selection during onboarding:
        * Swipe Provider (has extra meal swipes)
        * Buyer (wants discounted food)
        * Or both
    * Basic profile creation (name, Venmo/CashApp/Zelle handle, optional bio)

* **Listings / Orders:**
    * Buyers can:
        * Create a food request (location, items, max price, delivery instructions)
        * Set desired delivery time window
    * Providers can:
        * View nearby/open requests
        * Accept a request (locks it from other providers)
    * Order lifecycle:
        * Requested → Accepted → In Progress → Delivered → Completed
    * In-app order tracking status updates

* **QR Code Delivery Handshake (Core Feature):**
    * When a provider marks an order as “Arrived,” the system generates a **one-time QR code**
    * The buyer scans the provider’s QR code in-app
    * Scanning validates:
        * Both users are authenticated
        * The correct order is being completed
        * The QR token has not expired
    * Once verified:
        * Order status moves to **Completed**
        * Both users can leave ratings
    * Prevents:
        * False delivery confirmations
        * “Food taken but not paid” disputes
        * Remote completion fraud

* **Payments (Off-Platform for MVP):**
    * Payment handled peer-to-peer (Venmo, CashApp, Zelle)
    * App records agreed price but does not process payments directly (initially)
    * QR handshake required before order can be marked complete

* **Real Time Features:**
    * Live order status updates via WebSockets
    * Real-time notifications when:
        * A request is accepted
        * Provider is en route
        * Provider has arrived
    * 1-to-1 chat per order
    * Real-time QR validation feedback (success/failure states)

* **Profiles:**
    * View active and past orders
    * Track:
        * Total earnings (providers)
        * Total savings (buyers)
    * Rating system (1–5 stars)
    * Basic review system (text feedback)

---

## Stretch Goals

* **In-App Payments with Escrow:**
    * Integrate Stripe Connect
    * Buyer pays in-app
    * Funds held until QR handshake confirms delivery

* **Reputation System Enhancements:**
    * Weighted ratings
    * Verified badge for reliable users
    * Cancellation penalties

* **Dynamic Pricing Suggestions:**
    * Recommend fair price based on:
        * Dining hall location
        * Demand
        * Time of day

* **Dining Hall Integration:**
    * Pull menu data from UTD Dining
    * Allow buyers to select items directly from live menus

* **Map View:**
    * Show open requests on a campus map
    * Demand heatmap

* **Fraud Detection:**
    * Rate-limiting order creation
    * Flag suspicious behavior
    * Admin moderation dashboard
    * QR replay attack prevention

* **Containerization:**
    * Dockerize services for scalable deployment

---

## Tech Stack

* **API:** Node.js + Express
* **DB:** PostgreSQL
* **ORM:** Prisma or Drizzle
* **WebSockets:** Socket.io
* **Auth:** JWT
* **QR Code Generation:** `qrcode` (Node library)
* **QR Code Scanning:** `react-qr-reader` (Frontend)
* **Payments (Future):** Stripe Connect
* **Storage:** AWS S3 (profile pictures)
* **Deployment:** AWS (EC2 + RDS)
* **Documentation:** Swagger / OpenAPI
* **Testing:**
    * Jest (unit tests)
    * Supertest (API testing)
    * Postman (manual testing)
* **Frontend:** Next.js + Tailwind CSS
* **State Management:** React Query or Zustand

---

## Timeline  
*(Subject to change)*

* **Week 1:**
    * PostgreSQL schema design
    * Express server setup
    * Authentication implementation

* **Week 2:**
    * Order creation & lifecycle logic
    * QR handshake backend logic
    * Token generation & validation endpoints

* **Week 3:**
    * Real-time features (Socket.io)
    * 1-to-1 messaging
    * QR scanner frontend integration

* **Week 4:**
    * Ratings and review system
    * Profile dashboards
    * Frontend polish

* **Week 5:**
    * Fraud prevention hardening
    * Expiring QR tokens
    * Security testing

* **Week 6:**
    * Containerization (Docker)
    * Deployment to AWS
    * Final documentation & demo

---

## Branching Rules

* **Main Branch**
    * `main` must always remain stable and deployable
    * No direct commits to `main`
    * Only merged via approved Pull Requests

* **Creating a Feature Branch**
    * Every feature must be developed on a new branch created from `main`
    * Branch naming convention:

        ```
        feature_name
        ```

    * Examples:
        ```
        qr_code
        auth_jwt
        order_lifecycle
        rating_system
        websocket_notifications
        ```

* **How to Create a Branch**
    ```bash
    git checkout main
    git pull origin main
    git checkout -b qr_code
    ```

---

## Development Process

1. Create a new branch from `main`
2. Implement the feature completely on that branch
3. Push branch to GitHub
4. Open a Pull Request (PR) into `main`

---

## Pull Request Rules

* All features must be submitted via **Pull Request**
* PR must include:
    * Clear description of the feature
    * Summary of changes made
    * Any database/schema changes
    * Screenshots (if frontend-related)
    * Notes on testing performed

* Example PR title:
    ```
    Add QR Code Delivery Handshake
    ```

---

## Review & Merge Process

* The project lead (repo owner) will:
    * Review the code
    * Request changes if necessary
    * Approve once standards are met
* Only the project lead merges into `main`
* No self-merging

---

## Example Workflow (QR Code Feature)

```bash
git checkout main
git pull origin main
git checkout -b qr_code

# develop feature

git add .
git commit -m "Implement QR token generation and validation"
git push origin qr_code
```

---

## Resources
still need to find
