import { readFile } from 'node:fs/promises';
import pg from 'pg';
import format from 'pg-format';

const client = new pg.Client({
  password: process.env.PG_PASS,
  user: 'postgres',
  host: 'localhost'
})

await client.connect()

const testRegexp = /^(?<email>[^\@]*\@([a-zA-Z\d\-]+\.)+[a-zA-Z]*)(?<divider>[^a-zA-Z\d])(?<password>.*)/gm;

const data = (
  await readFile(process.env.INPUT_FILE_NAME, { encoding: 'utf8' })
).replaceAll('\r', '');


const badLines = new Set(data.split('\n'));
const dividers = new Set<string>()
const sqlRows = [];

for (const i of data.matchAll(testRegexp)) {
  badLines.delete(i[0]);

  dividers.add(i.groups.divider);
  if (dividers.size > 1)
    throw new Error(`
      Found inconsistent divider.
      Usual divider is '${[...dividers.values()].filter( e => e !== i.groups.divider)[0]}'.
      New unusual divider is '${i.groups.divider}' on ${[...data.slice(0, i.index)].filter(e => e === '\n').length + 1} line ('${i[0]}')
    `);

  sqlRows.push([i.groups.email, i.groups.password])
}

if (badLines.size)
  throw new Error(`Don't know what to do with following:\n${[...badLines.values()].join('\n')}`)


await client.query(format(
  `INSERT INTO tuples(email, password) VALUES %L ON CONFLICT
  (email, password) DO UPDATE SET frequency = tuples.frequency + 1;`,
  sqlRows
))

await client.end()
