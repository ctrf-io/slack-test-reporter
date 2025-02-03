import fs from 'fs';
import { CtrfReport } from '../types/ctrf';
import { stripAnsiFromErrors } from './utils/common';

export const parseCtrfFile = (filePath: string): CtrfReport => {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let result: CtrfReport = JSON.parse(fileContent);
    result = stripAnsiFromErrors(result);
    return result;
};
