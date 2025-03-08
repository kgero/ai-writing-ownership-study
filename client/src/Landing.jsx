import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

export default function Landing() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!value) {
      alert("Please enter a code like '1a' or '2c'.");
      return;
    }
    
    // 1) Extract the numeric part (e.g. "2") from the front
    const numericPart = parseInt(value, 10);

    // 2) Extract the letter part that follows (e.g. "a")
    //    We slice off however many digits were parsed
    //    and convert to lowercase for consistency.
    const digitsLength = String(numericPart).length;
    const letterPart = value.slice(digitsLength).toLowerCase();

    // 3) Validate that numericPart is 1–4 and letterPart is something like 'a','b','c','d'
    if (
      numericPart >= 1 &&
      numericPart <= 4 &&
      letterPart.length === 1 &&
      /[a-d]/.test(letterPart)
    ) {
      // 4) Navigate to /NUMBER/LETTER (e.g. /2/a)
      navigate(`/consent/${numericPart}/${letterPart}`);
    } else {
      alert("Please enter a valid code like '1a', '2b', '3c', or '4d'.");
    }
  };

  return (
    <div className="container">
      <div className="landing">
        <h1>Welcome! Enter a code like 1a or 2c:</h1>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 1a"
        />
        <button onClick={handleSubmit}>Go</button>
      </div>
    </div>
  );
}
