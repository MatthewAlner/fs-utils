import { Dirent, existsSync, lstatSync } from 'fs';
import { copyFile, mkdir, readdir, readFile, writeFile } from 'fs/promises';
import * as path from 'path';

export interface IFile {
  absolutePath: string;
  extension: string | null;
  index?: number;
  name: string;
  nameWithoutExtension: string;
  parentDirectory: string;
  relativePath: string;
}

export interface ITransfer {
  file: IFile;
  destination: string;
  actionReason: string | null;
}

export type FileExtension = `.txt` | `.json` | `.md`;
export type FileBlackList = `.DS_Store`;

export class FSUtils {

  public static async listFilesWithExtension(folderPath: string, fileExtensions: FileExtension[], ignoreFiles: FileBlackList[] = []): Promise<IFile[]> {
    const files: IFile[] = await FSUtils.listFiles(folderPath);
    return files.filter((file) => {

      const includedInFilter = fileExtensions.includes(file.extension as FileExtension);
      const ignoredFile = ignoreFiles.includes(file.name as FileBlackList);

      return includedInFilter && !ignoredFile;
    });
  }

  public static async listFiles(folderPath: string): Promise<IFile[]> {
    const files: IFile[] = [];
    const folderContents = await readdir(folderPath, { withFileTypes: true });

    for (const item of folderContents) {
      if (item.isFile()) {
        files.push(FSUtils.createFile(item, folderPath, files.length + 1));
      }
    }

    return files;
  }

  public static async readJsonFile(filename: string) {
    const data = await readFile(filename, `utf-8`);
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error parsing JSON file: ${filename}`);
      throw error;
    }
  }

  public static getFileExtension(fileName: string): string | null {
    const extension = path.extname(fileName);
    return extension?.length > 0 ? extension : null;
  }

  public static getNameWithoutExtension(fileName: string): string {
    return path.basename(fileName, path.extname(fileName));
  }

  public static isFolder(folderPath: string): boolean {
    return existsSync(folderPath) && lstatSync(folderPath).isDirectory();
  }

  public static async listAllFilesRecursively(folderPath: string, files: IFile[] = []): Promise<IFile[]> {
    const folderContents = await readdir(folderPath, { withFileTypes: true });

    for (const item of folderContents) {
      if (item.isFile()) {
        files.push(FSUtils.createFile(item, folderPath, files.length + 1));
      }

      if (item.isDirectory()) {
        files = await FSUtils.listAllFilesRecursively(`${folderPath}/${item.name}`, files);
      }
    }

    return files;
  }

  public static async createADirectory(directoryPath: string): Promise<string | undefined> {
    return await mkdir(directoryPath, { recursive: true });
  }

  public static async copyFile(transfer: ITransfer): Promise<void> {
    try {
      await copyFile(path.join(transfer.file.relativePath, transfer.file.name), transfer.destination);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public static async copyFiles(transfers: ITransfer[]): Promise<void> {
    for (const transfer of transfers) {
      await FSUtils.copyFile(transfer);
    }
  }

  public static getEnclosingFolderPath(folderPath: string): string {
    return path.dirname(folderPath);
  }

  public static getFolderNameFromPath(folderPath: string): string {
    return path.basename(folderPath);
  }

  public static createFile(item: Dirent, folderPath: any, index?: number ): IFile {
    const relativePath = path.join(folderPath, item.name);

    const file: IFile = {
      absolutePath: path.resolve(relativePath),
      extension: FSUtils.getFileExtension(item.name),
      name: item.name,
      nameWithoutExtension: FSUtils.getNameWithoutExtension(item.name),
      parentDirectory: folderPath,
      relativePath: relativePath,
    };

    if (index !== undefined) {
      file.index = index;
    }

    return file;
  }

  public static async saveJsonFile(path: string, fileName: string, data: any): Promise<void> {
    return FSUtils.saveFile(path, fileName, JSON.stringify(data, null, 2));
  }

  public static async saveFile(path: string, fileName: string, data: any): Promise<void> {
    const fullPath = `${path}/${fileName}`;
    await FSUtils.createADirectory(path);
    try {
      await writeFile(fullPath, data);
    } catch (error) {
      console.error(`Error saving file: ${fullPath}`);
      throw error;
    }
  }
}
