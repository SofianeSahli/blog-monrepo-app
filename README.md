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
- Websocket connexion

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
 
### 3. **Notifications Service**
- Manages:
  - Notifications


---

## Technologies Used
- **Express.js** + **TypeScript** – Strongly typed backend services
- **Docker** – Containerized deployment
- **Redis** – Session storage and messageries system
- **JWT** – Token-based authentication
- **HTTP-only Cookies** – Secure session delivery
- **Elasticsearch** – Full-text search and analytics
- **Node.js** – Runtime environment

---

## Prerequisites
- Docker desktop

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
copy .env.exemple and change name to .env in case there no env file cloned with this repo. Only the one main folder matter, the ones under somes services are for test purposes only and therefore, can be ignored

### 4. docker-compose up --build
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
