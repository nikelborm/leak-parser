import { readFile } from 'node:fs/promises';
import pg from 'pg';
import format from 'pg-format';

const { Client } = pg;

const client = new Client({
  password: process.env.PG_PASS,
  user: 'postgres',
  host: 'localhost'
})

await client.connect()

const testRegexp = /^(?<email>[^\@]*\@([a-zA-Z\d\-]+\.)+[a-zA-Z]*)(?<divider>[^a-zA-Z\d])(?<password>.*)/gm;

const data = (
  await readFile(process.env.INPUT_FILE_NAME, { encoding: 'utf8' })
).replaceAll('\r\n', '\n');


const badLines = new Set(data.split('\n'));
const sqlRows = [];

for (const i of data.matchAll(testRegexp)) {
  badLines.delete(i[0]);
  sqlRows.push([i.groups.email, i.groups.password])
}

console.log('badLines: ', badLines);

await client.query(format(
  `INSERT INTO tuples(email, password) VALUES %L ON CONFLICT
  (email, password) DO UPDATE SET frequency = tuples.frequency + 1;`,
  sqlRows
))

await client.end()
