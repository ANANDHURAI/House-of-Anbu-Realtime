import React, { useState } from "react";
import AxiosInstance from "../../api/AxiosInterCepters";

function Search() {
  const [query, setQuery] = useState("");
  const [searchingData, setSearchingData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setSearchingData([]);
      return;
    }

    try {
      setLoading(true);
      const response = await AxiosInstance.post("/chat/search-user/", {
        query: value,
      });
      setSearchingData(response.data.results || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 border-b bg-gray-50">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by name, email, or phone..."
        value={query}
        onChange={handleSearch}
        className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
      />

      {/* Results */}
      <div className="mt-3 max-h-60 overflow-y-auto">
        {loading && <p className="text-sm text-gray-500">Searching...</p>}
        {!loading && searchingData.length === 0 && query && (
          <p className="text-sm text-gray-500">No results found.</p>
        )}
        {!loading &&
          searchingData.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition"
            >
              <img
                src={
                  user.profile_image ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Search;
