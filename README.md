# Sample Blog App – Backend

## Introduction
This backend is built as part of a **technical assessment** and follows a **microservices architecture** organized in a **monorepo**.  
It is developed with **Express.js** and **TypeScript**, designed for scalability, modularity, and secure communication between services.

Key features:
- **Gateway service** for traffic routing, CORS handling, and request filtering
- **Dockerized** for easy deployment and reproducibility
- **Session-based authentication** with **Redis** for session storage
- **JWT tokens** for stateless API authentication
- **HTTP-only cookies** for improved security
- **Elasticsearch** integration for post and comment search

---

## Microservices Overview

### 1. **Gateway**
- Handles all incoming traffic
- Implements **CORS protection**
- Routes requests to the appropriate microservice
- Can be extended for request rate limiting, logging, and monitoring

### 2. **Users Service**
- Manages:
  - User registration
  - Authentication
  - Profile information
- Issues **JWT tokens**
- Stores session data in **Redis**

### 3. **Posts Service**
- Manages:
  - Posts
  - Comments
  - Tags
- Integrates with **Elasticsearch** for:
  - Full-text search
  - Efficient querying
  - Data indexing

---

## Technologies Used
- **Express.js** + **TypeScript** – Strongly typed backend services
- **Docker** – Containerized deployment
- **Redis** – Session storage
- **JWT** – Token-based authentication
- **HTTP-only Cookies** – Secure session delivery
- **Elasticsearch** – Full-text search and analytics
- **Node.js** – Runtime environment

---

## Prerequisites
- **Node.js** (recommended: v18+)
- **npm** (recommended: v9+)
- **Docker** & **Docker Compose**
- **Redis** running locally or via Docker
- **Elasticsearch** running locally or accessible remotely
- Internet connection to install dependencies

---

## Installation & Run

### 1. Clone the repository
```bash
git clone 
```
### 2. Install dependencies
From the monorepo root:
```
npm install --legacy-peer-deps
```
### 3. docker-compose up --build
```
docker-compose up --build
```

### Architecture Overview
- Gateway → Microservices pattern for traffic routing
- Users Service handles authentication & profiles
- Posts Service handles post creation, comments, tags, and ES queries
- Session-based authentication combined with JWT for hybrid security
- HTTP-only cookies protect against XSS attacks
- Redis ensures session persistence
- Dockerized services for portability

  ## Notes for the Technical Test

This backend demonstrates proficiency in:

- **Express.js** + **TypeScript**
- **Microservices architecture**
- **Dockerized environments**
- **Redis**, **JWT**, and **secure HTTP-only cookies**
- **Elasticsearch** integration
- Clean and modular architecture principles
- Design focused on **scalability**, **maintainability**, and **security**
