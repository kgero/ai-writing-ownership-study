// WritingStage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import api from "./api.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stageConfig, llmPrompts } from "./config";
import IdeasList from "./IdeasList"; // Import the new component
import RevisionTools from "./RevisionTools"; // Import the new revision tools component
import loggingService from './loggingService.js';
import { useLogging } from './useLogging.js';


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
  // NEW: Track problematic text and their status (for revision tools)
  const [issueMap, setIssueMap] = useState({});
  const [highlightedText, setHighlightedText] = useState([]);
  const [hoveredIssueId, setHoveredIssueId] = useState(null);
  const [activeIssueId, setActiveIssueId] = useState(null);
  
  // Add state for revision results and UI
  const [revisionResults, setRevisionResults] = useState({});
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [activeRevisionType, setActiveRevisionType] = useState("");
  const textareaRef = useRef(null);

  // Logging hook
  const logging = useLogging(stageName);

  // Attach logging to textarea
  useEffect(() => {
    if (textareaRef.current) {
      const cleanup = logging.setupTextareaLogging(textareaRef.current);
      return cleanup;
    }
  }, [textareaRef.current, logging]);
  
  const sidebarRef = useRef(null);
  
  // For improved revision highlighting/underlining
  // highlight / navigation helpers
  const [collapseResolved, setCollapseResolved] = useState(false); // sidebar filter

  // For dealing with timers and time warnings
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const timerRef = useRef(null);
  const warningsGivenRef = useRef([]);

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

  // Set up timer for the stage
  useEffect(() => {
    // Get time limit for current stage in milliseconds
    const stageTimeLimit = stageConfig.stageTimes[stageName.toLowerCase()] * 60 * 1000;
    
    // Initialize timeRemaining when component mounts
    setTimeRemaining(stageTimeLimit);
    
    // Set up interval to update timeRemaining
    const intervalId = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1000;
        
        // Check for warnings
        stageConfig.warningTimes.forEach(warningTime => {
          const warningTimeMs = warningTime * 1000;
          if (newTime <= warningTimeMs && newTime > warningTimeMs - 1000 && 
              !warningsGivenRef.current.includes(warningTime)) {
            // Show warning
            warningsGivenRef.current.push(warningTime);
            setWarningMessage(`You have ${Math.floor(warningTime / 60)} minute${warningTime >= 120 ? 's' : ''} ${warningTime % 60 > 0 ? `and ${warningTime % 60} seconds` : ''} remaining.`);
            setShowWarning(true);
            
            // Hide warning after 5 seconds
            setTimeout(() => {
              setShowWarning(false);
            }, 5000);
          }
        });
        
        // Check for timeout
        if (newTime <= 0) {
          clearInterval(intervalId);
          setIsTimedOut(true);
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
    
    timerRef.current = intervalId;
    
    // Clean up timer on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [stageName]);

  // Save progress when timed out
  useEffect(() => {
    if (isTimedOut) {
      // Save current progress
      localStorage.setItem(`${stageName.toLowerCase()}_content`, input);
    }
  }, [isTimedOut, stageName, input]);








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

  // Track when the stage started
  const stageStartTimeRef = useRef(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log(`${stageName} snapshot at`, new Date().toISOString());

      const participantId = loggingService.getParticipantId();
      const sessionId = loggingService.getOrCreateSessionId();
      const currentTime = Date.now();
      const timeFromStart = Math.floor((currentTime - stageStartTimeRef.current) / 1000); // Convert to seconds
  
    const snapshotData = {
      participant_id: participantId,
      session_id: sessionId,
      stage: stageName.toLowerCase(),
      time_from_stage_start: timeFromStart,
      text_content: inputRef.current,
      created_at: new Date().toISOString(),
      type: "partial",
    };

      // Submit to backend
      axios.post('/api/snapshot/submit', snapshotData)
        .then(response => {
          console.log("Text snapshot submitted successfully:");
        })
        .catch(error => {
          console.error("Error submitting text snapshot:", error);
        });
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
    const buttonClickTime = Date.now();
    logging.logButtonClick('get_ideas');
    const start = Date.now();
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
      
      const response = await axios.post("/api/openai", {
        prompt: prompt
      });
      
      setIdeas(response.data.completion);
      logging.logApiCall('openai', prompt, response.data.completion, 'success', Date.now() - start, {
        triggeredBy: 'get_ideas_button',
        buttonClickTimestamp: buttonClickTime
      });
    } catch (error) {
      console.error(`Error fetching ideas for ${stageName}:`, error);
      setIdeas("Failed to get ideas. Please try again.");
      logging.logApiCall('openai', prompt, error?.toString() || '', 'error', Date.now() - start, {
        triggeredBy: 'get_ideas_button',
        buttonClickTimestamp: buttonClickTime
      });
    } finally {
      setLoading(false);
    }
  };





  // NEXT STAGE BUTTON HANDLER
  const handleNextStage = async () => {
    logging.logButtonClick('next_stage');
    // Save current stage data
    localStorage.setItem(`${stageName.toLowerCase()}_content`, input);

    // Submit all data to backend
    console.log("Submitting", stageName.toLowerCase(), "writing data to database...");

    const participantId = loggingService.getParticipantId();
    const sessionId = loggingService.getOrCreateSessionId();
    const currentTime = Date.now();
    const timeFromStart = Math.floor((currentTime - stageStartTimeRef.current) / 1000); // Convert to seconds
    
    const snapshotData = {
      participant_id: participantId,
      session_id: sessionId,
      stage: stageName.toLowerCase(),
      time_from_stage_start: timeFromStart,
      text_content: inputRef.current,
      created_at: new Date().toISOString(),
      type: "final",
    };

    // Submit to backend
    axios.post('/api/snapshot/submit', snapshotData)
      .then(response => {
        console.log("Final snapshot submitted successfully:", response.data);
      })
      .catch(error => {
        console.error("Error submitting text snapshot:", error);
      });
    
    // If going from outline to draft and has AI support for draft, generate AI draft
    if (stageName === "Outline" && stageConfig[conditionNum].draft) {
      logging.logButtonClick('generate_ai_draft');
      setLoading(true); // Set loading to true for UI indication
      
      try {
        // Use the prompt from config.js and the current input (outline)
        const prompt = llmPrompts.aiDraft(promptText, input);
        const start = Date.now();
        const response = await axios.post("/api/openai", {
          prompt: prompt
        });
        const draftContent = response.data.completion;
        logging.logApiCall('openai', prompt, draftContent, 'success', Date.now() - start);
        
        // Store in localStorage
        localStorage.setItem("ai_draft", draftContent); 
        localStorage.setItem("draft_content", draftContent);
        localStorage.setItem("revision_content", draftContent);
        
        // Navigate to revision stage
        navigate(`/revision/${condition}/${promptId}`);
      } catch (error) {
        console.error("Error generating AI draft:", error);
        logging.logApiCall('openai', prompt, error?.toString() || '', 'error');
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
    logging.logButtonClick('submit');
    // Save final content
    localStorage.setItem(`${stageName.toLowerCase()}_content`, input);
    
    // Submit all data to backend
    console.log("Submitting", stageName.toLowerCase(), "writing data to database...");


    const participantId = loggingService.getParticipantId();
    const sessionId = loggingService.getOrCreateSessionId();
    const currentTime = Date.now();
    const timeFromStart = Math.floor((currentTime - stageStartTimeRef.current) / 1000); // Convert to seconds
    
    const snapshotData = {
      participant_id: participantId,
      session_id: sessionId,
      stage: stageName.toLowerCase(),
      time_from_stage_start: timeFromStart,
      text_content: inputRef.current,
      created_at: new Date().toISOString(),
      type: "final",
    };

    // Submit to backend
    axios.post('/api/snapshot/submit', snapshotData)
      .then(response => {
        console.log("Final snapshot submitted successfully:", response.data);
      })
      .catch(error => {
        console.error("Error submitting text snapshot:", error);
      });
    
    // Clear localStorage
    localStorage.removeItem("outline_content");
    localStorage.removeItem("draft_content");
    localStorage.removeItem("revision_content");
    localStorage.removeItem("ai_draft");
    
    navigate(`/postsurvey/${condition}/${promptId}`);
  };

  // Use AI draft if available
  const useAIDraft = () => {
    setInput(aiDraft);
  };

  // Word count
  const wordCount = input.trim().length ? input.trim().split(/\s+/).length : 0;

  // Word count requirements for each stage
  const wordCountRequirement = stageConfig.wordCountRequirements[stageName.toLowerCase()] || 0;
  const hasEnoughWords = wordCount >= wordCountRequirement;

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
  

  
  // DEFINE THE ACTUAL UI
  return (
    <div className="container">
      <div className="editor" style={editorStyle}>
        <h1>{stageConfig.stageTitles[stageName.toLowerCase()]}</h1>
        <p style={{ whiteSpace: "pre-wrap" }}>{stageConfig.getInstruction(conditionNum, stageName)}</p>
        
        {/* Enhanced essay topic styling */}
        <div style={{
          backgroundColor: "#e8f5e8",
          border: "2px solid #4CAF50",
          borderRadius: "8px",
          padding: "16px 20px",
          margin: "20px 0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#2e7d32",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "8px"
          }}>
            Essay Topic
          </div>
          <div style={{
            fontSize: "18px",
            fontWeight: "500",
            color: "#1b5e20",
            lineHeight: "1.4",
            fontStyle: "italic"
          }}>
            {promptText}
          </div>
        </div>
        
        <div style={{ position: "relative" }}>
          {/* Replace the textarea with a div for highlighting when in Revision stage */}
          {stageName === "Revision" && hasAISupport ? (
            <div className="highlighted-textarea-container">
              <div className="highlight-layer">
                {/* Render highlighted ranges based on start/end/toolType */}
                {(() => {
                  if (!highlightedText.length) {
                    return input;
                  }
                  // Sort highlights by start
                  const sorted = [...highlightedText].sort((a, b) => a.start - b.start);
                  let lastIdx = 0;
                  const spans = [];
                  sorted.forEach((hl, i) => {
                    // Add unhighlighted text before this highlight
                    if (hl.start > lastIdx) {
                      spans.push(
                        <span key={`plain-${i}`}>{input.slice(lastIdx, hl.start)}</span>
                      );
                    }
                    // Add highlighted text
                    spans.push(
                      <span
                        key={`hl-${i}`}
                        style={{
                          backgroundColor:
                            hl.toolType === "Proof-reader"
                              ? "rgba(255, 193, 7, 0.3)"
                              : hl.toolType === "Argument Improver"
                              ? "rgba(76, 175, 80, 0.3)"
                              : hl.toolType === "Writing clarity"
                              ? "rgba(33, 150, 243, 0.3)"
                              : "#ff0",
                          borderRadius: "2px",
                          transition: "background-color 0.3s"
                        }}
                      >
                        {input.slice(hl.start, hl.end)}
                      </span>
                    );
                    lastIdx = hl.end;
                  });
                  // Add any remaining text
                  if (lastIdx < input.length) {
                    spans.push(
                      <span key={`plain-end`}>{input.slice(lastIdx)}</span>
                    );
                  }
                  return spans;
                })()}
              </div>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type your ${stageName.toLowerCase()} here...`}
                rows={25}
                style={{ 
                  width: "100%", 
                  boxSizing: "border-box",
                  backgroundColor: "transparent",
                  position: "relative",
                  zIndex: 1
                }}
                disabled={isTimedOut}
              />
            </div>
          ) : (
            // Regular textarea for non-revision stages
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type your ${stageName.toLowerCase()} here...`}
              rows={25}
              style={{ 
                  width: "100%", 
                  boxSizing: "border-box",
                  backgroundColor: "transparent",
                  position: "relative",
                  zIndex: 1
                }}
              disabled={isTimedOut}
            />
          )}

        </div>

        {/* Word count display below text box */}
        <div
          style={{
            textAlign: "right",
            fontSize: "12px",
            color: hasEnoughWords ? "#4CAF50" : "#ff6b6b",
            marginTop: "8px",
            fontWeight: "500"
          }}
        >
          {wordCount} / {wordCountRequirement} words
        </div>

        {/* Warning message */}
        {showWarning && (
          <div style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#ff9800",
            color: "white",
            padding: "10px 20px",
            borderRadius: "4px",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            animation: "fadeIn 0.3s ease-out"
          }}>
            <strong>Time Warning:</strong> {warningMessage}
          </div>
        )}

        {/* Timeout modal */}
        {isTimedOut && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "80%",
              textAlign: "center"
            }}>
              <h2>Time's Up!</h2>
              <p>You've reached the time limit for the {stageName} stage.</p>
              <p>Your progress has been saved.</p>
              <button 
                onClick={nextStage ? handleNextStage : handleSubmit}
                style={{
                  marginTop: "20px",
                  backgroundColor: "#4CAF50"
                }}
              >
                {nextStage ? `Continue to ${nextStage}` : "Submit Final Essay"}
              </button>
            </div>
          </div>
        )}

        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translate(-50%, -20px); }
              to { opacity: 1; transform: translate(-50%, 0); }
            }
          `}
        </style>

        <div style={{ marginTop: "1rem" }}>
          {nextStage ? (
            <button 
              onClick={handleNextStage} 
              disabled={loading || !hasEnoughWords}
              style={{ 
                cursor: (loading || !hasEnoughWords) ? 'not-allowed' : 'pointer',
                position: 'relative',
                minWidth: '280px',
                opacity: (loading || !hasEnoughWords) ? 0.6 : 1
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
            <button 
              onClick={handleSubmit}
              disabled={!hasEnoughWords}
              style={{ 
                cursor: !hasEnoughWords ? 'not-allowed' : 'pointer',
                opacity: !hasEnoughWords ? 0.6 : 1
              }}
            >
              Submit Final Essay
            </button>
          )}
        </div>
      </div>
      
      {/* Always render sidebar for consistent layout */}
      <div
        className="sidebar"
        ref={sidebarRef}
        style={
          !(showPreviousContent || hasAISupport)
            ? {
                background: "#fff",
                border: "none",
                boxShadow: "none",
                opacity: 1,
                width: "100%",
                height: "100%",
                minHeight: 0,
                minWidth: 0,
                padding: 0,
                margin: 0,
                pointerEvents: "none"
              }
            : undefined
        }
      >
        {/* Previous content display for "no support" condition */}
        {showPreviousContent && (
          <>
            <h3>{stageName === "Draft" ? "Your Outline" : "Your Draft"}</h3>
            <div style={{ 
              marginTop: "1rem", 
              whiteSpace: "pre-wrap",
              padding: "10px",
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "5px"
            }}>
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
            
            <div style={{ marginTop: "1rem" }}>
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
            
            <div style={{ marginTop: "1rem" }}>
              {loading ? (
                <p>Loading ideas…</p>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{ideas}</ReactMarkdown>
              )}
            </div>
          </>
        )}
        
        {/* AI Revision support - USING NEW COMPONENT */}
        {hasAISupport && stageName === "Revision" && (
          <RevisionTools 
            input={input}
            revisionResults={revisionResults}
            setRevisionResults={setRevisionResults}
            issueMap={issueMap}
            setIssueMap={setIssueMap}
            highlightedText={highlightedText}
            setHighlightedText={setHighlightedText}
            activeIssueId={activeIssueId}
            setActiveIssueId={setActiveIssueId}
            sidebarRef={sidebarRef}
            textareaRef={textareaRef}
            setInput={setInput} // <-- pass setInput here
          />
        )}
        {/* If no content, render nothing (blank sidebar) */}
        {!(showPreviousContent || hasAISupport) && <div style={{ width: '100%', height: '100%' }}></div>}
      </div>
    </div>
  );
}