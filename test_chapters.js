const http = require('http');

http.get('http://localhost:8000/api/books', (res1) => {
    let data1 = '';
    res1.on('data', chunk => data1 += chunk);
    res1.on('end', () => {
        const books = JSON.parse(data1);
        
        http.get('http://localhost:8000/api/chapters', (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2 += chunk);
            res2.on('end', () => {
                const chapters = JSON.parse(data2);
                
                for (const book of books) {
                    const chaps = chapters.filter(c => c.book_id === book.id);
                    if (chaps.length === 0) {
                        console.log(`BOOK HAS NO CHAPTERS: ${book.name} (ID: ${book.id})`);
                    }
                }
                console.log("DONE CHECKING CHAPTERS");
            });
        });
    });
});
