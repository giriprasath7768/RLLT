const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/StudentReport.jsx', 'utf8');

let start = code.indexOf('{/* Player Interface Replacement */}');
let endMarker = '                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n            </div>\r\n        </div>\r\n    );\r\n};\r\n\r\nexport default StudentReport;';
let fallbackEndMarker = '                        </div>\n                    </div>\n                </div>\n\n            </div>\n        </div>\n    );\n};\n\nexport default StudentReport;';

let end = code.lastIndexOf(endMarker);
if (end === -1) {
    end = code.lastIndexOf(fallbackEndMarker);
}

if (start > -1 && end > -1) {
    let replaced = code.substring(0, start) + '{/* Static Component Replacement */}\n                        <div className="flex flex-col flex-1 bg-black overflow-hidden relative border-t-2 border-[#1B2633]">\n                            <img src="/player-mockup.png?v=9" alt="Player Mockup" className="w-full h-full object-fill opacity-95" />\n                        </div>\n' + code.substring(end);
    fs.writeFileSync('frontend/src/pages/admin/StudentReport.jsx', replaced, 'utf8');
    console.log("Success! File replaced.");
} else {
    console.error("Failed to find start or end bounds.");
    console.log(start, end, code.length);
}
