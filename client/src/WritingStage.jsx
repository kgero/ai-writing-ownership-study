// WritingStage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stageConfig, llmPrompts } from "./config";
import IdeasList from "./IdeasList"; // Import the new component

export default function WritingStage({ stageName, nextStage }) {
  const { condition, promptId } = useParams();
  const navigate = useNavigate();
  
  const conditionNum = parseInt(condition, 10);
  const promptText = stageConfig.prompts[promptId] || "No prompt found for this ID";
  
  // Determine if this stage has AI support based on condition
  const hasAISupport = stageConfig[conditionNum][stageName.toLowerCase()];
  
  const [input, setInput] = useState("");
  const [ideas, setIdeas] = useState("");
  const [previousContent, setPreviousContent] = useState("");
  const [keystrokes, setKeystrokes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [activeRevisionType, setActiveRevisionType] = useState("");
  
  // Add state for revision results and UI
  const [revisionResults, setRevisionResults] = useState({});
  const [showRevisionResults, setShowRevisionResults] = useState({});
  
  // Get previous stage content from localStorage if available
  useEffect(() => {
    // Load current stage content if available
    const currentContent = localStorage.getItem(`${stageName.toLowerCase()}_content`);
    if (currentContent) {
      setInput(currentContent);
    }
    
    // Load previous stage content based on current stage
    const prevContent = getPreviousStageContent();
    if (prevContent) {
      setPreviousContent(prevContent);
      
      // For revision stage, set the draft as the starting point in the input area
      if (stageName === "Revision" && !currentContent) {
        setInput(prevContent);
      }
    }
  }, [stageName]);
  
  // Save content to localStorage whenever it changes
  useEffect(() => {
    if (input) {
      localStorage.setItem(`${stageName.toLowerCase()}_content`, input);
    }
  }, [input, stageName]);

  // Keypress recording
  const handleKeyDown = (event) => {
    const keyInfo = { key: event.key, time: Date.now(), stage: stageName };
    setKeystrokes((prev) => [...prev, keyInfo]);
  };

  // Text snapshots
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log(`${stageName} snapshot at`, new Date().toISOString(), ":", inputRef.current);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [stageName]);

  // Get previous stage content for AI prompt
  const getPreviousStageContent = () => {
    if (stageName === "Draft") {
      return localStorage.getItem("outline_content") || "";
    } else if (stageName === "Revision") {
      return localStorage.getItem("draft_content") || "";
    }
    return "";
  };

  // GET IDEAS BUTTON HANDLER
  const fetchIdeas = async () => {
    try {
      setLoading(true);
      
      // Determine which prompt to use based on stage
      let prompt;
      
      if (stageName === "Outline") {
        prompt = llmPrompts.outline(promptText);
      } else if (stageName === "Draft") {
        prompt = llmPrompts.draft(promptText, previousContent);
      } else if (stageName === "Revision") {
        prompt = llmPrompts.revision(promptText, previousContent);
      }
      
      const response = await axios.post("http://localhost:5001/api/openai", {
        prompt: prompt
      });
      
      setIdeas(response.data.completion);
    } catch (error) {
      console.error(`Error fetching ideas for ${stageName}:`, error);
      setIdeas("Failed to get ideas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Modified AI REVISION TOOL HANDLER for more concise responses
  const handleRevisionTool = async (toolType) => {
    try {
      setRevisionLoading(true);
      setActiveRevisionType(toolType);
      
      // Create modified prompts that ask for shorter responses
      const shortProofreader = (draft) => `
        Please briefly review the following essay for the most critical typos, grammatical mistakes, and punctuation issues:
        
        ${draft}
        
        Identify only 2-3 of the most important issues. For each issue:
        1. Quote only the problematic phrase (keep it under 10 words).
        2. Very briefly explain the problem in 5-10 words.
        3. Suggest a concise fix.
        
        Format as:
        > *"problematic text"*
        >
        > **Issue**: Brief explanation
        >
        > **Fix**: *"corrected version"*
        
        Be extremely concise. Only identify actual errors.
      `;
      
      const shortContentPolisher = (draft) => `
        Please briefly review the following essay for the most significant weak arguments:
        
        ${draft}
        
        Identify only 2-3 of the most important issues. For each issue:
        1. Quote only the relevant phrase (keep it under 10 words).
        2. Very briefly explain the weakness in 5-10 words.
        3. Suggest a specific, concise improvement.
        
        Format as:
        > *"weak argument"*
        >
        > **Issue**: Brief explanation
        >
        > **Fix**: Suggested fix
        
        Be extremely concise. Focus only on substantive improvements.
      `;
      
      const shortWritingClarity = (draft) => `
        Please briefly review the following essay for the most unclear passages:
        
        ${draft}
        
        Identify only 2-3 of the most problematic passages. For each issue:
        1. Quote only the unclear phrase (keep it under 10 words).
        2. Very briefly explain the clarity issue in 5-10 words.
        3. Suggest a clearer alternative.
        
        Format as:
        > *"unclear text"*
        >
        > **Issue**: Brief explanation
        >
        > **Fix**: *"clearer version"*
        
        Be extremely concise. Focus only on clarity issues.
      `;
      
      // Map the tool type to the corresponding prompt
      const promptMap = {
        "Proof-reader": shortProofreader,
        "Content polisher": shortContentPolisher,
        "Writing clarity": shortWritingClarity
      };
      
      // Use the appropriate prompt from the map
      const promptFn = promptMap[toolType];
      if (!promptFn) {
        throw new Error(`No prompt found for revision tool: ${toolType}`);
      }
      
      const prompt = promptFn(input);
      
      const response = await axios.post("http://localhost:5001/api/openai", {
        prompt: prompt
      });
      
      // Store the results for this tool type
      setRevisionResults(prev => ({
        ...prev,
        [toolType]: response.data.completion
      }));
      
      // Automatically show the results
      setShowRevisionResults(prev => ({
        ...prev,
        [toolType]: true
      }));
      
    } catch (error) {
      console.error(`Error with ${toolType}:`, error);
      setRevisionResults(prev => ({
        ...prev,
        [toolType]: `Failed to use ${toolType}. Please try again.`
      }));
    } finally {
      setRevisionLoading(false);
      setActiveRevisionType("");
    }
  };

  // Toggle revision results visibility
  const toggleRevisionResults = (toolType) => {
    setShowRevisionResults(prev => ({
      ...prev,
      [toolType]: !prev[toolType]
    }));
  };

  // NEXT STAGE BUTTON HANDLER
  const handleNextStage = async () => {
    // Save current stage data
    localStorage.setItem(`${stageName.toLowerCase()}_content`, input);
    
    // If going from outline to draft and has AI support for draft, generate AI draft
    if (stageName === "Outline" && stageConfig[conditionNum].draft) {
      setLoading(true); // Set loading to true for UI indication
      
      try {
        // Use the prompt from config.js and the current input (outline)
        const prompt = llmPrompts.aiDraft(promptText, input);
        
        const response = await axios.post("http://localhost:5001/api/openai", {
          prompt: prompt
        });
        
        const draftContent = response.data.completion;
        
        // Store in localStorage
        localStorage.setItem("ai_draft", draftContent); 
        localStorage.setItem("draft_content", draftContent);
        localStorage.setItem("revision_content", draftContent);
        
        // Navigate to revision stage
        navigate(`/revision/${condition}/${promptId}`);
      } catch (error) {
        console.error("Error generating AI draft:", error);
        alert("Failed to generate AI draft. Please try again.");
      } finally {
        setLoading(false);
      }
      
      return;
    }
    
    // Navigate to next stage
    navigate(`/${nextStage.toLowerCase()}/${condition}/${promptId}`);
  };

  // SUBMIT BUTTON HANDLER (for final stage)
  const handleSubmit = () => {
    // Save final content
    localStorage.setItem(`${stageName.toLowerCase()}_content`, input);
    
    // Submit all data to backend
    console.log("Submitting all writing data to database...");
    
    // Clear localStorage
    localStorage.removeItem("outline_content");
    localStorage.removeItem("draft_content");
    localStorage.removeItem("revision_content");
    localStorage.removeItem("ai_draft");
    
    // Navigate to completion page (which we'd need to create)
    alert("Thank you for completing the writing task!");
    navigate("/");
  };

  // Use AI draft if available
  const useAIDraft = () => {
    setInput(aiDraft);
  };

  // Word count
  const wordCount = input.trim().length ? input.trim().split(/\s+/).length : 0;

  // Determine if this is the no support condition but still needs previous content display
  const showPreviousContent = (stageName === "Draft");

  // Determine appropriate button text for next stage
  const getNextButtonText = () => {
    if (stageName === "Outline" && stageConfig[conditionNum].draft) {
      return "Get an AI generated draft and move to revision stage";
    }
    return `Continue to ${nextStage} Stage`;
  };

  // Always use standard width for the editor (70%)
  const editorStyle = {
    flex: "7",
    padding: "20px",
    backgroundColor: "white"
  };
  
  // Define revision tools with descriptions for tooltips
  const revisionTools = [
    {
      id: "Proof-reader",
      description: "Find typos, grammatical mistakes, and misplaced punctuation"
    },
    {
      id: "Content polisher",
      description: "Identify weak arguments and confusing points"
    },
    {
      id: "Writing clarity",
      description: "Highlight unclear or hard to follow passages"
    }
  ];
  
  return (
    <div className="container">
      <div className="editor" style={editorStyle}>
        <h1>{stageName} Stage</h1>
        <p>{stageConfig.instructions[stageName.toLowerCase()]}</p>
        <p style={{ fontStyle: "italic" }}>{promptText}</p>
        
        <div style={{ position: "relative" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type your ${stageName.toLowerCase()} here...`}
            rows={25}
            style={{ width: "100%", boxSizing: "border-box" }}
          />

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

        <div style={{ marginTop: "1rem" }}>
          {nextStage ? (
            <button 
              onClick={handleNextStage} 
              disabled={loading}
              style={{ 
                cursor: loading ? 'wait' : 'pointer',
                position: 'relative',
                minWidth: '280px'
              }}
            >
              {loading && stageName === "Outline" && stageConfig[conditionNum].draft ? (
                <>
                  <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
                    {getNextButtonText()}
                  </span>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid rgba(0,0,0,0.1)',
                      borderTopColor: '#000',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}></div>
                    Generating AI draft...
                  </div>
                  <style>
                    {`
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}
                  </style>
                </>
              ) : (
                getNextButtonText()
              )}
            </button>
          ) : (
            <button onClick={handleSubmit}>
              Submit Final Essay
            </button>
          )}
        </div>
      </div>
      
      {/* Always render sidebar with same width for consistent layout */}
      <div className="sidebar">
        {/* Previous content display for "no support" condition */}
        {showPreviousContent && (
          <>
            <h3>{stageName === "Draft" ? "Your Outline" : "Your Draft"}</h3>
            <div className="ideas-box" style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
              {previousContent}
            </div>
          </>
        )}
        
        {/* AI support for Outline stage - USING NEW COMPONENT */}
        {hasAISupport && stageName === "Outline" && (
          <>
            {!ideas && (
              <button onClick={fetchIdeas} disabled={loading}>
                {loading ? "Loading ideas..." : "Get Outline Ideas"}
              </button>
            )}
            
            <div className="ideas-box" style={{ marginTop: "1rem" }}>
              {loading ? (
                <p>Loading ideas…</p>
              ) : ideas ? (
                <IdeasList 
                  ideas={ideas} 
                  setIdeas={setIdeas} 
                  promptText={promptText} 
                />
              ) : (
                <p>Click the button above to get essay ideas.</p>
              )}
            </div>
          </>
        )}
        
        {/* AI support for Draft stage (unchanged) */}
        {hasAISupport && stageName === "Draft" && (
          <>
            <button onClick={fetchIdeas} disabled={loading}>
              {loading ? "Loading..." : "Get Draft Ideas"}
            </button>
            
            {aiDraft && (
              <button onClick={useAIDraft} style={{ marginTop: "10px" }}>
                Use AI Draft
              </button>
            )}
            
            <div className="ideas-box" style={{ marginTop: "1rem" }}>
              {loading ? (
                <p>Loading ideas…</p>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{ideas}</ReactMarkdown>
              )}
            </div>
          </>
        )}
        
        {/* AI Revision support - UPDATED IMPLEMENTATION */}
        {hasAISupport && stageName === "Revision" && (
          <>
            <h3>Revision Tools</h3>
            
            {/* Render revision tools with tooltips */}
            <div className="revision-tools-container">
              {revisionTools.map((tool) => (
                <div key={tool.id} style={{ marginBottom: "15px" }}>
                  <div className="tooltip-container">
                    <button 
                      onClick={() => handleRevisionTool(tool.id)} 
                      disabled={revisionLoading}
                      className={`revision-button ${activeRevisionType === tool.id ? "active" : ""}`}
                      title={tool.description}
                    >
                      {revisionResults[tool.id] ? `Rerun ${tool.id}` : tool.id}
                      {activeRevisionType === tool.id && revisionLoading && (
                        <span className="loading-indicator">...</span>
                      )}
                    </button>
                  </div>
                  
                  {/* Results for this tool */}
                  {revisionResults[tool.id] && (
                    <div className="revision-results">
                      <div 
                        onClick={() => toggleRevisionResults(tool.id)}
                        className="revision-results-header"
                        style={{
                          display: "flex", 
                          justifyContent: "space-between",
                          padding: "8px",
                          backgroundColor: "#f0f0f0",
                          cursor: "pointer",
                          borderRadius: "4px 4px 0 0"
                        }}
                      >
                        <span>Suggestions</span>
                        <span>{showRevisionResults[tool.id] ? "▼" : "▶"}</span>
                      </div>
                      
                      {showRevisionResults[tool.id] && (
                        <div 
                          className="revision-results-content"
                          style={{
                            padding: "10px",
                            backgroundColor: "#fff",
                            border: "1px solid #ddd",
                            borderTop: "none",
                            borderRadius: "0 0 4px 4px",
                            maxHeight: "300px",
                            overflowY: "auto"
                          }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {revisionResults[tool.id]}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}