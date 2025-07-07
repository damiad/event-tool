import { db } from "../firebase";
import CreateEventForm from "./CreateEventForm";
import CreateGroupForm from "./CreateGroupForm";
import { collection, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";

import Header from "./Header";

const Dashboard = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Fetch groups from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, "groups"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const groupsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGroups(groupsData);
        setLoadingGroups(false);
      },
      (error) => {
        console.error("Error fetching groups:", error);
        alert("Could not fetch groups. Check permissions and console.");
        setLoadingGroups(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header user={user} />
      {loadingGroups ? (
        <p>Loading groups...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <CreateGroupForm />
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <CreateEventForm groups={groups} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
