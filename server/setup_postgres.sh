#!/bin/bash
# setup_postgres.sh - Install and configure PostgreSQL for local development

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up PostgreSQL for local development...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found. Please create a .env file with database credentials.${NC}"
    echo -e "${YELLOW}The .env file should contain:${NC}"
    echo -e "${YELLOW}  DB_USER=your_username${NC}"
    echo -e "${YELLOW}  DB_HOST=localhost${NC}"
    echo -e "${YELLOW}  DB_NAME=your_database_name${NC}"
    echo -e "${YELLOW}  DB_PASSWORD=your_password${NC}"
    echo -e "${YELLOW}  DB_PORT=5432${NC}"
    exit 1
fi

# Source environment variables from .env file
echo -e "${YELLOW}Loading database configuration from .env file...${NC}"
export $(grep -v '^#' .env | xargs)

# Validate that the required variables are set
if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Error: Required database variables not found in .env file.${NC}"
    echo -e "${YELLOW}Please make sure DB_USER, DB_NAME, and DB_PASSWORD are defined.${NC}"
    exit 1
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Homebrew not found. Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${YELLOW}Homebrew is already installed. Updating...${NC}"
    brew update
fi

# Install PostgreSQL
echo -e "${YELLOW}Installing PostgreSQL...${NC}"
brew install postgresql@14

# Start PostgreSQL service
echo -e "${YELLOW}Starting PostgreSQL service...${NC}"
brew services start postgresql@14

# Wait for PostgreSQL to start
sleep 3

# Create database and user
echo -e "${YELLOW}Setting up database and user...${NC}"
createdb "$DB_NAME" || echo "Database $DB_NAME already exists or could not be created."
psql -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || echo "User $DB_USER already exists."
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql -d postgres -c "ALTER USER $DB_USER WITH SUPERUSER;"

echo -e "${GREEN}PostgreSQL setup complete!${NC}"
echo -e "${YELLOW}Database: $DB_NAME${NC}"
echo -e "${YELLOW}User: $DB_USER${NC}"

# Instructions for next steps
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}To initialize the database tables, run:${NC}"
echo -e "${YELLOW}    node setup-db.js${NC}"
echo -e "${YELLOW}To test the database connection, run:${NC}"
echo -e "${YELLOW}    psql -d $DB_NAME -U $DB_USER${NC}"