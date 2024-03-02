import { promises as fs, Dirent } from 'fs';

/**
 * Reads the names of all files in a specified directory.
 * @param dirPath The path of the directory to read.
 * @returns A promise that resolves with a list of filenames as strings.
 */
export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    // Use `readdir` with the `withFileTypes` option to get Dirent objects
    const dirents: Dirent[] = await fs.readdir(dirPath, { withFileTypes: true });
    // Filter the list to include only files and map to their names
    const fileNames = dirents
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name);
    return fileNames;
  } catch (err) {
    console.error("Error reading directory", err);
    throw err; // Rethrow or handle as needed
  }
}