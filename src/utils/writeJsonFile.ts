import { promises as fs } from 'fs';

export async function writeJsonFile<TData>(filePath: string, data: TData) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log("File written successfully");
  } catch (err) {
    console.error("Write failed", err);
    throw err; // Rethrow or handle as needed
  }
}