# Centralized Authentication & RBAC Microservice System

## 🚀 Overview

This project implements a **centralized authentication and authorization system** for a microservices architecture using **Node.js, JWT, PostgreSQL, and Redis**. Designed with production-grade security practices including **RS256**-based JWT validation and distributed **rate limiting**.

It demonstrates:

- Role-Based Access Control (RBAC)
- Attribute-Based Access Control (ABAC)
- JWT authentication with refresh tokens
- Token revocation using Redis
- Rate limiting using Redis
- API Gateway-based routing
- 
---
## 🌐 Live Deployment  
  
The application is deployed and accessible at:  
  
- API Gateway: http://<your_server_ip>:3000  
  
### Example  

http://18.234.37.80:3000/test (test URL)
http://18.234.37.80:3000/auth/login

  
> Note: All requests should be made via the API Gateway.
---
## 🏗️ Architecture
![Architecture](./docs/architecture.png)

---
## 🧠 Key Features

### 🔐 Authentication

- JWT authentication using RS256 (public/private key)
- Short-lived access tokens (15 min)
- Refresh tokens (7 days)

### 🔑 Authorization (RBAC)

- Users assigned roles
- Roles mapped to permissions
- Permission format: `<resource>:<action>`

Example:

```
orders:read
orders:write
orders:delete
```

### 🧩 ABAC (Bonus)

- Users can access or modify only their own resources (ownership-based access control)
- Example: Non-admin users can access only their own resources, while admins can access all resources ✅

---
## 🔄 Auth Flow

### Login

1. User sends credentials
2. Server validates user
3. Returns:
    - access token
    - refresh token

### Access Resource

1. Client sends access token
2. Middleware verifies token
3. Checks permissions
4. Returns data

### Refresh Token

1. Client sends refresh token
2. Server validates token from Redis
3. Issues new access token

### Logout

1. Access token is blacklisted
2. Refresh token removed from Redis

---

## 🔑 RBAC Flow  
  
1. User logs in and receives JWT  
2. JWT contains roles and permissions  
3. Client sends JWT in Authorization header  
4. Middleware extracts permissions from token  
5. Requested endpoint checks required permission  
6. Access granted or denied based on permission

---
## 🔐 Token Strategy

- Access Token: Short-lived (15 minutes)
- Refresh Token: Long-lived (7 days)
- Refresh tokens stored in Redis
- Access tokens blacklisted on logout

### 🚫 Token Revocation

- Redis-based blacklist for access tokens
- Refresh tokens stored in Redis

### 🚦 Rate Limiting

- Global rate limiting
- Stricter limits for login endpoint
- Redis-based distributed limiter

---
## 🔄 Token Validation Strategy  
  
This system uses **RS256 (public/private key)** for JWT validation.  
  
- Auth Service signs tokens using a **private key**  
- Resource services (e.g., Orders Service) verify tokens using a **public key**  
  
### 🔐 Benefits  
  
- No shared secrets across services  
- Improved security in distributed systems  

---
## 🧩 Tech Stack

- Node.js + Express
- PostgreSQL (Prisma ORM)
- Redis
- JWT (jsonwebtoken)
- Docker & Docker Compose

---

## 📁 Project Structure

```
Centralized_auth_system/
├── api_gateway/
├── auth_service/
├── orders_service/
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```
---
## ⚙️ Setup Instructions

### 1. Clone repo

```
git clone https://github.com/SoulEater001/Centralized_auth_system.git
cd centralized_auth_system
```

### 2. Install dependencies

```
cd auth_service && npm install
cd ../orders_service && npm install
cd ../api_gateway && npm install
```

### 3. Setup environment variables

Create `.env` in each service:

#### Auth Service
##### Local development
```
PORT=3001
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://postgres:password@localhost:5432/auth_db
```
##### Docker 
```
PORT=3001
DATABASE_URL=postgresql://postgres:password@postgres:5432/auth_db
REDIS_URL=redis://redis:6379
```

#### Orders Service
##### Local development
```
PORT=3002
REDIS_URL=redis://localhost:6379
```
##### Docker 
```
PORT=3002
REDIS_URL=redis://redis:6379
```

#### API Gateway
##### Local development
```
PORT=3000
REDIS_URL=redis://localhost:6379
AUTH_SERVICE_URL=http://auth_service:3001
ORDERS_SERVICE_URL=http://orders_service:3002
```
##### Docker
```
PORT=3000
REDIS_URL=redis://redis:6379
AUTH_SERVICE_URL=http://auth_service:3001
ORDERS_SERVICE_URL=http://orders_service:3002
```

---
### 4. RSA Key Generation  
  
This project uses **RS256 (public/private key)** for JWT authentication.  
  
Generate keys using:  
  
```bash  
openssl genrsa -out private.key 2048  
openssl rsa -in private.key -pubout -out public.key
```
#### 📁 Place Keys

- `auth_service/keys/private.key` (used for signing)
- `auth_service/keys/public.key`
- `orders_service/keys/public.key`
- `api_gateway/keys/public.key (optional, if validation is implemented)` 
#### ⚠️ Important

- Never expose `private.key`
- Only `public.key` should be shared across services
### 5. Run services

