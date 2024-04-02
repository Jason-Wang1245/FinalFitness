const { Client } = require('pg');

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "codeide",
    database: "HealthAndFitnessClub"
})

client.connect();

module.exports = { client };