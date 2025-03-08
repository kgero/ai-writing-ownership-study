import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./index.css";

import { writingPrompts } from "./writingprompts";

export default function InterfaceOne() {
  const { promptId } = useParams();

  const promptText = writingPrompts[promptId] || "No prompt found for this ID";
  const instructions = writingPrompts["instructions"];
  const ideasLLMprompt = writingPrompts.ideasLLMprompt(promptText);

  const [input, setInput] = useState("");
  const [ideas, setIdeas] = useState("");
  const [keystrokes, setKeystrokes] = useState([]);
  const [loading, setLoading] = useState(false);

  // PLACEHOLDER LOGGING CODE

  // 1) Keypress recording
  const handleKeyDown = (event) => {
    // Record the key and a timestamp (example)
    const keyInfo = { key: event.key, time: Date.now() };
    setKeystrokes((prev) => [...prev, keyInfo]);
  };

  // 2) Text snapshots
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Placeholder: log the snapshot. In real code, you'd POST to DB, etc.
      console.log("Snapshot at", new Date().toISOString(), ":", inputRef.current);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);


  // GET IDEAS BUTTON HANDLER
  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const response = await axios.post("http://localhost:5001/api/openai", {
        prompt: ideasLLMprompt
      });
      setIdeas(response.data.completion);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    } finally {
      setLoading(false); 
    }
  };

  // SUBMIT BUTTON HANDLER
  const handleSubmit = () => {
    // Placeholder: in future, you'd do an axios POST to save `input`, keystrokes, etc.
    console.log("TODO: Submit final essay text to DB, then navigate to 'ending' page.");
  };

  // WORD COUNT
  const wordCount = input.trim().length
    ? input.trim().split(/\s+/).length
    : 0;

  return (
    <div className="container">
      <div className="editor">
        <h1>Interface One</h1>
        <p>{instructions}</p>
        <p style={{ fontStyle: "italic" }}>{promptText}</p>
        
        {/* Wrap textarea in a relative container so we can place the word counter at bottom-right */}
        <div style={{ position: "relative" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type something here..."
            rows={25}
            style={{ width: "100%", boxSizing: "border-box" }}
          />

          {/* Word counter at bottom-right */}
          <div
            style={{
              position: "absolute",
              bottom: "5px",
              right: "10px",
              fontSize: "12px",
              color: "#999"
            }}
          >
            {wordCount} words
          </div>
        </div>

        {/* Submit button below textarea */}
        <button onClick={handleSubmit} style={{ marginTop: "1rem" }}>
          Submit
        </button>

      </div>
      <div className="sidebar">
        <button onClick={fetchIdeas} disabled={loading}>
          {loading ? "Loading..." : "Get Ideas"}
        </button>
        <div className="ideas-box" style={{ marginTop: "1rem" }}>
          {loading ? (
            // You can make this a spinner or progress bar if you want
            <p>Loading ideas…</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{ideas}</ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
