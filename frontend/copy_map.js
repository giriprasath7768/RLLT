const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/HP/.gemini/antigravity/brain/54e1ef7b-0171-4add-b14c-3bca419f8c82/media__1778214193381.png';
const destPath = 'i:/RLLT/Webapp/frontend/public/map_scroll.png';

try {
    fs.copyFileSync(srcPath, destPath);
    console.log('File copied successfully');
} catch (err) {
    console.error('Error copying file:', err);
}
