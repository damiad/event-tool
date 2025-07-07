import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";

function CreateEventForm({ groups }) {
  const [eventType, setEventType] = useState("one-time");
  const [submitting, setSubmitting] = useState(false);
  const initialFormState = {
    groupId: "",
    description: "",
    location: "",
    locationLink: "",
    spots: 10,
    oneTimeDate: "",
    recurringDay: "Monday",
    time: "19:00",
  };
  const [formState, setFormState] = useState(initialFormState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.groupId) {
      alert("Please select a group.");
      return;
    }

    setSubmitting(true);
    const commonData = {
      groupId: formState.groupId,
      description: formState.description,
      location: formState.location,
      locationLink: formState.locationLink,
      time: formState.time,
      spots: parseInt(formState.spots, 10),
      createdAt: serverTimestamp(),
      eventType: eventType,
    };

    const eventData =
      eventType === "one-time"
        ? { ...commonData, date: formState.oneTimeDate }
        : { ...commonData, dayOfWeek: formState.recurringDay };

    try {
      await addDoc(collection(db, "events"), eventData);
      alert("Event created successfully!");
      setFormState(initialFormState);
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-700 mb-6">
        Create a New Event
      </h2>

      {groups.length === 0 ? (
        <p className="text-slate-500 text-center">
          Please create a group first to add an event.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="groupId"
              className="block text-sm font-medium text-slate-600 mb-2"
            >
              For Group
            </label>
            <select
              id="groupId"
              name="groupId"
              value={formState.groupId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select a group
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Event Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="eventType"
                  value="one-time"
                  checked={eventType === "one-time"}
                  onChange={() => setEventType("one-time")}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-slate-700">One-Time</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="eventType"
                  value="recurring"
                  checked={eventType === "recurring"}
                  onChange={() => setEventType("recurring")}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-slate-700">Recurring</span>
              </label>
            </div>
          </div>

          {eventType === "one-time" ? (
            <div>
              <label
                htmlFor="oneTimeDate"
                className="block text-sm font-medium text-slate-600 mb-2"
              >
                Date
              </label>
              <input
                type="date"
                id="oneTimeDate"
                name="oneTimeDate"
                value={formState.oneTimeDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="recurringDay"
                className="block text-sm font-medium text-slate-600 mb-2"
              >
                Day of the Week
              </label>
              <select
                id="recurringDay"
                name="recurringDay"
                value={formState.recurringDay}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-600 mb-2"
            >
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formState.description}
              onChange={handleChange}
              placeholder="e.g., Weekly Scrimmage"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="time"
                className="block text-sm font-medium text-slate-600 mb-2"
              >
                Time
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formState.time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label
                htmlFor="spots"
                className="block text-sm font-medium text-slate-600 mb-2"
              >
                Available Spots
              </label>
              <input
                type="number"
                id="spots"
                name="spots"
                min="1"
                value={formState.spots}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-slate-600 mb-2"
            >
              Location Name
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formState.location}
              onChange={handleChange}
              placeholder="e.g., The Warsaw Hub field"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label
              htmlFor="locationLink"
              className="block text-sm font-medium text-slate-600 mb-2"
            >
              Google Maps Link
            </label>
            <input
              type="url"
              id="locationLink"
              name="locationLink"
              value={formState.locationLink}
              onChange={handleChange}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-slate-400"
          >
            {submitting ? "Creating..." : "Create Event"}
          </button>
        </form>
      )}
    </div>
  );
}

export default CreateEventForm;
