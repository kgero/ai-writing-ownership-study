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
  
  // FIX: Remove showRevisionResults toggling - always show all results
  // const [showRevisionResults, setShowRevisionResults] = useState({});
  
  // NEW: Track problematic text and their status
  const [issueMap, setIssueMap] = useState({});
  const [highlightedText, setHighlightedText] = useState([]);
  const [hoveredIssueId, setHoveredIssueId] = useState(null);
  const textareaRef = useRef(null);
  const sidebarRef = useRef(null);
  
  // For improved revision highlighting/underlining
  // highlight / navigation helpers
  const [activeIssueId, setActiveIssueId] = useState(null);   // ← clicked item
  const [collapseResolved, setCollapseResolved] = useState(false); // sidebar filter

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
    
    // NEW: Check if issues have been resolved when input changes
    checkIssueResolution();
  }, [input, stageName]);

  // Process issues after revision results change
  // FIX: Modified to ensure highlighting happens immediately when revision results are added
  useEffect(() => {
    if (Object.keys(revisionResults).length > 0) {
      processRevisionResults();
    }
  }, [revisionResults]);

  // FIX: Update highlights when issueMap changes
  useEffect(() => {
    updateHighlightsBasedOnVisibility();
  }, [issueMap, hoveredIssueId]);

  useEffect(() => {
    // every keystroke re‑evaluates the segment list
    if (stageName === "Revision" && hasAISupport) {
      updateHighlightsBasedOnVisibility();   // uses the new algorithm above
    }
  }, [input, issueMap, hoveredIssueId]);

  // FIX: Modified to always display all results
  const updateHighlightsBasedOnVisibility = () => {
    // Make a copy of the issue map to work with
    const visibleIssueMap = { ...issueMap };
    
    // Update highlighting with all issues
    highlightIssuesInTextarea(visibleIssueMap);
  };

  // Parse LLM response from revision tool to extract issues w essay
  const processRevisionResults = () => {
    const newIssueMap = { ...issueMap };

    Object.entries(revisionResults).forEach(([toolType, results]) => {
      if (!results) return;

      // Clear previous issues for this tool
      Object.keys(newIssueMap).forEach(id => {
        if (id.startsWith(toolType)) {
          delete newIssueMap[id];
        }
      });

      const issueSections = results.split(/### Issue \d+/g).slice(1);
      let issueNumber = 1;

      issueSections.forEach(section => {
        console.log("IssueSection", section)
        const lines = section.trim().split('\n').map(line => line.trim());
        let problematicText = null;
        let issueDescription = null;
        let fix = null;

        // Extract problematic text (first line that starts with > and includes a quote)
        for (let line of lines) {
          if (line.startsWith('>') && (line.includes('"') || line.includes('“'))) {
            problematicText = line.replace(/^>\s*/, '').trim();
            if ((problematicText.startsWith('"') && problematicText.endsWith('"')) ||
                (problematicText.startsWith('“') && problematicText.endsWith('”'))) {
              problematicText = problematicText.slice(1, -1).trim();
            }
            break;
          }
        }

        // Extract issue and fix lines
        for (let line of lines) {
          if (line.toLowerCase().startsWith('**issue**') || line.toLowerCase().startsWith('> **issue**')) {
            issueDescription = line.replace(/^>?\s*\*\*issue\*\*[:：]?\s*/i, '').trim();
          } else if (line.toLowerCase().startsWith('**fix**') || line.toLowerCase().startsWith('> **fix**')) {
            fix = line.replace(/^>?\s*\*\*fix\*\*[:：]?\s*/i, '').trim();
            if ((fix.startsWith('"') && fix.endsWith('"')) ||
                (fix.startsWith('“') && fix.endsWith('”'))) {
              fix = fix.slice(1, -1).trim();
            }
          }
        }

        if (problematicText && problematicText.length > 0 && input.includes(problematicText)) {
          const issueId = `${toolType}-${issueNumber}`;
          console.log(`Found issue ${issueId}: "${problematicText}" | Issue: ${issueDescription} | Fix: ${fix}`);
          newIssueMap[issueId] = {
            text: problematicText,
            issueDescription: issueDescription || '',
            fix: fix || '',
            toolType: toolType,
            fixed: false,
            number: issueNumber
          };
          issueNumber++;
        }
      });

      console.log(`Extracted ${issueNumber - 1} issues for ${toolType}`);
    });

    setIssueMap(newIssueMap);
    highlightIssuesInTextarea(newIssueMap);
  };


  // MODIFIED: Function to highlight issues in the textarea - now using underlines instead of highlights
  const highlightIssuesInTextarea = (currentIssueMap) => {
    // Only proceed if we have text to highlight
    if (!input || input.length === 0) {
      setHighlightedText([]);
      return;
    }
    
    const newHighlightedText = [];
    
    // Sort issues by their position in the text to handle overlapping issues
    const issues = Object.entries(currentIssueMap).map(([id, issue]) => {
      // Find all occurrences of the text in the input
      const allMatches = [];
      let pos = input.indexOf(issue.text);
      while (pos !== -1) {
        allMatches.push({
          startIndex: pos,
          endIndex: pos + issue.text.length
        });
        pos = input.indexOf(issue.text, pos + 1);
      }
      
      // If we found any matches, create an issue for each occurrence
      if (allMatches.length > 0) {
        return allMatches.map((match, idx) => ({
          id: `${id}-${idx}`,
          issue,
          startIndex: match.startIndex,
          endIndex: match.endIndex
        }));
      }
      
      // No matches found
      return [{
        id,
        issue,
        startIndex: -1,
        endIndex: -1
      }];
    })
    .flat()
    .filter(item => item.startIndex >= 0);

    // Sort by startIndex and then by length (longer issues first) 
    issues.sort((a, b) => {
      if (a.startIndex === b.startIndex) {
        return b.endIndex - b.startIndex - (a.endIndex - a.startIndex);
      }
      return a.startIndex - b.startIndex;
    });
        
    if (issues.length === 0) {
      // No valid issues found, just return the plain text
      newHighlightedText.push({
        text: input,
        isIssue: false
      });
    } else {
      let lastIndex = 0;
      
      // Create segments of regular text and underlined issues
      issues.forEach(({ id, issue, startIndex, endIndex }) => {
        if (startIndex > lastIndex) {
          newHighlightedText.push({
            text: input.substring(lastIndex, startIndex),
            isIssue: false
          });
        }
        
        newHighlightedText.push({
          text: issue.text,
          isIssue: true,
          issueId: id.split('-')[0], // Use the base ID for hover functionality
          toolType: issue.toolType,
          number: issue.number,
          fixed: issue.fixed,
          isHovered: id.split('-')[0] === hoveredIssueId
        });
        
        lastIndex = endIndex;
      });
      
      // Add the remaining text
      if (lastIndex < input.length) {
        newHighlightedText.push({
          text: input.substring(lastIndex),
          isIssue: false
        });
      }
    }
    
    setHighlightedText(newHighlightedText);
  };

  // IMPROVED: Function to check if issues have been resolved
  const checkIssueResolution = () => {
    const updatedIssueMap = { ...issueMap };
    let hasChanges = false;
    
    Object.entries(updatedIssueMap).forEach(([id, issue]) => {
      const isTextPresent = input.includes(issue.text);
      if (issue.fixed !== !isTextPresent) {
        updatedIssueMap[id].fixed = !isTextPresent;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setIssueMap(updatedIssueMap);
      // Only update highlights for visible result panels
      updateHighlightsBasedOnVisibility();
    }
  };

  // FIX: Improved scroll function to position issue at 1/3 of sidebar height
  const scrollSidebarToIssue = (issueId) => {
    // Find the blockquote element for this issue
    const blockquote = document.querySelector(`[data-sidebar-issue-id="${issueId}"]`);
    if (!blockquote || !sidebarRef.current) return;
    
    // Get the positions
    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    const blockquoteRect = blockquote.getBoundingClientRect();
    
    // Calculate the scroll position to place blockquote at 1/3 height
    const oneThirdHeight = sidebarRect.height / 3;
    const desiredScrollTop = blockquoteRect.top - sidebarRect.top - oneThirdHeight + sidebarRef.current.scrollTop;
    
    // Scroll the sidebar
    sidebarRef.current.scrollTo({
      top: desiredScrollTop,
      behavior: "smooth"
    });
  };

  // Scroll the editor so an issue is roughly centred
  const scrollEditorToIssue = (issue) => {
    const pos = input.indexOf(issue.text);
    if (pos === -1 || !textareaRef.current) return;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(pos, pos + issue.text.length);
    textareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Pulse a sidebar card once for visual feedback
  const pulseSidebarCard = (issueId) => {
    const card = document.querySelector(`[data-sidebar-issue-id="${issueId}"]`);
    if (!card) return;
    card.classList.add("pulse-border");
    setTimeout(() => card.classList.remove("pulse-border"), 600);
  };


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
      console.log(`${stageName} snapshot at`, new Date().toISOString());
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

  // IMPROVED: AI REVISION TOOL HANDLER with better formatting instructions
  const handleRevisionTool = async (toolType) => {
    try {
      setRevisionLoading(true);
      setActiveRevisionType(toolType);
      
      // UPDATED: Enhanced prompts that explicitly number issues and use consistent formatting
      const shortProofreader = (draft) => `
        Please briefly review the following essay for the most critical typos, grammatical mistakes, and punctuation issues:
        
        ${draft}
        
        Identify only 2-3 of the most important issues. For each issue:
        1. Number the issue (Issue 1, Issue 2, etc.)
        2. Quote the problematic phrase EXACTLY as it appears in the text (keep it under 10 words), using "double quotes".
        3. Very briefly explain the problem in 5-10 words.
        4. Suggest a concise fix.
        
        Format as:
        ### Issue 1
        > "problematic text"
        >
        > **Issue**: Brief explanation
        >
        > **Fix**: "corrected version"
        
        Be extremely concise. Only identify actual errors.
        The quoted "problematic text" must appear EXACTLY as written in the original text - this is critical.
      `;
      
      const shortContentPolisher = (draft) => `
        Please briefly review the following essay for the most significant weak arguments:
        
        ${draft}
        
        Identify only 2-3 of the most important issues. For each issue:
        1. Number the issue (Issue 1, Issue 2, etc.)
        2. Quote the relevant phrase EXACTLY as it appears in the text (keep it under 10 words), using "double quotes".
        3. Very briefly explain the weakness in 5-10 words.
        4. Suggest a specific, concise improvement.
        
        Format as:
        ### Issue 1
        > "weak argument"
        >
        > **Issue**: Brief explanation
        >
        > **Fix**: Suggested improvement
        
        Be extremely concise. Focus only on substantive improvements.
        The quoted "weak argument" must appear EXACTLY as written in the original text - this is critical.
      `;
      
      const shortWritingClarity = (draft) => `
        Please briefly review the following essay for the most unclear passages:
        
        ${draft}
        
        Identify only 2-3 of the most problematic passages. For each issue:
        1. Number the issue (Issue 1, Issue 2, etc.)
        2. Quote the unclear phrase EXACTLY as it appears in the text (keep it under 10 words), using "double quotes".
        3. Very briefly explain the clarity issue in 5-10 words.
        4. Suggest a clearer alternative.
        
        Format as:
        ### Issue 1
        > "unclear text"
        >
        > **Issue**: Brief explanation
        >
        > **Fix**: "clearer version"
        
        Be extremely concise. Focus only on clarity issues.
        The quoted "unclear text" must appear EXACTLY as written in the original text - this is critical.
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
      setRevisionResults(prev => {
        const newResults = {
          ...prev,
          [toolType]: response.data.completion
        };
        return newResults;
      });
      
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

  // NEW: Handle mouse enter for blockquote to highlight text in the textarea
  const handleBlockquoteHover = (issueId, isEnter) => {
    if (isEnter) {
      setHoveredIssueId(issueId);
    } else if (hoveredIssueId === issueId) {
      setHoveredIssueId(null);
    }
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
  
  // Define revision tools with descriptions for tooltips and highlight colors
  const revisionTools = [
    {
      id: "Proof-reader",
      description: "Find typos, grammatical mistakes, and misplaced punctuation",
      color: "#FFC107" // Yellow for proofreading issues
    },
    {
      id: "Content polisher",
      description: "Identify weak arguments and confusing points",
      color: "#4CAF50" // Green for content issues
    },
    {
      id: "Writing clarity",
      description: "Highlight unclear or hard to follow passages",
      color: "#2196F3" // Blue for clarity issues
    }
  ];
  
  // Get the color for a specific tool type
  const getToolColor = (toolType) => {
    const tool = revisionTools.find(t => t.id === toolType);
    return tool ? tool.color : "#999";
  };
  
  return (
    <div className="container">
      <div className="editor" style={editorStyle}>
        <h1>{stageName} Stage</h1>
        <p>{stageConfig.instructions[stageName.toLowerCase()]}</p>
        <p style={{ fontStyle: "italic" }}>{promptText}</p>
        
        <div style={{ position: "relative" }}>
          {/* Replace the textarea with a div for highlighting when in Revision stage */}
          {stageName === "Revision" && hasAISupport ? (
            <div className="highlighted-textarea-container">
              <div 
                className="highlight-layer"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  boxSizing: "border-box",
                  padding: "8px",
                  pointerEvents: "none",
                  whiteSpace: "pre-wrap",
                  overflow: "hidden",
                  backgroundColor: "transparent",
                  color: "transparent"
                }}
              >
                {highlightedText.map((segment, index) => (
                  segment.isIssue ? (
                    <span
                      key={index}
                      data-issue-id={segment.issueId}
                      onClick={() => {
                        // ① mark as active
                        setActiveIssueId(segment.issueId);
                        // ② scroll the editor so the text is centred
                        const issue = issueMap[segment.issueId];
                        if (issue) scrollEditorToIssue(issue);
                        // ③ pulse the sidebar card
                        pulseSidebarCard(segment.issueId);
                        // ④ scroll sidebar to position issue at 1/3
                        scrollSidebarToIssue(segment.issueId);
                      }}
                      style={{
                        cursor: 'pointer',
                        backgroundColor:
                          segment.isHovered || activeIssueId === segment.issueId
                            ? `${getToolColor(segment.toolType)}33`
                            : 'transparent',
                        borderBottomWidth: '2px',
                        borderBottomStyle: segment.multi ? 'dotted' : 'solid',   // ← dotted if overlap
                        borderBottomColor: segment.fixed
                          ? '#999'
                          : getToolColor(segment.toolType),
                        textDecoration: segment.fixed ? 'line-through' : 'none',
                        textUnderlineOffset: segment.multi ? '3px' : '0',
                        color: 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      {segment.text}
                    </span>

                  ) : (
                    <span key={index}>{segment.text}</span>
                  )
                ))}
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
              />
            </div>
          ) : (
            // Regular textarea for non-revision stages
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type your ${stageName.toLowerCase()} here...`}
              rows={25}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          )}

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
      <div className="sidebar" ref={sidebarRef}>
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
        
        {/* AI Revision support - UPDATED IMPLEMENTATION WITH FIXES */}
        {hasAISupport && stageName === "Revision" && (
          <>
            <h3>Revision Tools</h3>
            
            {/* Display a legend for the underline colors */}
            <div className="revision-legend" style={{ marginBottom: "15px" }}>
              {revisionTools.map(tool => (
                <div 
                  key={tool.id} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    marginBottom: "5px" 
                  }}
                >
                  <div 
                    style={{ 
                      width: "15px", 
                      height: "2px", 
                      backgroundColor: tool.color, 
                      marginRight: "8px"
                    }}
                  ></div>
                  <span style={{ fontSize: "12px" }}>{tool.id}</span>
                </div>
              ))}
            </div>
            
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
                      style={{ 
                        borderLeft: `5px solid ${tool.color}`,
                        backgroundColor: activeRevisionType === tool.id ? tool.color : undefined
                      }}
                    >
                      {revisionResults[tool.id] ? `Rerun ${tool.id}` : tool.id}
                      {activeRevisionType === tool.id && revisionLoading && (
                        <span className="loading-indicator">...</span>
                      )}
                    </button>
                  </div>
                  
                  {/* FIX: Always show results if they exist, no toggle needed */}
                  {revisionResults[tool.id] && (
                    <div className="revision-results">
                      <div 
                        className="revision-results-header"
                        style={{
                          display: "flex", 
                          justifyContent: "space-between",
                          padding: "8px",
                          backgroundColor: `${tool.color}22`,
                          borderLeft: `4px solid ${tool.color}`,
                          borderRadius: "4px 4px 0 0"
                        }}
                      >
                      </div>
                      
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
                        <div className="revision-results-content">
                          {Object.entries(issueMap)
                            .filter(([id, issue]) => issue.toolType === tool.id)
                            .map(([id, issue]) => (
                              <blockquote
                                key={id}
                                data-sidebar-issue-id={id}
                                onMouseEnter={() => handleBlockquoteHover(id, true)}
                                onMouseLeave={() => handleBlockquoteHover(id, false)}
                                onClick={() => {
                                  setActiveIssueId(id);
                                  scrollEditorToIssue(issue);
                                  pulseSidebarCard(id);
                                }}
                                style={{
                                  borderLeft: `4px solid ${tool.color}`,
                                  backgroundColor: issue.fixed ? '#f0f0f0' : `${tool.color}11`,
                                  opacity: issue.fixed ? 0.6 : 1,
                                  boxShadow: activeIssueId === id ? `0 0 0 2px ${tool.color}` : 'none',
                                  cursor: 'pointer',
                                  padding: '10px',
                                  marginBottom: '8px',
                                  borderRadius: '4px',
                                  transition: 'background-color 0.3s, box-shadow 0.2s'
                                }}
                              >
                                <p style={{ marginBottom: '4px' }}>
                                  <strong style={{ color: tool.color }}>Problem:</strong> "{issue.text}"
                                </p>
                                <p style={{ marginBottom: '4px' }}>
                                  <strong style={{ color: tool.color }}>Issue:</strong> {issue.issueDescription}
                                </p>
                                <p>
                                  <strong style={{ color: tool.color }}>Fix:</strong> "{issue.fix}"
                                </p>
                              </blockquote>
                            ))}
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add CSS for the highlighted text area */}
      <style>
        {`
          .highlighted-textarea-container {
            position: relative;
            width: 100%;
          }
          
          /* Make textarea and highlight layer have the same font metrics */
          .highlighted-textarea-container textarea,
          .highlight-layer {
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            letter-spacing: inherit;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 16px;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            overflow-y: auto;
          }
          
          /* Hide scrollbar from the highlight layer */
          .highlight-layer::-webkit-scrollbar {
            width: 0;
            height: 0;
          }
          
          /* FIX: Hover effects for blockquotes */
          .revision-results-content blockquote {
            transition: background-color 0.3s, box-shadow 0.3s;
          }
          
          .revision-results-content blockquote:hover {
            background-color: rgba(0, 0, 0, 0.05);
          }
        `}
      </style>
    </div>
  );
}