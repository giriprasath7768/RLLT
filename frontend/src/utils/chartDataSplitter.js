export const parseTime = (t) => {
    if (!t) return 0;
    t = t.toString().trim().toLowerCase();
    if (t.includes('h')) {
        const match = t.match(/(\d+)h\.?(\d+)m?/);
        if (match) {
            return (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0);
        }
    } else if (t.includes('.')) {
        const parts = t.split('.');
        let sStr = parts[1] || "0";
        if (sStr.length === 1) sStr += '0'; 
        return parseInt(parts[0] || 0) + (parseInt(sStr.substring(0, 2)) / 60);
    } else {
        return parseInt(t) || 0;
    }
    return 0;
};

export const formatHrMin = (mins) => {
    if (!mins) return "";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h > 0 && m > 0) return `${h}h${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
};

export const formatHrMinDetailed = (mins) => {
    if (!mins) return "";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h > 0 && m > 0) return `${h}h${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
};

export const buildParsers = (booksDB, chaptersDB) => {
    const sortedBooks = [...booksDB].sort((a,b) => {
        const aLen = (a.short_form || a.name).length;
        const bLen = (b.short_form || b.name).length;
        return bLen - aLen;
    });

    const extractChapters = (b, remainder) => {
        let startCh = 1;
        let endCh = b.total_chapters || 1;
        if (remainder) {
             const match = remainder.match(/^(\d+)(?:[-\s]+(\d+))?$/);
             if (match) {
                 startCh = parseInt(match[1]);
                 endCh = match[2] ? parseInt(match[2]) : startCh;
             }
        }
        return { book: b, startCh, endCh };
    };

    const parsePart = (str) => {
        const uStr = str.toUpperCase();
        
        for (let b of sortedBooks) {
            const abbr = b.short_form ? b.short_form.toUpperCase() : null;
            const bname = b.name ? b.name.toUpperCase() : null;
            
            if (abbr && uStr.startsWith(abbr)) return extractChapters(b, str.substring(abbr.length).trim());
            if (bname && uStr.startsWith(bname)) return extractChapters(b, str.substring(bname.length).trim());
        }
        
        for (let b of sortedBooks) {
            if (!b.name) continue;
            const bname = b.name.toUpperCase();
            let prefixes = [];
            
            if (bname.length >= 3) prefixes.push(bname.substring(0, 3));
            
            if (/^\d/.test(bname)) {
                const parts = bname.split(' ');
                if (parts.length >= 2) {
                    const num = parts[0]; 
                    const word = parts[1]; 
                    if (word.length >= 3) {
                        prefixes.push(`${num} ${word.substring(0, 3)}`);
                        prefixes.push(`${num}${word.substring(0, 3)}`);
                    }
                    if (word.length >= 2) {
                        prefixes.push(`${num} ${word.substring(0, 2)}`);
                        prefixes.push(`${num}${word.substring(0, 2)}`);
                    }
                }
            }
            
            prefixes.sort((x, y) => y.length - x.length);
            
            for (let pf of prefixes) {
                if (uStr.startsWith(pf)) {
                    const remainder = str.substring(pf.length).trim();
                    if (/^\d/.test(remainder) || remainder === "") {
                        return extractChapters(b, remainder);
                    }
                }
            }
        }
        return null;
    };

    const processS3String = (s3b) => {
        if (!s3b) return [];
        const parts = s3b.split(',').map(p => p.trim());
        let allChapters = [];
        parts.forEach(part => {
            const parsed = parsePart(part);
            if (parsed) {
                for (let c = parsed.startCh; c <= parsed.endCh; c++) {
                    allChapters.push({ book: parsed.book, chapter: c });
                }
            }
        });
        return allChapters;
    };

    const buildFromChapters = (chapArray) => {
        if (chapArray.length === 0) return { str: '', verses: 0, art: 0, chaps: 0 };
        let segments = [];
        let curSeg = null;
        let totalVerses = 0;
        let totalArtFloat = 0;
        
        chapArray.forEach((c) => {
            if (!curSeg) {
                curSeg = { book: c.book, start: c.chapter, end: c.chapter };
            } else if (curSeg.book.id === c.book.id && c.chapter === curSeg.end + 1) {
                curSeg.end = c.chapter;
            } else {
                segments.push(curSeg);
                curSeg = { book: c.book, start: c.chapter, end: c.chapter };
            }
            
            const chapObj = chaptersDB.find(cdb => cdb.book_id === c.book.id && cdb.chapter_number === c.chapter);
            if (chapObj) {
                totalVerses += chapObj.verse_count || 0;
                if (chapObj.art != null) {
                     const valStr = chapObj.art.toString();
                     if (valStr.includes('.')) {
                         const parts = valStr.split('.');
                         let sStr = parts[1] || "0";
                         if (sStr.length === 1) sStr += '0';
                         totalArtFloat += parseInt(parts[0] || 0) + (parseInt(sStr.substring(0, 2)) / 60);
                     } else {
                         totalArtFloat += parseFloat(valStr) || 0;
                     }
                }
            }
        });
        if (curSeg) segments.push(curSeg);
        
        const str = segments.map(seg => {
            const abbr = seg.book.short_form || seg.book.name;
            if (seg.start === seg.end) return `${abbr} ${seg.start}`;
            return `${abbr} ${seg.start}-${seg.end}`;
        }).join(', ');
    
        return { str, verses: totalVerses, art: totalArtFloat, chaps: chapArray.length };
    };

    return { processS3String, buildFromChapters };
};

