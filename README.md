# gym-app: High-Concurrency Fitness Platform

A production-grade, full-stack fitness application engineered with a security-first mindset. Built with **FastAPI**, **MongoDB (Beanie)**, and **React**, the system features an asynchronous audit engine and a resilient data architecture.

## 🏗️ Architectural Design Patterns

### 1. Data Durability: The Snapshot Strategy
To solve the "Historical Drift" problem common in fitness apps, this platform utilizes a **Denormalization Snapshot** pattern.
- **Problem**: If a user edits a "Bench Press" template today, their logs from 2023 shouldn't change.
- **Solution**: When a session is logged, the system captures an immutable snapshot of exercise metadata.
- **Result**: Historical progress remains a "source of truth," independent of current template states.

### 2. Asynchronous Audit Logging (Producer-Consumer)
To maintain high-availability and low-latency, destructive actions (PUT, PATCH, DELETE) are logged via a decoupled pipeline:
- **Broker**: **Redis** buffers events via `LPUSH`.
- **Worker**: A background process consumes events with `BRPOP`, persisting them to a dedicated MongoDB collection.
- **Performance**: This ensures the user receives a response in milliseconds without waiting for the audit database write.

### 3. Modular Frontend Architecture
- **Centralized Logic**: The `SessionCard` component centralizes complex volume/set calculations.
- **Library Segmentation**: A custom UI implementation (All | Official | Personal) allows users to isolate custom exercises from system-seeded content.

## 🔒 Security Infrastructure

### 1. Authentication & Token Lifecycle
- **JWT Hardening**: Short-lived access tokens (15m) paired with **Refresh Token Rotation**.
- **Cryptographic Standards**: Industry-standard password hashing using **Argon2**.
- **Secure Storage**: Axios interceptors manage the token lifecycle, with logic built to support future transition to `HttpOnly` cookies.

### 2. Authorization & Resource Security
- **Invisible 404 Pattern**: To mitigate **Resource Enumeration**, the API returns a generic `404 Not Found` for unauthorized attempts to access resource IDs, hiding the existence of private data.
- **Ownership Enforcement**: Every mutation requires a match between `current_user.id` and the resource's `user_id`.
- **RBAC**: Strict Role-Based Access Control for administrative endpoints and "Official" exercise management.

### 3. API Hardening
- **Strict CORS**: Explicit origin whitelisting prevents cross-site request forgery.
- **Sensitive Data Masking**: Outbound Pydantic schemas are configured to exclude sensitive internal fields and password hashes automatically.

## 🛠️ Tech Stack & DevOps
- **Backend**: Python 3.10+, FastAPI, Beanie ODM (MongoDB)
- **Frontend**: React, CSS Modules (Scoped Styling), Axios
- **Infrastructure**: Redis (Messaging), Docker & Docker Compose

## 🚀 Deployment
The entire ecosystem is containerized for deterministic deployments.

```bash
# Spin up API, DB, Redis, and Worker
docker-compose up --build
```

## 📈 Roadmap
- **Predicate Pushdown**: Optimizing GET list endpoints for database-level user filtering.
- **Rate Limiting**: Implementing brute-force protection for Auth routes.

