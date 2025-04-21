import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";
import { stageConfig } from "./config.js";

export default function Landing() {
  const [condition, setCondition] = useState("");
  const [promptId, setPromptId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!condition || !promptId || !participantId) {
      alert("Please select a condition, an essay prompt, and enter a participant ID.");
      return;
    }

    // Navigate to the consent page with condition and promptId
    navigate(`/consent/${condition}/${promptId}`);
  };

  // Format the condition description
  const getConditionDescription = (conditionNumber) => {
    const config = stageConfig[conditionNumber];
    if (!config) return "";
    
    if (!config.outline && !config.draft && !config.revision) {
      return "No AI support";
    }
    
    const stages = [];
    if (config.outline) stages.push("outline");
    if (config.draft) stages.push("draft");
    if (config.revision) stages.push("revision");
    
    return `AI support for ${stages.join(", ")} stage${stages.length > 1 ? 's' : ''}`;
  };

  return (
    <div className="container">
      <div className="landing">
        <h1>Pick your condition & essay prompt, and enter a temp participant ID</h1>
        
        <div className="selection-section">
          <h2>Select Condition:</h2>
          <div className="radio-group">
            {[1, 2, 3, 4].map((num) => (
              <div key={`condition-${num}`} className="radio-option">
                <input
                  type="radio"
                  id={`condition-${num}`}
                  name="condition"
                  value={num}
                  checked={condition === String(num)}
                  onChange={() => setCondition(String(num))}
                />
                <label htmlFor={`condition-${num}`}>
                  Condition {num}: {getConditionDescription(num)}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="selection-section">
          <h2>Select Essay Prompt:</h2>
          <div className="radio-group">
            {Object.entries(stageConfig.prompts).map(([id, text]) => (
              <div key={`prompt-${id}`} className="radio-option">
                <input
                  type="radio"
                  id={`prompt-${id}`}
                  name="prompt"
                  value={id}
                  checked={promptId === id}
                  onChange={() => setPromptId(id)}
                />
                <label htmlFor={`prompt-${id}`}>
                  {id}: {text}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="input-section">
          <h2>Enter Participant ID:</h2>
          <input
            type="text"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            placeholder="e.g. P001"
          />
        </div>
        
        <button className="submit-button" onClick={handleSubmit}>Continue to Informed Consent</button>
      </div>
    </div>
  );
}