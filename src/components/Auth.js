import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

/**
 * Initiates the Google Sign-In process.
 */
export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ hd: "google.com" });
  return signInWithPopup(auth, provider).catch((error) => {
    console.error("Error during sign-in:", error);
    alert("Could not sign in. Check the console for more details.");
  });
};

/**
 * Signs the current user out.
 */
export const handleSignOut = () => {
  return signOut(auth).catch((error) => {
    console.error("Error during sign-out:", error);
  });
};
