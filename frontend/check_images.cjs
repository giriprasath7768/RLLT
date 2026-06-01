const fs = require('fs');
const PNG = require('pngjs').PNG;

function checkImage(file) {
    const data = fs.readFileSync(file);
    const png = PNG.sync.read(data);
    
    let top = png.height, bottom = 0, left = png.width, right = 0;
    
    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;
            const a = png.data[idx + 3];
            if (a > 20) {
                if (y < top) top = y;
                if (y > bottom) bottom = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
    }
    console.log(file, {width: png.width, height: png.height, top, bottom, left, right, cropWidth: right - left + 1, cropHeight: bottom - top + 1});
}

checkImage('public/glodenbuttonbg.png');
checkImage('public/woodenbuttonbg.png');
checkImage('public/copperbuttonbg.png');
