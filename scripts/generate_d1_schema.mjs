import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const database = path.join(root, 'Database');
const output = path.join(root, 'd1', 'generated-schema.sql');

const schemaSource = await fs.readFile(path.join(database, 'schema.sql'), 'utf8');
const tableFiles = [...schemaSource.matchAll(/\\ir tables\/(.+\.sql)/g)].map((match) => match[1]);

function sqliteTable(sql) {
  return sql
    .replace(/CREATE TABLE IF NOT EXISTS\s+([a-z_]+)/i, 'CREATE TABLE IF NOT EXISTS $1')
    .replace(/\bUUID\b/gi, 'TEXT')
    .replace(/\bVARCHAR\(\d+\)\b/gi, 'TEXT')
    .replace(/\bCHAR\(\d+\)\b/gi, 'TEXT')
    .replace(/\bTIMESTAMPTZ\b|\bDATE\b|\bTIME\b/gi, 'TEXT')
    .replace(/\bJSONB\b/gi, 'TEXT')
    .replace(/\bBOOLEAN\b/gi, 'INTEGER')
    .replace(/\bSMALLINT\b/gi, 'INTEGER')
    .replace(/DEFAULT\s+TRUE/gi, 'DEFAULT 1')
    .replace(/DEFAULT\s+FALSE/gi, 'DEFAULT 0')
    .replace(/DEFAULT\s+'\{\}'::JSONB/gi, "DEFAULT '{}'")
    .replace(/DEFAULT\s+gen_random_uuid\(\)/gi, '')
    .replace(/\s+GENERATED ALWAYS AS IDENTITY/gi, '')
    .replace(/\s+CONSTRAINT\s+\w+\s+CHECK\s*\([^;]*?\)/gi, '')
    .replace(/\s+CONSTRAINT\s+\w+\s+UNIQUE\s*\([^;]*?\)/gi, '')
    .replace(/\s+CONSTRAINT\s+\w+\s+REFERENCES/gi, ' REFERENCES')
    .replace(/;\s*$/g, ';');
}

const tables = [];
for (const file of tableFiles) {
  const source = await fs.readFile(path.join(database, 'tables', file), 'utf8');
  tables.push(`-- Source: Database/tables/${file}\n${sqliteTable(source).trim()}`);
}

const indexes = await fs.readFile(path.join(database, 'indexes.sql'), 'utf8');
const sqliteIndexes = indexes.replace(/^DROP INDEX[^;]+;\s*$/gim, '').trim();
const header = `-- Generated file. Do not edit directly.\n-- Run: npm run d1:generate-schema\nPRAGMA foreign_keys = ON;\n\n`;
await fs.writeFile(output, `${header}${tables.join('\n\n')}\n\n-- Source: Database/indexes.sql\n${sqliteIndexes}\n`);
console.log(`Wrote ${path.relative(root, output)}`);