import { handleSignOut } from "./components/Auth";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";

import "./App.css";

// Optional: for some basic styling if needed

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Security Check: Only set the user if they are logged in AND have a google.com email.
      if (currentUser && currentUser.email?.endsWith("@google.com")) {
        setUser(currentUser);
      } else {
        setUser(null);
        // If a non-Googler somehow signed in, sign them out immediately.
        if (currentUser) {
          alert(
            "Access is restricted to Google employees only. You will be signed out."
          );
          handleSignOut();
        }
      }
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {user ? <Dashboard user={user} /> : <LoginScreen />}
    </div>
  );
}

export default App;
