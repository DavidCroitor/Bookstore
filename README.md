# Bookstore Application

This is a full-stack bookstore application built with a **Node.js** backend and a **Next.js** frontend. The application allows users to manage a collection of books, including adding, editing, deleting, and viewing books. It also provides statistics and visualizations for the book data.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Scripts](#scripts)
- [Testing](#testing)
- [License](#license)

---

## Features

### Backend
- RESTful API for managing books.
- CRUD operations for books.
- Validation for book data using `express-validator`.
- In-memory data storage with JSON file persistence.
- Centralized error handling.

### Frontend
- Responsive UI built with **Next.js** and **React**.
- Book management features (add, edit, delete).
- Filtering and sorting books by title, author, and price.
- Pagination for book lists.
- Data visualizations using **Chart.js**:
  - Genre distribution.
  - Price distribution.
  - Average price per genre.
- Key statistics display (e.g., most expensive book, least expensive book).

---

## Technologies Used

### Backend
- **Node.js** with **Express.js** for the REST API.
- **express-validator** for request validation.
- **http-errors** for error handling.
- **Jest** and **Supertest** for testing.

### Frontend
- **Next.js** for server-side rendering and routing.
- **React** for building UI components.
- **Chart.js** for data visualizations.
- **TailwindCSS** for styling.
- **Jest** and **React Testing Library** for testing.

---

## Project Structure

```
bookstore/
├── backend/
│   ├── data/                # JSON file for book data
│   ├── src/
│   │   ├── api/             # API route handlers
│   │   ├── controllers/     # Controller logic
│   │   ├── middlewares/     # Validation and error handling
│   │   ├── repositories/    # Data access layer
│   │   ├── services/        # Business logic
│   │   ├── __tests__/       # Backend tests
│   │   └── app.js           # Express app configuration
│   ├── package.json         # Backend dependencies and scripts
│   └── server.js            # Backend entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # Context API for state management
│   │   ├── pages/           # Next.js pages
│   │   ├── styles/          # CSS modules
│   │   └── __tests__/       # Frontend tests
│   ├── package.json         # Frontend dependencies and scripts
│   ├── next.config.mjs      # Next.js configuration
│   └── public/              # Static assets
├── .gitignore               # Ignored files and directories
└── README.md                # Project documentation
```

---

## Getting Started

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```

   The backend server will run on [http://localhost:5000](http://localhost:5000).

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

   The frontend will run on [http://localhost:3000](http://localhost:3000).

---

## Scripts

### Backend
- `npm start`: Start the backend server.
- `npm run dev`: Start the backend server with hot-reloading using `nodemon`.
- `npm test`: Run backend tests using `Jest`.

### Frontend
- `npm run dev`: Start the frontend development server.
- `npm run build`: Build the frontend for production.
- `npm run start`: Start the production frontend server.
- `npm run test`: Run frontend tests using `Jest`.

---

## Testing

### Backend
Run backend tests using `Jest`:
```bash
cd backend
npm test
```

### Frontend
Run frontend tests using `Jest` and `React Testing Library`:
```bash
cd frontend
npm test
```

---

## License

This project is licensed under the MIT License.