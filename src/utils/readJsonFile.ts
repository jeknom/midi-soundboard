import { promises as fs } from 'fs';

export async function readJsonFile(filePath: string) {
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    return data;
  } catch (err) {
    console.error("Read failed", err);
    throw err;
  }
}