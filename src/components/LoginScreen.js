import React from "react";

import { signInWithGoogle } from "./Auth";

const LoginScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
    <h1 className="text-4xl font-bold text-slate-800 mb-4">
      Internal Events Tool
    </h1>
    <p className="text-slate-600 mb-8">
      Please sign in with your Google corporate account to continue.
    </p>
    <button
      onClick={signInWithGoogle}
      className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition shadow-lg"
    >
      Sign in with Google
    </button>
  </div>
);

export default LoginScreen;
