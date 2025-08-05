import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { stageConfig } from "./config.js";
import { writingPrompts } from "./writingprompts.js";

export default function Instructions() {
  const { condition, promptSet } = useParams();
  const navigate = useNavigate();
  const [selectedPromptId, setSelectedPromptId] = useState("");

  const conditionNum = parseInt(condition);
  const config = stageConfig[conditionNum];

  // Get prompts from the assigned set
  const getPromptsForSet = () => {
    const promptSetKey = promptSet === 'A' ? 'setA' : 'setB';
    return writingPrompts[promptSetKey];
  };

  const availablePrompts = getPromptsForSet();

  // Calculate expected time based on condition
  const getExpectedTime = () => {
    const totalStageTime = stageConfig.stageTimes.outline + stageConfig.stageTimes.draft + stageConfig.stageTimes.revision;
    const baseTime = totalStageTime + 5; // Sum of all stages plus 5 minutes
    let timeReduction = 0;
    
    // If AI generates draft, reduce time by the draft time
    if (config.draft) {
      timeReduction += stageConfig.stageTimes.draft;
    }
    
    return baseTime - timeReduction;
  };


  // Generate flow diagram based on condition
  const getFlowDiagram = () => {
    const stages = [
      { name: "Pre-survey", hasAI: false, isGreyed: false },
      { name: "Outline", hasAI: config.outline, isGreyed: false },
      { name: "Draft", hasAI: config.draft, isGreyed: config.draft },
      { name: "Revision", hasAI: config.revision, isGreyed: false },
      { name: "Post-survey", hasAI: false, isGreyed: false }
    ];

    return stages.map((stage, index) => (
      <div key={index} style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            padding: "8px 2px",
            borderRadius: "20px",
            backgroundColor: stage.isGreyed ? "#e0e0e0" : "#007bff",
            color: stage.isGreyed ? "#666" : "white",
            fontWeight: "bold",
            fontSize: "14px",
            textAlign: "center",
            minWidth: "100px"
          }}
        >
          {stage.name}
          {stage.hasAI && !stage.isGreyed && (
            <div style={{ fontSize: "10px", marginTop: "2px" }}>
              + AI Support
            </div>
          )}
          {stage.isGreyed && (
            <div style={{ fontSize: "10px", marginTop: "2px" }}>
              AI Generated
            </div>
          )}
        </div>
        {index < stages.length - 1 && (
          <div style={{ margin: "0 10px", fontSize: "20px", color: "#666" }}>
            →
          </div>
        )}
      </div>
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPromptId) {
      alert("Please select a topic before continuing.");
      return;
    }
    navigate(`/presurvey/${condition}/${promptSet}/${selectedPromptId}`);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>Task Instructions</h1>
      
        <div style={{ marginBottom: "2rem" }}>
          <h2>What you'll be doing</h2>
          <p>
            Imagine you have been asked to write an essay as part of an admission process, e.g., as part of graduate school admission or as part of interviewing for a consulting firm. 
            Please write a 200-300 word argumentative essay on a provided topic. 
            You will get to select a topic from several options.  
          </p>
          <p>
            {config.outline && "You will have AI support to help generate ideas for your outline. This support will be provided within the webpage. "}
            {config.draft && "An AI system will generate an initial draft for you based on your outline. This support will be provided within the webpage. "}
            {config.revision && "You will have AI tools to help with revision. This support will be provided within the webpage.  "}
            You must do all your writing in the textbox provided; copy and pasting from external writing programs will result in your submission being returned.
          </p>
          <div style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "6px",
            padding: "8px 12px",
            margin: "8px 0",
            color: "#856404",
            fontSize: "13px",
            fontWeight: "500"
          }}>
            ⚠️ <strong>Note:</strong> You may not use any external AI support. You must do all your writing in the textbox provided on the webpage. We have implemented a variety of logging features to detect external AI use. <strong>If you use external AI support, we will return your submission.</strong>
          </div>
        </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Task Flow</h2>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "1rem"
        }}>
          {getFlowDiagram()}
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Time & Compensation</h2>
        <ul>
          <li><strong>Expected time:</strong> {getExpectedTime()} minutes</li>
          <li><strong>Base payment:</strong> $10 for completion</li>
          <li><strong>Bonus:</strong> $5 for top 5% quality essays</li>
        </ul>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Select Your Essay Topic</h2>
        <p>Please choose one of the following topics for your essay:</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            {availablePrompts.map((prompt) => (
              <div key={prompt.id} style={{ marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "flex-start", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="topic"
                    value={prompt.id}
                    checked={selectedPromptId === prompt.id}
                    onChange={(e) => setSelectedPromptId(e.target.value)}
                    style={{ marginRight: "10px", marginTop: "3px" }}
                  />
                  <span>{prompt.text}</span>
                </label>
              </div>
            ))}
          </div>
          
          <button 
            type="submit" 
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: "pointer",
              width: "100%"
            }}
          >
            Continue to Pre-survey
          </button>
        </form>
      </div>
    </div>
  );
} 