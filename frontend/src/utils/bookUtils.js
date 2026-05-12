const BIBLE_BOOKS_AUTHORS = {
    "GEN": "Moses", "EXO": "Moses", "LEV": "Moses", "NUM": "Moses", "DEU": "Moses",
    "JOS": "Joshua", "JDG": "Samuel", "RUT": "Samuel", "1SA": "Samuel", "2SA": "Samuel",
    "1KI": "Jeremiah", "2KI": "Jeremiah", "1CH": "Ezra", "2CH": "Ezra", "EZR": "Ezra", "NEH": "Ezra",
    "EST": "Unknown", "JOB": "Unknown", "PSA": "David", "PRO": "Solomon", "ECC": "Solomon", "SOS": "Solomon",
    "ISA": "Isaiah", "JER": "Jeremiah", "LAM": "Jeremiah", "EZE": "Ezekiel", "DAN": "Daniel",
    "HOS": "Hosea", "JOE": "Joel", "AMO": "Amos", "OBA": "Obadiah", "JON": "Jonah",
    "MIC": "Micah", "NAH": "Nahum", "HAB": "Habakkuk", "ZEP": "Zephaniah", "HAG": "Haggai",
    "ZEC": "Zechariah", "MAL": "Malachi",
    "MAT": "Matthew", "MAR": "Mark", "LUK": "Luke", "JOH": "John", "ACT": "Luke",
    "ROM": "Paul", "1CO": "Paul", "2CO": "Paul", "GAL": "Paul", "EPH": "Paul",
    "PHP": "Paul", "COL": "Paul", "1TH": "Paul", "2TH": "Paul", "1TI": "Paul",
    "2TI": "Paul", "TIT": "Paul", "PHM": "Paul", "HEB": "Unknown", "JAM": "James",
    "1PE": "Peter", "2PE": "Peter", "1JN": "John", "2JN": "John", "3JN": "John",
    "JUD": "Jude", "REV": "John"
};

const BIBLE_BOOKS_ALIASES = {
    "GENESIS": "GEN", "EXODUS": "EXO", "LEVITICUS": "LEV", "NUMBERS": "NUM", "DEUTERONOMY": "DEU",
    "JOSHUA": "JOS", "JUDGES": "JDG", "RUTH": "RUT", "1SAMUEL": "1SA", "2SAMUEL": "2SA",
    "1KINGS": "1KI", "2KINGS": "2KI", "1CHRONICLES": "1CH", "2CHRONICLES": "2CH",
    "EZRA": "EZR", "NEHEMIAH": "NEH", "ESTHER": "EST", "JOB": "JOB", "PSALMS": "PSA", "PSALM": "PSA",
    "PROVERBS": "PRO", "ECCLESIASTES": "ECC", "SONGOFSOLOMON": "SOS", "ISAIAH": "ISA",
    "JEREMIAH": "JER", "LAMENTATIONS": "LAM", "EZEKIEL": "EZE", "DANIEL": "DAN",
    "HOSEA": "HOS", "JOEL": "JOE", "AMOS": "AMO", "OBADIAH": "OBA", "JONAH": "JON",
    "MICAH": "MIC", "NAHUM": "NAH", "HABAKKUK": "HAB", "ZEPHANIAH": "ZEP", "HAGGAI": "HAG",
    "ZECHARIAH": "ZEC", "MALACHI": "MAL",
    "MATTHEW": "MAT", "MARK": "MAR", "LUKE": "LUK", "JOHN": "JOH", "ACTS": "ACT",
    "ROMANS": "ROM", "1CORINTHIANS": "1CO", "2CORINTHIANS": "2CO", "GALATIANS": "GAL",
    "EPHESIANS": "EPH", "PHILIPPIANS": "PHP", "COLOSSIANS": "COL", "1THESSALONIANS": "1TH",
    "2THESSALONIANS": "2TH", "1TIMOTHY": "1TI", "2TIMOTHY": "2TI", "TITUS": "TIT",
    "PHILEMON": "PHM", "HEBREWS": "HEB", "JAMES": "JAM", "1PETER": "1PE", "2PETER": "2PE",
    "1JOHN": "1JN", "2JOHN": "2JN", "3JOHN": "3JN", "JUDE": "JUD", "REVELATION": "REV"
};

export const extractBooksAndAuthors = (inputData) => {
    if (!inputData) return { bks: '6 6', art: '4 0 +' };

    const uniqueBooks = new Set();

    const extractStrings = (obj) => {
        if (typeof obj === 'string') {
            const words = obj.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').split(/\s+/);
            for (const word of words) {
                if (!word) continue;
                if (BIBLE_BOOKS_AUTHORS[word]) {
                    uniqueBooks.add(word);
                } else if (BIBLE_BOOKS_ALIASES[word]) {
                    uniqueBooks.add(BIBLE_BOOKS_ALIASES[word]);
                } else {
                    for (const alias in BIBLE_BOOKS_ALIASES) {
                        if (word === alias) {
                            uniqueBooks.add(BIBLE_BOOKS_ALIASES[alias]);
                            break;
                        }
                    }
                }
            }
        } else if (Array.isArray(obj)) {
            obj.forEach(item => extractStrings(item));
        } else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                // Ignore keys that are unlikely to contain book info to speed up
                if (key.includes('time') || key.includes('verse') || key.includes('chap') || key === 'id' || key === 'day') continue;
                extractStrings(obj[key]);
            }
        }
    };

    extractStrings(inputData);

    if (uniqueBooks.size === 0) {
        return { bks: '6 6', art: '4 0 +' };
    }

    const uniqueAuthors = new Set();
    let hasUnknown = false;

    uniqueBooks.forEach(bk => {
        const author = BIBLE_BOOKS_AUTHORS[bk];
        if (!author || author === "Unknown") {
            hasUnknown = true;
        } else {
            uniqueAuthors.add(author);
        }
    });

    const bksStr = uniqueBooks.size.toString().split('').join(' ');
    
    let artStr = uniqueAuthors.size.toString().split('').join(' ');
    if (hasUnknown) {
        artStr += ' +';
    }

    return { bks: bksStr, art: artStr };
};
