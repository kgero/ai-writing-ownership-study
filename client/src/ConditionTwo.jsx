import React, { useState } from "react";
import axios from "axios";
import "./index.css";

export default function InterfaceOne() {
  const { promptId } = useParams();

  const promptText = writingPrompts[promptId] || "No prompt found for this ID";
  const instructions = writingPrompts["instructions"];
  
  const [input, setInput] = useState("");
  const [ideas, setIdeas] = useState([]);

  const fetchIdeas = async () => {
    try {
      const response = await axios.post("http://localhost:5001/api/openai", {
        prompt: "Give me some creative writing ideas.",
      });
      setIdeas(response.data.completion);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    }
  };

  return (
    <div className="container">
      <div className="editor">
        <h1>Interface One</h1>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something here..."
          rows={10}
        />
      </div>
      <div className="sidebar">
        <button onClick={fetchIdeas}>Get Ideas</button>
        <div className="ideas-box">
          <p>{ideas}</p>
        </div>
      </div>
    </div>
  );
}
