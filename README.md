# Minimal React App for AI Writing and Ownership Exeriment

This is a minimal React application using Vite for development. It was developed on a Mac.

Last updated early 2025.


## Prerequisites
Ensure you have the following installed on your Mac:
- [Homebrew](https://brew.sh/)
- Node.js and npm (via Homebrew)
  ```sh
  brew install node
  ```

## .env

The `.env.` file need to have an OpenAI key. It should look something like:

```
OPENAI_API_KEY=sk-proj-bunchofrandomlettersandnumbersquitelong
```

## App structure


```
minimal-react-app/
│── client/                  # Frontend (React)
│   ├── public/
│   │   
│   ├── src/
│   │   ├── App.jsx          # Main React component (with API call)
│   │   ├── main.jsx         # React entry point
│   │   ├── index.css        # Basic styles
|   ├── index.html            # Main HTML file
│   ├── package.json         # React dependencies
│   ├── vite.config.js       # Vite config
│   ├── .gitignore           # Git ignore file
│
│── server/                  # Backend (Express + PostgreSQL)
│   ├── db/
│   │   ├── schema.sql       # PostgreSQL schema setup
│   │   ├── db.js            # Database connection
│   ├── .env                 # Environment variables (e.g., DB credentials, API keys)
│   ├── index.js             # Express server (API routes)
│   ├── package.json         # Backend dependencies
│   ├── .gitignore           # Git ignore file
│
│── README.md                # Documentation
```

## Run app

start backend

```
cd server
npm install
npm start
```

start front end

```
cd client
npm install
npm run dev
```

## PostgreSQL database

`brew services start postgresql`

run once

`psql -U your_user -d your_db -f server/db/schema.sql`










