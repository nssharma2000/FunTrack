# 🎮 FunTrack

**FunTrack** is a full-stack game tracking platform where users can build and manage their personal game collections, track gameplay progress, and keep their gaming activity organized in one place.

The application uses a **React frontend** and **Spring Boot backend**, with **PostgreSQL** for persistent data storage and **JWT-based authentication** using secure HTTP-only cookies.

## 🚀 Live Demo

- **Link:** https://funtrack.vercel.app/

## ✨ Features

- 🔐 **User Authentication**
  - JWT-based authentication
  - Access token + refresh token flow
  - HTTP-only cookies for token storage
  - Secure user-specific sessions

- 🎮 **Game Collection**
  - Add games to your personal collection
  - Multiple users can own the same game
  - Games are associated with the authenticated user
  - View and manage your personal library

- 🔎 **Game Search**
  - Search games by name
  - Paginated search results
  - Efficient backend-driven pagination

- 📊 **Gameplay Tracking**
  - Track progress for games in your collection
  - Store user-specific gameplay information

- 👤 **User-specific Data**
  - Each user's collection and gameplay activity is isolated from other users
  - PostgreSQL relationships ensure games and user collections are correctly associated

- 🌐 **Full-stack Architecture**
  - React frontend
  - Spring Boot REST API
  - PostgreSQL database
  - Deployed frontend and backend

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- Axios

### Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- REST APIs
- JWT

### Database

- PostgreSQL

### Deployment

- Vercel — Frontend
- Render — Backend
- Neon - PostgreSQL


## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

- Java 25+
- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/nssharma2000/funtrack.git
cd funtrack
```

### 2. Configure the backend

Create/configure your Spring Boot environment with your PostgreSQL database credentials.

Example:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/funtrack
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

**Do not commit credentials or secrets to GitHub.**

### 3. Start the backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:

```bash
mvnw spring-boot:run
```

The backend will start on the configured Spring Boot port.

### 4. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will start locally.

## 🌍 Deployment

The FunTrack frontend is deployed using **Vercel**, while the Spring Boot backend is deployed using **Render**. The database is deployed using Neon (PostgreSQL).

## 👨‍💻 Author

**Naman Sharma**

