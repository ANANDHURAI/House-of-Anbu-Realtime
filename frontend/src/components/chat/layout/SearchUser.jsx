// import React, { useState } from "react";
// import AxiosInstance from "../../api/AxiosInterCepters";

// function SearchUser({ onUserSelect }) {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const handleSearch = async (e) => {
//     const value = e.target.value;
//     setQuery(value);

//     if (value.trim().length < 2) {
//       setResults([]);
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await AxiosInstance.get(`/auth/search/?q=${value}`);
//       setResults(res.data);
//     } catch (error) {
//       console.error("Search failed:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="border-b bg-gray-50">
//       {/* Search Input */}
//       <div className="p-3 flex items-center bg-white">
//         <input
//           type="text"
//           placeholder="🔍 Search name, email, or phone"
//           value={query}
//           onChange={handleSearch}
//           className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
//         />
//       </div>

//       {/* Search Results */}
//       {query && (
//         <div className="max-h-64 overflow-y-auto bg-white border-t">
//           {loading && (
//             <div className="text-center text-sm text-gray-500 py-3">
//               Searching...
//             </div>
//           )}

//           {!loading && results.length === 0 && (
//             <div className="text-center text-sm text-gray-500 py-3">
//               No users found
//             </div>
//           )}

//           {results.map((user) => (
//             <div
//               key={user.id}
//               onClick={() => onUserSelect(user)}
//               className="flex items-center space-x-3 p-3 hover:bg-gray-100 cursor-pointer border-b"
//             >
//               {user.profile_image ? (
//                 <img
//                   src={user.profile_image}
//                   alt={user.name}
//                   className="w-10 h-10 rounded-full object-cover"
//                 />
//               ) : (
//                 <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
//                   {user.name?.charAt(0).toUpperCase()}
//                 </div>
//               )}
//               <div className="flex flex-col">
//                 <span className="font-medium text-gray-800 text-sm">
//                   {user.name}
//                 </span>
//                 <span className="text-xs text-gray-500">{user.email}</span>
//                 <span className="text-xs text-gray-400">{user.phone}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default SearchUser;
