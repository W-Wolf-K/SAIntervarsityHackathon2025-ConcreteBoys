const { connectDB, closeDB } = require('./database');
let userCol = 'users';

// Helper functions
function isValidEmailFormat(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

function isValidUsernameFormat(username) {
    return typeof username === 'string' && username.length >= 3;
}

function isValidPassword(password) {
    // Minimum 6 chars, at least 1 uppercase, 1 lowercase, 1 number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return typeof password === 'string' && regex.test(password);
}

async function isEmailUnique(email, db) {
    const collection = db.collection(userCol);
    const existing = await collection.findOne({ email });
    if (existing) {
        console.error('Email already exists');
        return false;
    }
    return true;
}

async function isUsernameUnique(username, db) {
    const collection = db.collection(userCol);
    const existing = await collection.findOne({ username });
    if (existing) {
        console.error('Username already exists');
        return false;
    }
    return true;
}

// Insert user
async function insertOneUser(email, username, password) {
    if (!isValidEmailFormat(email)) {
        console.error('Invalid email format');
        return null;
    }
    if (!isValidUsernameFormat(username)) {
        console.error('Username must be at least 3 characters');
        return null;
    }
    if (!isValidPassword(password)) {
        console.error('Password must be at least 6 characters and contain upper/lowercase letters and a number');
        return null;
    }

    const db = await connectDB();
    try {
        const emailUnique = await isEmailUnique(email, db);
        const usernameUnique = await isUsernameUnique(username, db);
        if (!emailUnique || !usernameUnique) return null;

        const data = {
            username,
            email,
            password,
            groups: [],
            events: [],
            totalSpent: 0
        };

        const result = await db.collection(userCol).insertOne(data);
        console.log(`Inserted document with _id: ${result.insertedId}`);
        return result.insertedId;
    } catch (err) {
        console.error('Insert failed:', err);
        return null;
    } finally {
        await closeDB();
    }
}

// how to use
(async () => {
    await insertOneUser("testemail@gmail.com", "testPerson", "Abc123");
})();
