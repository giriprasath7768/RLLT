
const booksDB = [
    { id: 1, name: "PROVERBS", short_form: "PRO" },
    { id: 2, name: "PSALMS", short_form: "PSA" },
    { id: 3, name: "GENESIS", short_form: "GEN" }
];

const initialBookRow = () => ({ id: Math.random(), book_id: null, chFrom: null, chTo: null });

const data = [
    { Day: 5, "S3 Book": "PROVERBS", "S3 From": 7, "S3 To": 14 },
    { Day: 5, "S3 Book": "GENESIS", "S3 From": 2, "S3 To": 7 },
    { Day: 5, "S1 Book": "PROVERBS", "S1 From": 5, "S2 Book": "PSALMS", "S2 From": 20, "S2 To": 24, "S3 Book": "PSALMS", "S3 From": 20, "S3 To": 24 }
];

const chartDays = 30;
const newConfig = Array.from({length: chartDays}, () => ({ s1: [], s2: [], s3: [] }));

data.forEach(row => {
    const normalized = {};
    Object.keys(row).forEach(k => {
        const cleanKey = k.toLowerCase().replace(/\s+/g, '');
        normalized[cleanKey] = row[k];
    });

    const dayVal = parseInt(normalized['day']) || 0;
    if (dayVal >= 1 && dayVal <= chartDays) {
        const dIdx = dayVal - 1;

        const parseSegment = (bkKey, fromKey, toKey) => {
            const rawBook = String(normalized[bkKey] || '').trim();
            if (!rawBook || rawBook === 'undefined') return null;
            
            const bookStr = rawBook.toLowerCase();
            const matchBook = booksDB.find(b => 
                b.name.toLowerCase() === bookStr || 
                (b.short_form && b.short_form.toLowerCase() === bookStr)
            );

            if (!matchBook) return null;
            
            return {
                id: Math.random(),
                book_id: matchBook.id,
                chFrom: parseInt(normalized[fromKey]) || null,
                chTo: parseInt(normalized[toKey]) || null
            };
        };

        const s1Bk = parseSegment('s1book', 's1from', 's1to');
        if (s1Bk) newConfig[dIdx].s1.push(s1Bk);
        
        const s2Bk = parseSegment('s2book', 's2from', 's2to');
        if (s2Bk) newConfig[dIdx].s2.push(s2Bk);
        
        const s3Bk = parseSegment('s3book', 's3from', 's3to');
        if (s3Bk) newConfig[dIdx].s3.push(s3Bk);
    }
});

console.log("Day 5 Result:");
console.log(JSON.stringify(newConfig[4], null, 2));
