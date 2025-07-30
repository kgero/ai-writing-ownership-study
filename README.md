# Minimal React App for AI Writing and Ownership Exeriment

This is a minimal React application for running an experiment on AI, writing, and ownership. It was developed on a Mac by Katy Gero in mid-2025.

## Railway deployment

This app is deployed on Railway via github. There is a single project with three services: the client, the server, and the postgres database. The client and server should automatically redeploy when the github repo updates the relevant code.

There are some environment variables that need to be set in Railway carefully:

- `VITE_API_URL` in the client must be set to the server url (incl. https:// is key)
- `CLIENT_URL` in the server must be set to the client url (incl. https:// is key)
- `OPENAI_API_KEY` in the server must have the OpenAI key to make LLM requests

The server must also have the variables for the PostgreSQL database; these should be reference variables as Railway is also setting the PostgreSQL details.


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

The `/server/.env` file needs to have variables for connecting to the database and an API key for accessing OpenAI models. (Actually not sure if REACT_APP_API_URL does anything; that's the url for the server.) Something like this:

```
OPENAI_API_KEY=anapikeygoeshere
DB_USER=writing_app_user
DB_HOST=localhost
DB_NAME=writing_app_db
DB_PASSWORD=apasswordgoeshere
DB_PORT=5432
PORT=5001
REACT_APP_API_URL=http://localhost:5001
```

The `/client/.env` file needs to point to the server. Something like:

```
VITE_API_URL=http://localhost:5001
```

For the `/analysis/.env` see below:

## Connect to database via Jupyter notebook

In the `/analysis` directory are jupyter notebooks for running analysis. To connect to the Postgres database, which is hosted on Railway, you need to set up the relevant environment variables in `/analysis/.env`. These variables can be found via the Railway dashboard, if you click on the Postgres service and look at how to connect via a public connection. This incurs some costs but I believe they will be quite low. The `.env` file should look something like:

```
DB_HOST=switchback.proxy.rlwy.net
DB_PORT=port
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=railway
```

## Run app locally

Ensure you have the following installed on your Mac:

- [Homebrew](https://brew.sh/)
- Node.js and npm (via Homebrew)

To run the app locally, you need to start up the backend (server) and frontend (client) separately.

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

For the app to store data to the database during development, you'll have to set up a local postgresql database. In production, the app should connect to the Railway Postgres database automatically.

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


## Analysis notebooks

Follow [these instructions](https://gist.github.com/33eyes/431e3d432f73371509d176d0dfb95b6e) for removing the output of notebooks before committing. (This makes it possible to reasonably track changes in the Jupyter notebooks via commits.)