export const splitS3Data = (chunks, booksDB, chaptersDB) => {
    if (!booksDB || !chaptersDB || booksDB.length === 0) return { morningEveningChunks: [] };

    const { processS3String, buildFromChapters } = buildParsers(booksDB, chaptersDB);

    // Deep clone chunks for safe mutation
    const morningEveningChunks = JSON.parse(JSON.stringify(chunks));

    for (let i = 0; i < chunks.length; i++) {
        for (let j = 0; j < chunks[i].days.length; j++) {
            const origDay = chunks[i].days[j];
            const targetDay = morningEveningChunks[i].days[j];

            targetDay.m3b_morning = '';
            targetDay.m3t_morning = '';
            targetDay.m3b_evening = '';
            targetDay.m3t_evening = '';

            if (!origDay.m3b) continue;

            const m3Chapters = processS3String(origDay.m3b);
            if (m3Chapters.length === 0) continue;

            const halfIndex = Math.ceil(m3Chapters.length / 2);
            const morningChapters = m3Chapters.slice(0, halfIndex);
            const eveningChapters = m3Chapters.slice(halfIndex);

            const mornStats = buildFromChapters(morningChapters);
            const eveStats = buildFromChapters(eveningChapters);

            targetDay.m3b_morning = mornStats.str;
            targetDay.m3t_morning = formatHrMinDetailed(mornStats.art);
            
            targetDay.m3b_evening = eveStats.str;
            targetDay.m3t_evening = formatHrMinDetailed(eveStats.art);
        }
    }

    return { morningEveningChunks };
};

export const splitS4Data = (chunks, booksDB, chaptersDB) => {
    if (!booksDB || !chaptersDB || booksDB.length === 0) return { morningEveningChunks: [] };

    const { processS3String, buildFromChapters } = buildParsers(booksDB, chaptersDB);

    const morningEveningChunks = JSON.parse(JSON.stringify(chunks));

    for (let i = 0; i < chunks.length; i++) {
        for (let j = 0; j < chunks[i].days.length; j++) {
            const origDay = chunks[i].days[j];
            const targetDay = morningEveningChunks[i].days[j];

            targetDay.m4b_morning = '';
            targetDay.m4t_morning = '';
            targetDay.m4b_evening = '';
            targetDay.m4t_evening = '';

            if (!origDay.m4b) continue;

            const m4Chapters = processS3String(origDay.m4b);
            if (m4Chapters.length === 0) continue;

            const halfIndex = Math.ceil(m4Chapters.length / 2);
            const morningChapters = m4Chapters.slice(0, halfIndex);
            const eveningChapters = m4Chapters.slice(halfIndex);

            const mornStats = buildFromChapters(morningChapters);
            const eveStats = buildFromChapters(eveningChapters);

            targetDay.m4b_morning = mornStats.str;
            targetDay.m4t_morning = formatHrMinDetailed(mornStats.art);
            
            targetDay.m4b_evening = eveStats.str;
            targetDay.m4t_evening = formatHrMinDetailed(eveStats.art);
        }
    }

    return { morningEveningChunks };
};




export const parseDayForOilChart = (dayObj, booksDB, chaptersDB) => {
    if (!booksDB || !chaptersDB || booksDB.length === 0) return [];
    
    const { processS3String, buildFromChapters } = buildParsers(booksDB, chaptersDB);
    const rows = [];

    const addPart = (partStr) => {
        if (!partStr) return;
        const chapters = processS3String(partStr);
        if (chapters && chapters.length > 0) {
            const stats = buildFromChapters(chapters);
            rows.push({
                books: stats.str,
                chaps: stats.chaps,
                verses: stats.verses,
                time: Math.round(stats.art).toString()
            });
        }
    };

    addPart(dayObj.m1b);
    addPart(dayObj.m2b);

    if (dayObj.m3b) {
        const m3Chapters = processS3String(dayObj.m3b);
        if (m3Chapters && m3Chapters.length > 0) {
            const halfIndex = Math.ceil(m3Chapters.length / 2);
            const morningChapters = m3Chapters.slice(0, halfIndex);
            const eveningChapters = m3Chapters.slice(halfIndex);

            if (morningChapters.length > 0) {
                const mStats = buildFromChapters(morningChapters);
                rows.push({
                    books: mStats.str,
                    chaps: mStats.chaps,
                    verses: mStats.verses,
                    time: Math.round(mStats.art).toString()
                });
            }
            if (eveningChapters.length > 0) {
                const eStats = buildFromChapters(eveningChapters);
                rows.push({
                    books: eStats.str,
                    chaps: eStats.chaps,
                    verses: eStats.verses,
                    time: Math.round(eStats.art).toString()
                });
            }
        }
    }

    return rows;
};
