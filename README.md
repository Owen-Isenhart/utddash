# UTDDash

## Overview
* **UTDDash** is a peer-to-peer marketplace exclusively for the University of Texas at Dallas. It connects students with extra meal swipes to students who want food at a discount.
* Students with unused swipes (that would otherwise go to waste) can accept delivery requests and earn cash.
* Students without meal plans can request food from on-campus dining locations at a discounted price.
* Think DoorDash — but powered by meal swipes and limited to the UTD community.
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

## Core System Design

### Users Table
* id
* email (@utdallas.edu only)
* hashed_password
* role (buyer/provider/both)
* rating
* payment_handle
* created_at

### Orders Table
* id
* buyer_id
* provider_id (nullable until accepted)
* location
* items (JSON)
* price
* status
* qr_token_hash
* qr_token_expiration
* timestamps

### Messages Table
* id
* order_id
* sender_id
* content
* created_at

### Ratings Table
* id
* order_id
* reviewer_id
* reviewee_id
* rating
* comment

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
