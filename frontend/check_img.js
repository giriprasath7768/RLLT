const fs = require('fs');
const zlib = require('zlib');

// Very basic PNG parser just to find the IDAT chunks and parse the first few non-transparent pixels.
// Since it's too complex to write a full PNG parser, I'll just use a python script with a downloaded library if possible.
