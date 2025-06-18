const { readFile } = require('node:fs/promises');
const path = require('node:path');

exports.read = async (fileName) => {
    const fullPath = path.resolve(__dirname, fileName);
    try {
        return await readFile(fullPath, 'utf8');
    } catch (error) {
        throw new Error(`SQL file ${fullPath} does not exist.`);
    }
};
