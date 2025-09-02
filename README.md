# COMPASS-DB

This is a web service developed using Express.js.

## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Built With](#built-with)
- [Contributing](#contributing)
- [Versioning](#versioning)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Getting Started

These instructions will get you started with a copy of the project on your local machine for development and testing purposes.

## Prerequisites

You will need to have Node.js and npm installed on your machine.

## Installation

After cloning the repository, navigate to the project directory and run:
npm install

This will install all the necessary dependencies.

## Usage

Create local postgres instance with command :
docker run --name imitationdb -p 5432:5432 -e POSTGRES_PASSWORD=xxxxxx -e POSTGRES_DB=xxxxxx -d postgres:16-alpine

Create .env file to the root of the project with these values:

```
POSTGRES_USER=postgres
PASSWORD=(your local postgres password)
PORT=5432
HOST=localhost
DATABASE=(your local postgres schema)
SSL=true (leave this out if using local Docker database)
```

Run npm install

Start the service with node index.js

Add Language models to language_model table names and urls (found in keepass)

Run tests with command: npm run coverage

## Deployment

Add additional notes about how to deploy this on a live system.

## Contributing

If you're interested in contributing, feel free to send a pull request!

## Versioning

Not specified.

## License

This project is licensed under the MIT License

## Acknowledgments

- Acknowledge the works of others used/referred in the project.
