const fs = require('fs');
const http = require('http');

const isBookMatch = (bookCode, book) => {
    if (book.short_form && book.short_form.trim().toUpperCase() === bookCode) return true;
    
    const nameStr = book.name.toUpperCase().replace(/\s+/g, '');
    const code = bookCode.toUpperCase();
    
    if (code === "JDG" && (nameStr.startsWith("JUDG") || nameStr.startsWith("JDG"))) return true;
    if (code === "SOS" && (nameStr.startsWith("SONG") || nameStr.startsWith("CANTICLES") || nameStr.startsWith("SOS"))) return true;
    if (code === "PHP" && (nameStr.startsWith("PHILIP") || nameStr.startsWith("PHP"))) return true;
    if (code === "PHM" && (nameStr.startsWith("PHILEM") || nameStr.startsWith("PHM"))) return true;
    
    if (code === "1JN" && (nameStr.startsWith("1JO") || nameStr.startsWith("1STJO") || nameStr.startsWith("IJO") || nameStr.startsWith("1JN"))) return true;
    if (code === "2JN" && (nameStr.startsWith("2JO") || nameStr.startsWith("2NDJO") || nameStr.startsWith("IIJO") || nameStr.startsWith("2JN"))) return true;
    if (code === "3JN" && (nameStr.startsWith("3JO") || nameStr.startsWith("3RDJO") || nameStr.startsWith("IIIJO") || nameStr.startsWith("3JN"))) return true;

    const map = {
        "1SA": "1SAM", "2SA": "2SAM",
        "1KI": "1KIN", "2KI": "2KIN",
        "1CH": "1CHR", "2CH": "2CHR",
        "1TH": "1THE", "2TH": "2THE",
        "1TI": "1TIM", "2TI": "2TIM",
        "1PE": "1PET", "2PE": "2PET",
        "PSA": "PSALM", "NAM": "NAHUM", "NAH": "NAHUM"
    };
    
    if (map[code] && nameStr.startsWith(map[code])) return true;
    
    const STANDARD_BOOKS = [
        "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", 
        "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", 
        "ECC", "SOS", "ISA", "JER", "LAM", "EZE", "DAN", "HOS", "JOE", "AMO", 
        "OBA", "JON", "MIC", "NAH", "HAB", "ZEP", "HAG", "ZEC", "MAL",
        "MAT", "MAR", "LUK", "JOH", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", 
        "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAM", 
        "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
    ];

    const standardIndex = STANDARD_BOOKS.indexOf(code) + 1;
    if (book.id === standardIndex) return true;

    return nameStr.startsWith(code.replace(/[^A-Z0-9]/g, ''));
};

const STANDARD_BOOKS = [
    "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", 
    "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", 
    "ECC", "SOS", "ISA", "JER", "LAM", "EZE", "DAN", "HOS", "JOE", "AMO", 
    "OBA", "JON", "MIC", "NAH", "HAB", "ZEP", "HAG", "ZEC", "MAL",
    "MAT", "MAR", "LUK", "JOH", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", 
    "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAM", 
    "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
];

http.get('http://localhost:8000/api/books', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const booksDB = JSON.parse(data);
        for (const code of STANDARD_BOOKS) {
            const match = booksDB.find(b => isBookMatch(code, b));
            if (!match) {
                console.log(`FAILED TO MATCH: ${code}`);
            } else {
                // Check if it matched the WRONG book
                if (booksDB.filter(b => isBookMatch(code, b)).length > 1) {
                    console.log(`MULTIPLE MATCHES FOR ${code}`);
                }
            }
        }
        console.log("DONE MATCHING");
    });
});
