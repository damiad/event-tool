// FILE: functions/index.js
//
// This is the main file for all your backend logic.
// It defines the Cloud Functions that will handle event registration,
// user data management, and the automated sorting of attendees.

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * --- User Profile Management ---
 * Triggered when a new user signs up.
 * Creates a corresponding document in the 'users' collection to store
 * their profile information and attendance history.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  // We only expect @google.com users, but this is a good practice.
  if (!email || !email.endsWith("@google.com")) {
    console.log(`Non-corporate user signed up and will be ignored: ${email}`);
    return null;
  }

  const userRef = db.collection("users").doc(uid);

  return userRef.set({
    uid,
    email,
    displayName,
    isOrganizer: false, // Default to not an organizer
    lastAttended: null, // null indicates they've never attended
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

/**
 * --- Event Registration ---
 * A callable function invoked by the frontend when a user clicks "Register".
 * It records their registration and their status (organizer or regular participant).
 */
exports.registerForEvent = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to register."
    );
  }

  const { eventId, isOrganizer } = data;
  const { uid, token } = context.auth; // token has user details like displayName

  if (!eventId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with an 'eventId'."
    );
  }

  // 2. Add registration to the sub-collection
  const registrationRef = db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .doc(uid);

  await registrationRef.set({
    uid,
    displayName: token.name || "Unknown User",
    registeredAt: admin.firestore.FieldValue.serverTimestamp(),
    isOrganizer: !!isOrganizer, // Convert to boolean
  });

  // Also, update the user's main profile if they are marking themselves as an organizer
  if (isOrganizer) {
    await db.collection("users").doc(uid).update({ isOrganizer: true });
  }

  return { success: true, message: "Successfully registered!" };
});

/**
 * --- Resign from Event ---
 * A callable function for when a user decides to leave an event.
 */
exports.resignFromEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }

  const { eventId } = data;
  const { uid } = context.auth;

  if (!eventId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Event ID is required."
    );
  }

  // Simply delete their registration document. The sorted list will update automatically
  // on the next run, or you could add more complex logic here to promote from the waitlist instantly.
  const registrationRef = db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .doc(uid);
  await registrationRef.delete();

  return { success: true, message: "Successfully resigned from the event." };
});

/**
 * --- Scheduled Attendee Sorting ---
 * This is the core logic of your application.
 * It runs automatically every night, finds events that need sorting,
 * and generates the final attendee and waiting lists based on your rules.
 */
exports.generateSortedLists = functions.pubsub
  .schedule("every day 01:00")
  .timeZone("Europe/Warsaw")
  .onRun(async (context) => {
    console.log("Running scheduled job: generateSortedLists");
    const today = new Date();

    // 1. Find all events that are not yet sorted.
    const eventsSnapshot = await db
      .collection("events")
      .where("listGenerated", "==", false)
      .get();

    if (eventsSnapshot.empty) {
      console.log("No events to sort.");
      return null;
    }

    // 2. Process each event
    for (const eventDoc of eventsSnapshot.docs) {
      const event = eventDoc.data();
      const eventDate = new Date(event.date); // Assuming one-time events for now

      // Check if it's time to sort this event (e.g., 2 days before)
      const daysUntilEvent = (eventDate - today) / (1000 * 60 * 60 * 24);
      // You would fetch 'generateListDaysBefore' from the event data itself
      const sortWindow = event.generateListDaysBefore || 2;

      if (daysUntilEvent > sortWindow) {
        continue; // Not time to sort this event yet
      }

      console.log(`Sorting event: ${event.description} (${eventDoc.id})`);

      // 3. Fetch all registrations for the event
      const registrationsSnapshot = await eventDoc.ref
        .collection("registrations")
        .get();
      if (registrationsSnapshot.empty) {
        await eventDoc.ref.update({
          listGenerated: true,
          attendees: [],
          waitingList: [],
        });
        continue; // No one registered, just mark as sorted.
      }

      // 4. Fetch user profiles for each registration to get their history
      const userPromises = registrationsSnapshot.docs.map((regDoc) =>
        db.collection("users").doc(regDoc.id).get()
      );
      const userSnapshots = await Promise.all(userPromises);

      const participants = registrationsSnapshot.docs.map((regDoc, index) => {
        const registrationData = regDoc.data();
        const userData = userSnapshots[index].data();
        return {
          ...registrationData,
          lastAttended: userData.lastAttended,
        };
      });

      // 5. THE SORTING LOGIC
      participants.sort((a, b) => {
        // Rule 1: Organizers first
        if (a.isOrganizer && !b.isOrganizer) return -1;
        if (!a.isOrganizer && b.isOrganizer) return 1;

        // Rule 2: Never attended before those who have
        if (a.lastAttended === null && b.lastAttended !== null) return -1;
        if (a.lastAttended !== null && b.lastAttended === null) return 1;

        // Rule 3: Attended longest ago before more recent attendees
        if (a.lastAttended && b.lastAttended) {
          if (a.lastAttended < b.lastAttended) return -1;
          if (a.lastAttended > b.lastAttended) return 1;
        }

        // Rule 4: Random for ties
        return Math.random() - 0.5;
      });

      // 6. Split into attendees and waiting list
      const attendees = participants.slice(0, event.spots);
      const waitingList = participants.slice(event.spots);

      // 7. Update the main event document with the final lists
      await eventDoc.ref.update({
        attendees: attendees.map((p) => ({
          uid: p.uid,
          displayName: p.displayName,
          isOrganizer: p.isOrganizer,
        })),
        waitingList: waitingList.map((p) => ({
          uid: p.uid,
          displayName: p.displayName,
        })),
        listGenerated: true,
        sortedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 8. Update 'lastAttended' for those who made the list
      const attendeeUpdates = attendees.map((attendee) => {
        const userRef = db.collection("users").doc(attendee.uid);
        return userRef.update({ lastAttended: eventDate });
      });
      await Promise.all(attendeeUpdates);
    }

    return null;
  });
