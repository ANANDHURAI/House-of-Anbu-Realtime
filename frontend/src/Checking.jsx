import React, { useEffect, useState } from 'react'
import axios  from 'axios'


function Checking() {
  const [data, setData] = useState('')


  useEffect(() => {
    axios.get("http://127.0.0.1:8000/user/check/")
      .then(response => {
        console.log(response.data)
        setData(response.data.message)
      })
      .catch(error => {
        console.error("Error fetching:", error)
      })
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <h1 className="text-4xl font-extrabold text-white drop-shadow-lg animate-pulse">
        {data}
      </h1>
    </div>

  )
}

export default Checking
