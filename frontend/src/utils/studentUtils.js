export const calculateStudentLevel = (dob) => {
    if (!dob) return { category: 'Uncategorized', stage: 'Out of Range', age: '-' };

    const today = new Date();
    const birthDate = new Date(dob);

    // Calculate current age
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age >= 13 && age <= 37) {
        let stage;
        if (age <= 17) stage = '1';
        else if (age <= 22) stage = '2';
        else if (age <= 27) stage = '3';
        else if (age <= 32) stage = '4';
        else stage = '5';
        return { category: 'A', stage, age };
    } else if (age >= 38 && age <= 62) {
        let stage;
        if (age <= 42) stage = '1';
        else if (age <= 47) stage = '2';
        else if (age <= 52) stage = '3';
        else if (age <= 57) stage = '4';
        else stage = '5';
        return { category: 'B', stage, age };
    } else if (age >= 63 && age <= 87) {
        let stage;
        if (age <= 67) stage = '1';
        else if (age <= 72) stage = '2';
        else if (age <= 77) stage = '3';
        else if (age <= 82) stage = '4';
        else stage = '5';
        return { category: 'C', stage, age };
    }

    return { category: 'Uncategorized', stage: 'Out of Range', age };
};
