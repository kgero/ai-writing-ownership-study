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

  // AI REVISION HANDLER
  const handleRevision = async (revisionType) => {
    try {
      setRevisionLoading(true);
      setActiveRevisionType(revisionType);
      
      // Use the appropriate prompt from the config
      const promptType = revisionType.toLowerCase().replace(/\s+/g, "");
      const prompt = llmPrompts[promptType](input);
      
      const response = await axios.post("http://localhost:5001/api/openai", {
        prompt: prompt
      });
      
      setInput(response.data.completion);
    } catch (error) {
      console.error(`Error with ${revisionType}:`, error);
      setIdeas(`Failed to revise with ${revisionType}. Please try again.`);
    } finally {
      setRevisionLoading(false);
      setActiveRevisionType("");
    }
  };

  // AI DRAFT GENERATION
  const generateAIDraft = async () => {
    try {
      setLoading(true);
      
      const prompt = `Please write a complete draft essay based on this outline and prompt.
      
      Prompt: ${promptText}
      
      Outline:
      ${previousContent}
      
      Please create a well-structured essay of approximately 500 words that follows this outline.`;
      
      const response = await axios.post("http://localhost:5001/api/openai", {
        prompt: prompt
      });
      
      setAiDraft(response.data.completion);
    } catch (error) {
      console.error("Error generating AI draft:", error);
      setAiDraft("Failed to generate AI draft. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // NEXT STAGE BUTTON HANDLER
  const handleNextStage = async () => {
    // Save current stage data
    localStorage.setItem(`${stageName.toLowerCase()}_content`, input);
    
    // If going from outline to draft and has AI support for draft, generate AI draft
    if (stageName === "Outline" && stageConfig[conditionNum].draft) {
      await generateAIDraft();
      localStorage.setItem("ai_draft", aiDraft);
      localStorage.setItem("draft_content", aiDraft);
      
      // Skip the draft stage and go directly to revision
      navigate(`/revision/${condition}/${promptId}`);
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
  const showPreviousContent = (stageName === "Draft" || stageName === "Revision") && !hasAISupport;

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
            <button onClick={handleNextStage}>
              {getNextButtonText()}
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
                <p>Click the button above to get outline ideas.</p>
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
        
        {/* AI Revision support (unchanged) */}
        {hasAISupport && stageName === "Revision" && (
          <>
            <h3>Revision Tools</h3>
            
            {/* Revision buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <button 
                onClick={() => handleRevision("Style enhancer")} 
                disabled={revisionLoading}
                className={`revision-button ${activeRevisionType === "Style enhancer" ? "active" : ""}`}
              >
                {activeRevisionType === "Style enhancer" && revisionLoading ? "Enhancing..." : "Style enhancer"}
              </button>
              
              <button 
                onClick={() => handleRevision("Grammar checker")} 
                disabled={revisionLoading}
                className={`revision-button ${activeRevisionType === "Grammar checker" ? "active" : ""}`}
              >
                {activeRevisionType === "Grammar checker" && revisionLoading ? "Checking..." : "Grammar checker"}
              </button>
              
              <button 
                onClick={() => handleRevision("Tone adjuster")} 
                disabled={revisionLoading}
                className={`revision-button ${activeRevisionType === "Tone adjuster" ? "active" : ""}`}
              >
                {activeRevisionType === "Tone adjuster" && revisionLoading ? "Adjusting..." : "Tone adjuster"}
              </button>
              
              <button 
                onClick={() => handleRevision("Content polisher")} 
                disabled={revisionLoading}
                className={`revision-button ${activeRevisionType === "Content polisher" ? "active" : ""}`}
              >
                {activeRevisionType === "Content polisher" && revisionLoading ? "Polishing..." : "Content polisher"}
              </button>
            </div>
            
            <button onClick={fetchIdeas} disabled={loading || revisionLoading}>
              {loading ? "Loading..." : "Get Revision Ideas"}
            </button>
            
            <div className="ideas-box" style={{ marginTop: "1rem" }}>
              {loading ? (
                <p>Loading ideas…</p>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{ideas}</ReactMarkdown>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}