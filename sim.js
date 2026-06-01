const fs = require('fs');

function parseTime(t) {
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
}

const distributeBooks = (booksArr, daysOutCount) => {
    if (!booksArr || !booksArr.length) return Array.from({ length: daysOutCount }, () => null);
    let allChaps = [];
    for (let b of booksArr) {
        let count = b.chaps;
        for (let i=1; i<=count; i++) {
            allChaps.push({
                _bookAbbr: b.short_form,
                chapter_number: i,
                art: b.artPerChap,
                verse_count: 30
            });
        }
    }
    if (!allChaps.length) return Array.from({ length: daysOutCount }, () => null);

    if (allChaps.length < daysOutCount) {
        const daysOut = [];
        for (let day = 0; day < daysOutCount; day++) {
            const c = allChaps[day % allChaps.length];
            const portionStr = `${c._bookAbbr} ${c.chapter_number}`;
            const segART = c.art;
            let timeStr = `${segART}m`;
            daysOut.push({ portion: portionStr, time: segART, timeStr: timeStr, timeFloat: segART, chapCount: 1, verseCount: c.verse_count || 0 });
        }
        return daysOut;
    }

    let cum = [], sum = 0;
    for (let c of allChaps) { sum += c.art; cum.push(sum); }
    const totalART = sum;
    const daysOut = [];
    let lastChapterIndex = -1;
    let overflowDayIndex = 0;

    for (let day = 1; day <= daysOutCount; day++) {
        const target = (day / daysOutCount) * totalART;
        let bestIdx = lastChapterIndex;
        let minDiffLocal = Infinity;
        for (let i = lastChapterIndex + 1; i < allChaps.length; i++) {
            const diff = Math.abs(cum[i] - target);
            if (diff <= minDiffLocal) { minDiffLocal = diff; bestIdx = i; } else break;
        }
        if (day === daysOutCount) bestIdx = allChaps.length - 1;

        if (bestIdx > lastChapterIndex) {
            let portionStr = "";
            const segments = [];
            let currentBook = allChaps[lastChapterIndex + 1]._bookAbbr;
            let currentStartCh = allChaps[lastChapterIndex + 1].chapter_number;
            let currentEndCh = currentStartCh;

            for (let i = lastChapterIndex + 2; i <= bestIdx; i++) {
                const c = allChaps[i];
                if (c._bookAbbr === currentBook) {
                    currentEndCh = c.chapter_number;
                } else {
                    segments.push(currentStartCh === currentEndCh ? `${currentBook} ${currentStartCh}` : `${currentBook} ${currentStartCh}-${currentEndCh}`);
                    currentBook = c._bookAbbr;
                    currentStartCh = c.chapter_number;
                    currentEndCh = c.chapter_number;
                }
            }
            segments.push(currentStartCh === currentEndCh ? `${currentBook} ${currentStartCh}` : `${currentBook} ${currentStartCh}-${currentEndCh}`);
            portionStr = segments.join(', ');

            const segART = cum[bestIdx] - (lastChapterIndex >= 0 ? cum[lastChapterIndex] : 0);
            let timeStr = `${segART}m`;

            daysOut.push({ portion: portionStr, time: segART, timeStr: timeStr, timeFloat: segART, chapCount: (bestIdx - lastChapterIndex), verseCount: 0 });
            lastChapterIndex = bestIdx;
        } else {
            const c = allChaps[overflowDayIndex % allChaps.length];
            const portionStr = `${c._bookAbbr} ${c.chapter_number}`;
            const segART = c.art;
            let timeStr = `${segART}m`;
            daysOut.push({ portion: portionStr, time: segART, timeStr: timeStr, timeFloat: segART, chapCount: 1, verseCount: c.verse_count || 0 });
            overflowDayIndex++;
        }
    }
    return daysOut;
};

// Simulate
const booksArr = [{short_form: 'PRO', chaps: 31, artPerChap: 3}];
console.log("ChartLength 5:", distributeBooks(booksArr, 5));
console.log("ChartLength 260:", distributeBooks(booksArr, 260).slice(0, 5));
