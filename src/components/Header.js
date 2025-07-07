import React from "react";

import { handleSignOut } from "./Auth";

const Header = ({ user }) => (
  <header className="mb-12 flex justify-between items-center">
    <div>
      <h1 className="text-4xl font-bold text-slate-800">Sports Events</h1>
      <p className="text-slate-500">Welcome, {user.displayName}!</p>
    </div>
    <button
      onClick={handleSignOut}
      className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition"
    >
      Sign Out
    </button>
  </header>
);

export default Header;
