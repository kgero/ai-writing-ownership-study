# Minimal React App for AI Writing and Ownership Exeriment

This is a minimal React application for running an experiment on AI, writing, and ownership. It was developed on a Mac.

## TODOs

- revise post-survey to match IRB
- set up interaction logging (create the table, add in all the hooks)
- ensure that text is saved to the snapshots at the end of each stage, not just final submission
  - this is done! but make sure AI generated draft is saved properly this way for consistency
- think about if it's worth having a 'config' table that maps participants to experiment config details (e.g. stage max length, prompts, etc.) or having participant condition and prompt saved everywhere

There are also many aesthetic fixes, as well as some prompt engineering for the LLM and crafting of the writing prompts for the participants.


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



## Run app locally

Ensure you have the following installed on your Mac:

- [Homebrew](https://brew.sh/)
- Node.js and npm (via Homebrew)

  ```sh
  brew install node
  ```

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





