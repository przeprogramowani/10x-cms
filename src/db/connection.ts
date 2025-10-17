import knex from "knex";
import config from "./knexfile.js";

const environment = process.env.NODE_ENV || "development";
const connectionConfig = config[environment as keyof typeof config];

const db = knex(connectionConfig);

export default db;
