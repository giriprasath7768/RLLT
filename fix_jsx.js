const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/StudentReport.jsx', 'utf8');

// Looking for the end of the Box 3 image div
let imgTagIdx = code.indexOf('<img src="/player-mockup.png');
if (imgTagIdx > -1) {
    let divEndIdx = code.indexOf('</div>', imgTagIdx);
    if (divEndIdx > -1) {
        // Strip everything after the first </div> that closes the image wrapper
        // and replace it with the correct closing structure for the component
        let goodEnd = `                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentReport;
`;
        let newCode = code.substring(0, divEndIdx) + goodEnd;
        fs.writeFileSync('frontend/src/pages/admin/StudentReport.jsx', newCode, 'utf8');
        console.log("Syntax fixed!");
    } else {
        console.log("Could not find closing div for image");
    }
} else {
    console.log("Could not find image tag");
}
