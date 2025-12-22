import React from 'react'

const Navheader=()=> {
  return (
    <header className="text-center">
      <h1 className="text-2xl  font-extrabold bg-gradient-to-r from-green-400 via-orange-500 to-blue-400 text-transparent bg-clip-text shadow-lg inline-block" style={{filter: 'drop-shadow(1px 2px 10px rgba(235,100,150,0.7))'}}>ScanFace|PREDICT YOUR FACE</h1>
      <p className="text-gray-300">Predict your face by taking a selfie photo</p>
    </header>
  )
}

export default Navheader;
