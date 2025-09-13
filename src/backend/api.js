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

function verifyPassword(password, storedHash) {
    const stored = password
    return stored === storedHash;
}

// Insert user
async function signIn(email, username, password) {
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
            username: username,
            email: email,
            password: password,
            groups: [],
            events: [],
            totalSpent: 0,
            overallBudget: 0 // balance
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

//log-in User
async function loginUser(username, password) {
    const db = await connectDB();
    try {
        const user = await db.collection(userCol).findOne({ username });
        if (!user) {
            console.error("User not found");
            return null;
        }

        if (verifyPassword(password, user.password)) {
            console.log("Login successful!");
            return user;
        } else {
            console.error("Invalid password");
            return null;
        }
    } catch (err) {
        console.error("Login failed:", err);
        return null;
    } finally {
        await closeDB();
    }
}


//User: Update User Profile
//Email
async function updateEmail(currentUsername, newEmail) {
    if (!isValidEmailFormat(newEmail)) {
        console.error("Invalid email format");
        return null;
    }

    const db = await connectDB();
    try {
        const collection = db.collection(userCol);

        // Check if email is taken by another user
        const existing = await collection.findOne({ email: newEmail });
        if (existing && existing.username !== currentUsername) {
            console.error("Email already exists");
            return null;
        }

        const result = await collection.updateOne(
            { username: currentUsername },
            { $set: { email: newEmail } }
        );

        console.log(`Updated ${result.modifiedCount} user(s) email`);
        return result.modifiedCount;
    } catch (err) {
        console.error("Update email failed:", err);
        return null;
    } finally {
        await closeDB();
    }
}
//users
async function updateUsername(currentUsername, newUsername) {
    if (!isValidUsernameFormat(newUsername)) {
        console.error("Username must be at least 3 characters");
        return null;
    }

    const db = await connectDB();
    try {
        const collection = db.collection(userCol);

        // Check if username is taken
        const existing = await collection.findOne({ username: newUsername });
        if (existing) {
            console.error("Username already exists");
            return null;
        }

        const result = await collection.updateOne(
            { username: currentUsername },
            { $set: { username: newUsername } }
        );

        console.log(`Updated ${result.modifiedCount} user(s) username`);
        return result.modifiedCount;
    } catch (err) {
        console.error("Update username failed:", err);
        return null;
    } finally {
        await closeDB();
    }
}
//password
async function updatePassword(username, newPassword) {
    if (!isValidPassword(newPassword)) {
        console.error("Password must be at least 6 characters, contain uppercase/lowercase letters and a number");
        return null;
    }

    const db = await connectDB();
    try {
        const collection = db.collection(userCol);

        const stored = newPassword;

        const result = await collection.updateOne(
            { username },
            { $set: { password: stored } }
        );

        console.log(`Updated ${result.modifiedCount} user(s) password`);
        return result.modifiedCount;
    } catch (err) {
        console.error("Update password failed:", err);
        return null;
    } finally {
        await closeDB();
    }
}

//User: Budget (personalised)
async function getOverallBudget(username) {
    const db = await connectDB(); 
    try {
        const collection = db.collection(userCol);

        // Find the user
        const existing = await collection.findOne({ username: username });
        if (!existing) {
            console.error("User does not exist");
            return null;
        }

        const budget = existing.overallBudget ?? 0; // fallback to 0 if not set
        console.log(`Budget for ${username}:`, budget);
        return budget;
    } catch (err) {
        console.error("Failed to get budget:", err);
        return null;
    } finally {
        await closeDB();
    }
}

async function setOverallBudget(username, budget) {
    if (typeof budget !== 'number' || budget < 0) {
        console.error("Budget must be a non-negative number");
        return null;
    }

    const db = await connectDB();
    try {
        const collection = db.collection(userCol);

        // Check if user exists
        const existing = await collection.findOne({ username });
        if (!existing) {
            console.error("User does not exist");
            return null;
        }

        // Update the overallBudget
        const result = await collection.updateOne(
            { username },
            { $set: { overallBudget: budget } }
        );

        console.log(`Updated budget for ${username}: ${budget}`);
        return result.modifiedCount;
    } catch (err) {
        console.error("Failed to set budget:", err);
        return null;
    } finally {
        await closeDB();
    }
}

async function updateOverallBudget(username, newBudget) {
    // Validate newBudget
    if (typeof newBudget !== 'number' || newBudget < 0) {
        console.error("New budget must be a non-negative number");
        return null;
    }

    const db = await connectDB();
    try {
        const collection = db.collection(userCol);

        // Check if user exists
        const existing = await collection.findOne({ username });
        if (!existing) {
            console.error("User does not exist");
            return null;
        }

        // Update the overallBudget
        const result = await collection.updateOne(
            { username },
            { $set: { overallBudget: newBudget } }
        );

        console.log(`Updated overallBudget for ${username} to ${newBudget}`);
        return result.modifiedCount;
    } catch (err) {
        console.error("Failed to update budget:", err);
        return null;
    } finally {
        await closeDB();
    }
}

// how to use
// (async () => {
//     await signIn("testemail@gmail.com", "testPerson", "Abc123");
// })();
// (async () => {
//     const a = await loginUser("tPerson", "aBc123"); // strings in quotes
//     if (a) {
//         console.log("Logged in:", a.username);
//     } else {
//         console.log("Login failed");
//     }
// })();

// (async () =>{
//     updatePassword("tPerson","aBc123");
// })()