```
nodemon auth_service/app.js
nodemon orders_service/app.js
nodemon api_gateway/app.js
```

---
## 🐳 Docker Setup  
  
This project can be run using Docker Compose, which starts all services including API Gateway, Auth Service, Orders Service, PostgreSQL, and Redis.  
  
---  
### 📦 Prerequisites  
  
- Docker  
- Docker Compose  
  
---  
### ⚙️ Environment Setup (Docker)  
  
Each service requires a `.env.docker` file.  
  
You can create it by copying the example:
```bash
cp .env.docker.example .env.docker
```
Or manually create `.env.docker` using the provided example or referring to Docs.

---
### ⚙️ Setup  
  
1. Ensure `.env.docker` files are configured for Docker:  
- Use `postgres` as database host  
- Use `redis` as Redis host  

2.  Generate RSA Keys
- Ensure the keys are present inside each service before running Docker.
- Since private keys are not committed for security reasons, generate them locally before running:
  
3. Run the following command:
- For first time :-
```bash
docker-compose up --build
```
- Later :-
```
docker-compose up
```

---
### ❗ If you want `.env.docker`

You MUST change it to:
```YAML
env_file:  
  - ./<service_name>/.env.docker
```

---  
### 🌐 Services  

| Service        | URL                   |     |
| -------------- | --------------------- | --- |
| API Gateway    | http://localhost:3000 |     |
| Auth Service   | http://localhost:3001 |     |
| Orders Service | http://localhost:3002 |     |

---  
### 🛑 Stop Containers

```
docker-compose down
```

---  
### 🧠 Notes  

- No need to run PostgreSQL or Redis locally  
- Containers communicate using service names (`postgres`, `redis`)  
- Prisma migrations run automatically when the Auth service starts

---
## 🔐 Security Decisions

- Password hashing using bcrypt
- Short-lived access tokens
- Refresh token validation via Redis
- Token revocation using blacklist
- Rate limiting to prevent abuse
-  Public/private key-based JWT validation (RS256)
- Audit logging for tracking API access

---
## 📊 Audit Logging

The system implements audit logging to track API access and actions.

Each request logs:
- Timestamp
- HTTP method and endpoint
- User ID (if authenticated)
- Response status
- Request duration
- IP address

Logs are emitted to **stdout**, making them compatible with Docker and production logging systems.

This enables:
- Monitoring system usage
- Debugging issues
- Security **auditing**

---
## 🧠 Design Decisions

### PostgreSQL for RBAC  
PostgreSQL was chosen due to the relational nature of RBAC, where users, roles, and permissions have many-to-many relationships. It ensures data integrity, efficient joins, and strong consistency.  
  
### JWT with RS256 (Public/Private Key)
JWT is used with RS256 algorithm:
- Tokens are signed using a private key in the Auth Service
- Other services verify using a public key
- 
This avoids sharing secrets across services and improves security in distributed microservice environments.
  
### Redis for Token Management & Rate Limiting  
Redis is used for:  
- Token revocation (blacklisting access tokens)  
- Refresh token storage and validation  
- Distributed rate limiting across services  
  
Its low-latency access and support for key expiration make it ideal for managing short-lived authentication data efficiently.  
  
### API Gateway for Centralized Control  
The API Gateway handles routing, rate limiting, and acts as a single entry point for all client requests, reducing duplication across services.  
  
### Microservices Architecture  
The system is split into independent services (Auth, Orders, Gateway), each with a single responsibility. Communication is handled via HTTP, ensuring loose coupling and scalability.

---
## ⭐ Bonus Features Implemented

- Token revocation (Redis)
- Rate limiting (Redis)
- ABAC (ownership-based access)
- Multi-role support
-  Audit logging (API access tracking)
- RS256 JWT validation (public/private key)

---
## 📡 API Endpoints

### 🔐 Auth Service

#### POST /auth/login
```
Request:  
{  
  "email": "admin@test.com",  
  "password": "123456"  
}
```

```
Response:  
{  
  "accessToken": "...",  
  "refreshToken": "...",
  "sessionId": "..."
}
```

---
#### POST /auth/refresh
```
Request:  
{  
  "refreshToken": "..."  
}
```

```
Response:  
{  
  "accessToken": "new_token"  
}
```

---
#### POST /auth/logout

Headers:
```
Authorization: Bearer <accessToken>
```

```
Request:  
{  
  "refreshToken": "..."  
}
```

```
Response:
{
    "message": "Logged out successfully"
}
```

---
### 📦 Orders Service

#### GET /orders

Permission: `orders:read`

**Headers:**
```
Authorization: Bearer <accessToken>
```

---
#### POST /orders

Permission: `orders:write`

**Headers:**
```
Authorization: Bearer <accessToken>
```

{  
  "item": "Laptop"  
}

---
#### DELETE /orders/:id

Permission: `orders:delete`

**Headers:**
```
Authorization: Bearer <accessToken>
```

---
## 📌 Future Improvements

- API Gateway JWT verification
- Multi-tenant support
- Swagger API documentation
- Refresh token rotation

---
## 📬 Author

Shivam Kumar Dewangan