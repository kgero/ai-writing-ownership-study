# Minimal React App for AI Writing and Ownership Exeriment

This is a minimal React application for running an experiment on AI, writing, and ownership. It was developed on a Mac.


## Prerequisites

Ensure you have the following installed on your Mac:

- [Homebrew](https://brew.sh/)
- Node.js and npm (via Homebrew)

  ```sh
  brew install node
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
│   │   ├── ...              # More files
│   ├── index.html           # Main HTML file
│   ├── package.json         # React dependencies
│   ├── vite.config.js       # Vite config
│   ├── .env                 # Just contains the VITE_API_URL
│   ├── .gitignore           # Git ignore file
│
│── server/                  # Backend (Express + PostgreSQL)
│   ├── .env                 # Environment variables (e.g., DB credentials, API keys)
│   ├── index.js             # Express server (API routes)
│   ├── setup-db.js          # Scripts to set up PostgeSQL database
│   ├── package.json         # Backend dependencies
│   ├── .gitignore           # Git ignore file
│
│── README.md                # Documentation
```

## .env

The `.env` file need to have an OpenAI key, as well as the credentials for the database. It should look something like:

```
OPENAI_API_KEY=sk-proj-bunchofrandomlettersandnumbersquitelong
DB_USER=writing_app_user
DB_HOST=localhost
DB_NAME=writing_app_db
DB_PASSWORD=putincorrectpasswordhere
DB_PORT=5432
PORT=5001
```

## Run app locally

To run the app locally, you need to start up the backend and frontend separately.

Start backend:

```
cd server
npm install
npm start
```

Start frontend:

```
cd client
npm install
npm run dev
```

## PostgreSQL database

For the app to store data to the database, you'll have to set up a local postgresql database.

Follow these steps to set up the database:

1. Make sure PostgreSQL is installed on your system
2. Ensure the `.env` file has the required variables (see above).
3. Run the database setup script from the `server` directory:
   ```bash
   bash setup_postgres.sh
   ```

The script will:
- Create a PostgreSQL user if it doesn't exist
- Create a database if it doesn't exist
- Set up required tables and indexes
- Grant necessary permissions

You can check that postgres is running with the command:

```
brew services list
```

Once setup is complete, you can start the server with `npm start`.

### pgAdmin

You might want to use pgAdmin, which is a GUI for checking on the databases. Install with brew:

```
brew install --cask pgadmin4
```

And then start the pgAdmin 4 application from your Applications folder or Spotlight (⌘+Space and type "pgAdmin"). Some more details about being able to actually see the data using this app:


- Create a New Server Connection
  - Right-click on "Servers" in the left sidebar
  - Select "Create" → "Server..."
  - Enter Connection Details.
- Find the actual tables
  - Expand your server connection
  - Expand "Databases"
  - Expand your database (writing_app_db)
  - Expand "Schemas"
  - Expand "public"
  - Click on "Tables"
- See the actual data in a table:
  - Right-click on the table
  - Select "View/Edit Data" > "All Rows"





