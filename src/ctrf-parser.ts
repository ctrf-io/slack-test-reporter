import fs from 'fs';
import { CtrfReport } from '../types/ctrf';

export const parseCtrfFile = (filePath: string): CtrfReport => {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const result: CtrfReport = JSON.parse(fileContent);
    return result;
};
