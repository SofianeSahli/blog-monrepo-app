# User Microservice

## Overview

This **User Microservice** is a standalone Node.js/Express service built with TypeScript designed to handle user authentication, registration, and profile management for a microservices architecture. It uses **session-based authentication** with sessions stored in **Redis** for scalability and shared access across multiple services or a gateway.

---

## Features

- **User Registration & Login**  
  Allows new users to register with email and password, with validation for required fields and email format. Passwords are hashed securely before storage.

- **Session Management**  
  Uses `express-session` with **Redis** as a session store, enabling persistent, scalable session management. Sessions have sliding expiration with `rolling: true` to refresh session timeout on each request.

- **Authentication Middleware**  
  Protects private routes by checking the existence and validity of user sessions.

- **Security Best Practices**

  - HTTP-only cookies to prevent client-side script access
  - Proper `SameSite` cookie attribute to reduce CSRF risks
  - Password hashing using bcrypt
  - Environment variables for sensitive configuration like session secrets and database URIs

- **MongoDB Integration**  
  User data is persisted in MongoDB with a Mongoose schema enforcing email uniqueness and password constraints.

- **Dockerized Setup**  
  Includes Dockerfile and Docker Compose setup to run the microservice along with Redis and MongoDB containers.

---

## Technical Stack

- **Node.js** with **Express** and **TypeScript**
- **MongoDB** with **Mongoose** for user data persistence
- **Redis** for session storage
- **express-session** and **connect-redis** for session management
- **bcrypt** for password hashing
- **Docker & Docker Compose** for containerized environment

---

## Project Structure Highlights

- `/src/config/passport.ts` — Passport local strategy configuration for authentication
- `/src/models/User.ts` — Mongoose user schema and model
- `/src/routes/auth.ts` — Routes for register, login, logout, and profile access
- `/src/server.ts` — Main Express app setup including session, Redis connection, CORS, and route registration
- `/Dockerfile` & `/docker-compose.yml` — Container definitions for microservice and dependencies

---

## Environment Variables

- `PORT` — Port on which the microservice runs (default: 4000)
- `MONGO_URI` — MongoDB connection string
- `REDIS_URL` — Redis connection URL
- `SESSION_SECRET` — Secret used to sign session cookies
- `JWT_EXPIRATION` — Session expiration time in milliseconds (used for cookie maxAge)

---

## Usage

- Copy .env.exemple and rename it to .env
- Run `docker-compose up` to start the service along with Redis and MongoDB.
- Use `/api/auth/register` to create a new user.
- Use `/api/auth/login` to authenticate and establish a session (session cookie set in response).
- Use protected routes like `/api/auth/profile` to access user data (requires active session).
- Use `/api/auth/logout` to destroy the session.

---

## Notes

- Sessions are stored in Redis to allow horizontal scaling and sharing session data with other services or a gateway.
- The service is ready to be integrated behind an API gateway that handles centralized authentication and request routing.
- CORS is configured to allow cross-origin requests from the frontend app with cookies support (`credentials: true`).
