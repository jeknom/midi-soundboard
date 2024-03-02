import { promises as fs, constants } from 'fs';

/**
 * Checks if a file exists at the specified path.
 * @param filePath The path of the file to check.
 * @returns A promise that resolves with `true` if the file exists, or `false` otherwise.
 */
export async function isExistingFile(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath, constants.F_OK);
        return true; // The file exists
    } catch {
        return false; // The file does not exist
    }
}