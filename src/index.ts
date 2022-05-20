import express, { Express, Request, Response } from "express";
import knex from "knex";

const db = knex({
  client: "sqlite3",
  connection: {
    filename: "./db/transponders.db",
  },
  useNullAsDefault: true,
});

const app: Express = express();
const port = 3000;

app.use(express.json());

app.listen(port, () => {
  console.log(`Server is running at https://localhost:${port}`);
});
