const { connectDB, closeDB } = require('./database');
let userCol = 'users';
let eventCol = 'events';
// Helper functions
function generateId() {
    const letters = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz';
    const digits = '0123456789';

    let id = '';

    // 3 random letters
    for (let i = 0; i < 3; i++) {
        id += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // 3 random digits
    for (let i = 0; i < 3; i++) {
        id += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return id;
}

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
            userId: generateId(),
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

async function getUserEvents(username) {
    const db = await connectDB();
    try {
        const collection = db.collection(userCol);

        // Find the user
        const user = await collection.findOne({ username });
        if (!user) {
            console.error("User does not exist");
            return null;
        }

        const events = user.events ?? [];
        console.log(`Events for ${username}:`, events);
        return events;
    } catch (err) {
        console.error("Failed to get user events:", err);
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
//delete acc 
async function deleteAccount(username, password) {
    const db = await connectDB();
    try {
        const collection = db.collection(userCol);

        // Find the user
        const user = await collection.findOne({ username });
        if (!user) {
            console.error("User does not exist");
            return null;
        }

        // Verify password
        if (!verifyPassword(password, user.password)) {
            console.error("Invalid password. Account deletion denied.");
            return null;
        }

        // Delete user
        const result = await collection.deleteOne({ username });
        console.log(`Deleted ${result.deletedCount} user(s)`);
        return result.deletedCount;
    } catch (err) {
        console.error("Failed to delete account:", err);
        return null;
    } finally {
        await closeDB();
    }
}

//User: Budget (personalised)
async function getUserOverallBudget(username) {
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

//getAllDetails
async function getUserDetails(username) {
    const db = await connectDB();
    try {
        const collection = db.collection(userCol);

        // Find the user
        const user = await collection.findOne({ username });
        if (!user) {
            console.error("User does not exist");
            return null;
        }

        // Return all user details
        // You can filter out sensitive info like password if needed
        const { password, ...details } = user; // exclude password
        console.log("User details:", details);
        return details;
    } catch (err) {
        console.error("Failed to get user details:", err);
        return null;
    } finally {
        await closeDB();
    }
}

//Events
async function isEventNameUnique(eventName) {
    const db = await connectDB();
    try {
        const events = db.collection(eventCol);
        const existing = await events.findOne({ name: eventName });
        return !existing;
    } catch (err) {
        console.error("Failed to check event name:", err);
        return false;
    } finally {
        await closeDB();
    }
}

async function createEvent(username, eventName, budget = 0, date = null) {
    if (!eventName || typeof eventName !== "string" || eventName.trim().length < 3) {
        console.error("Event name must be at least 3 characters long");
        return null;
    }

    if (typeof budget !== "number" || budget < 0) {
        console.error("Budget must be a non-negative number");
        return null;
    }
    if(!(await isEventNameUnique(eventName))){
        console.log("Name has already been used, must be unique");
        return null;
    }
    const db = await connectDB();
    try {
        const users = db.collection(userCol);
        const events = db.collection(eventCol);

        const user = await users.findOne({ username });
        if (!user) {
            console.error("User does not exist");
            return null;
        }

        const eventId = generateId();
        const newEvent = {
            eventId,
            name: eventName,
            budget,
            date: date ? new Date(date) : null,
            participants: [
                {
                    username,
                    contribution: 0,
                    willingness: 0
                }
            ],
            createdBy: username,
            createdAt: new Date()
        };

        const result = await events.insertOne(newEvent);

        if (!result.insertedId) {
            console.error("Failed to insert event");
            return null;
        }

        const updateResult = await users.updateOne(
            { username },
            { $push: { events: eventId } }
        );

        if (updateResult.modifiedCount === 0) {
            console.warn("Event created but could not update user's events array");
        } else {
            console.log(`Event '${eventName}' created and linked to ${username}`);
        }

        return newEvent;
    } catch (err) {
        console.error("Create event failed:", err);
        return null;
    } finally {
        await closeDB();
    }
}

async function addUserToEvent(eventName, username) {
    if (!eventName) return null;

    const db = await connectDB();
    try {
        const users = db.collection(userCol);
        const events = db.collection(eventCol);

        const user = await users.findOne({ username });
        if (!user) return null;

        const event = await events.findOne({ name: eventName });
        if (!event) return null;

        event.participants = event.participants ?? [];
        if (event.participants.some(p => p.username === username)) return event;

        await events.updateOne(
            { name: eventName },
            { $push: { participants: { username, contribution: 0, willingness: 0 } } }
        );

        const userEvents = user.events ?? [];
        if (!userEvents.includes(event.eventId)) {
            await users.updateOne(
                { username },
                { $push: { events: event.eventId } }
            );
        }

        return await events.findOne({ name: eventName });
    } catch (err) {
        console.error("Failed to add user to event:", err);
        return null;
    } finally {
        await closeDB();
    }
}

async function removeUserFromEvent(eventName, username) {
    if (!eventName) return null;

    const db = await connectDB();
    try {
        const users = db.collection(userCol);
        const events = db.collection(eventCol);

        const user = await users.findOne({ username });
        if (!user) return null;

        const event = await events.findOne({ name: eventName });
        if (!event) return null;

        await events.updateOne(
            { name: eventName },
            { $pull: { participants: { username } } }
        );

        const userEvents = user.events ?? [];
        if (userEvents.includes(event.eventId)) {
            await users.updateOne(
                { username },
                { $pull: { events: event.eventId } }
            );
        }

        return await events.findOne({ name: eventName });
    } catch (err) {
        console.error("Failed to remove user from event:", err);
        return null;
    } finally {
        await closeDB();
    }
}

async function getEventDetails(eventName) {
    const db = await connectDB();
    try {
        const events = db.collection(eventCol);

        const event = await events.findOne({ name: eventName });
        if (!event) {
            console.error("Event does not exist");
            return null;
        }

        console.log("Event details:", event);
        return event;
    } catch (err) {
        console.error("Failed to get event details:", err);
        return null;
    } finally {
        await closeDB();
    }
}

async function getEventParticipants(eventName) {
    const db = await connectDB();
    try {
        const collection = db.collection(eventCol);

        // Find the event
        const event = await collection.findOne({ name: eventName });
        if (!event) {
            console.error("Event does not exist");
            return null;
        }

        const participants = event.participants ?? [];
        console.log(`Participants for event "${eventName}":`, participants);
        return participants;
    } catch (err) {
        console.error("Failed to get event participants:", err);
        return null;
    } finally {
        await closeDB();
    }
}

(async => getEventParticipants("Dinner"))()