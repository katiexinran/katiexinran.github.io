import { NavLink } from "react-router-dom";
import { Heart, Search } from "lucide-react";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-gray-200 bg-white">
      {/* ---------- Left Title ---------- */}
      <h2 className="text-[20px] font-semibold text-black tracking-tight">
        Events Around
      </h2>

      {/* ---------- Right Tabs ---------- */}
      <div className="flex items-center space-x-8">
        {/* Search Tab */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 text-[15px] font-medium transition-colors ${
              isActive
                ? "text-black"
                : "text-gray-600 hover:text-black"
            }`
          }
        >
          <Search className="w-[17px] h-[17px]" strokeWidth={2} />
          <span>Search</span>
        </NavLink>

        {/* Favorites Tab */}
        <NavLink
          to="/favorites"
          className={({ isActive }) =>
            `flex items-center gap-2 text-[15px] font-medium transition-colors ${
              isActive
                ? "text-black"
                : "text-gray-600 hover:text-black"
            }`
          }
        >
          <Heart className="w-[17px] h-[17px]" strokeWidth={2} />
          <span>Favorites</span>
        </NavLink>
      </div>
    </nav>
  );
}
