// RevisionTools.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { llmPrompts } from "./config";
import loggingService from './loggingService.js';

const apiUrl = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = apiUrl;

const RevisionTools = ({ 
  input, 
  revisionResults, 
  setRevisionResults, 
  issueMap, 
  setIssueMap, 
  highlightedText, 
  setHighlightedText,
  activeIssueId,
  setActiveIssueId,
  sidebarRef,
  textareaRef
}) => {
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [activeRevisionType, setActiveRevisionType] = useState("");
  const [hoveredIssueId, setHoveredIssueId] = useState(null);

  // Define revision tools with descriptions for tooltips and highlight colors
  const revisionTools = [
    {
      id: "Argument Improver",
      description: "Identify weak arguments and confusing points",
      color: "#4CAF50" // Green for content issues
    },
    {
      id: "Writing clarity",
      description: "Highlight unclear or hard to follow passages",
      color: "#2196F3" // Blue for clarity issues
    },
    {
      id: "Proof-reader",
      description: "Find typos, grammatical mistakes, and misplaced punctuation",
      color: "#FFC107" // Yellow for proofreading issues
    }
  ];

  // Get the color for a specific tool type
  const getToolColor = (toolType) => {
    const tool = revisionTools.find(t => t.id === toolType);
    return tool ? tool.color : "#999";
  };

  // Helper functions for highlightIssuesInTextarea
  const generateCharMap = (input, issueMap) => {
    // Initialize character array
    const charMap = input.split('').map((char, index) => ({
      char,
      index,
      issues: [],        // List of issue IDs this char belongs to
      toolTypes: [],     // Optional: for rendering styles
      fixedFlags: []     // Optional: if some issues are already fixed
    }));

    // Loop through each issue and mark character positions
    Object.entries(issueMap).forEach(([issueId, issue]) => {
      const { text, toolType, fixed } = issue;

      // Find all matching positions of the problematic text
      let pos = input.indexOf(text);
      while (pos !== -1) {
        const end = pos + text.length;

        for (let i = pos; i < end; i++) {
          if (!charMap[i]) continue; // skip out-of-bounds (shouldn't happen)

          charMap[i].issues.push(issueId);
          charMap[i].toolTypes.push(toolType);
          charMap[i].fixedFlags.push(fixed);
        }

        pos = input.indexOf(text, pos + 1);
      }
    });

    return charMap;
  };

  const groupCharMapIntoSpans = (charMap) => {
    if (charMap.length === 0) return [];

    const spans = [];
    let currentSpan = {
      text: charMap[0].char,
      issues: [...charMap[0].issues],
      toolTypes: [...charMap[0].toolTypes],
      fixedFlags: [...charMap[0].fixedFlags]
    };

    for (let i = 1; i < charMap.length; i++) {
      const charData = charMap[i];

      const sameIssues = arraysEqual(currentSpan.issues, charData.issues);
      const sameTools = arraysEqual(currentSpan.toolTypes, charData.toolTypes);
      const sameFixed = arraysEqual(currentSpan.fixedFlags, charData.fixedFlags);

      if (sameIssues && sameTools && sameFixed) {
        currentSpan.text += charData.char;
      } else {
        spans.push(currentSpan);
        currentSpan = {
          text: charData.char,
          issues: [...charData.issues],
          toolTypes: [...charData.toolTypes],
          fixedFlags: [...charData.fixedFlags]
        };
      }
    }

    spans.push(currentSpan);
    return spans;
  };

  // Helper: compare arrays for shallow equality
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  // Function to highlight issues in the textarea - now using underlines instead of highlights
  const highlightIssuesInTextarea = (currentIssueMap) => {
    // Only proceed if we have text to highlight
    if (!input || input.length === 0) {
      setHighlightedText([]);
      return;
    }
    
    // Filter out Argument Improver issues since they don't have specific text to highlight
    const highlightableIssues = Object.fromEntries(
      Object.entries(currentIssueMap).filter(([id, issue]) => issue.toolType !== "Argument Improver")
    );
    
    const charMap = generateCharMap(input, highlightableIssues);
    const spans = groupCharMapIntoSpans(charMap);
    setHighlightedText(spans);
  };

  // Function to check if issues have been resolved
  const checkIssueResolution = () => {
    const updatedIssueMap = { ...issueMap };
    let hasChanges = false;
    
    Object.entries(updatedIssueMap).forEach(([id, issue]) => {
      // Skip Argument Improver issues since they don't have specific text to check
      if (issue.toolType === "Argument Improver") return;
      
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

  // Modified to always display all results
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

      // Handle all tools with the same format now
      const issueSections = results.split(/### Issue \d+/g).slice(1);
      let issueNumber = 1;

      issueSections.forEach(section => {
        const lines = section.trim().split('\n').map(line => line.trim());
        let problematicText = null;
        let issueDescription = null;
        let fix = null;

        // Extract problematic text (first line that starts with > and includes a quote)
        for (let line of lines) {
          if (line.startsWith('>') && (line.includes('"') || line.includes('"'))) {
            problematicText = line.replace(/^>\s*/, '').trim();
            if ((problematicText.startsWith('"') && problematicText.endsWith('"')) ||
                (problematicText.startsWith('"') && problematicText.endsWith('"'))) {
              problematicText = problematicText.slice(1, -1).trim();
            }
            break;
          }
        }

        // Extract issue and fix/suggestion lines
        for (let line of lines) {
          if (line.toLowerCase().startsWith('**issue**') || line.toLowerCase().startsWith('> **issue**')) {
            issueDescription = line.replace(/^>?\s*\*\*issue\*\*[:：]?\s*/i, '').trim();
          } else if (line.toLowerCase().startsWith('**fix**') || line.toLowerCase().startsWith('> **fix**')) {
            fix = line.replace(/^>?\s*\*\*fix\*\*[:：]?\s*/i, '').trim();
            if ((fix.startsWith('"') && fix.endsWith('"')) ||
                (fix.startsWith('"') && fix.endsWith('"'))) {
              fix = fix.slice(1, -1).trim();
            }
          } else if (line.toLowerCase().startsWith('**suggestion**') || line.toLowerCase().startsWith('> **suggestion**')) {
            fix = line.replace(/^>?\s*\*\*suggestion\*\*[:：]?\s*/i, '').trim();
          }
        }

        // For Argument Improver, we don't need problematic text to be present
        // For other tools, require the text to be found in the input
        if (toolType === "Argument Improver" || (problematicText && problematicText.length > 0 && input.includes(problematicText))) {
          const issueId = `${toolType}-${issueNumber}`;
          newIssueMap[issueId] = {
            text: problematicText || "",
            issueDescription: issueDescription || '',
            fix: fix || '',
            toolType: toolType,
            fixed: false,
            number: issueNumber
          };
          issueNumber++;
        }
      });

      console.log(`Processed results for ${toolType}`);
    });

    setIssueMap(newIssueMap);
    highlightIssuesInTextarea(newIssueMap);
  };

  // Process issues after revision results change
  useEffect(() => {
    if (Object.keys(revisionResults).length > 0) {
      processRevisionResults();
    }
  }, [revisionResults]);

  // Update highlights when issueMap changes
  useEffect(() => {
    updateHighlightsBasedOnVisibility();
  }, [issueMap, hoveredIssueId]);

  useEffect(() => {
    // every keystroke re‑evaluates the segment list
    updateHighlightsBasedOnVisibility();   // uses the new algorithm above
  }, [input, issueMap, hoveredIssueId]);

  // Check if issues have been resolved when input changes
  useEffect(() => {
    checkIssueResolution();
  }, [input]);

  // Improved scroll function to position issue at 1/3 of sidebar height
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

  // AI REVISION TOOL HANDLER with better formatting instructions
  const handleRevisionTool = async (toolType) => {
    loggingService.logButtonClick(`revision_tool:${toolType}`);
    const start = Date.now();
    try {
      setRevisionLoading(true);
      setActiveRevisionType(toolType);
      
      // Map the tool type to the corresponding prompt
      const promptMap = {
        "Proof-reader": llmPrompts.proofreader,
        "Argument Improver": llmPrompts.contentpolisher,
        "Writing clarity": llmPrompts.writingclarity
      };
      
      // Use the appropriate prompt from the map
      const promptFn = promptMap[toolType];
      if (!promptFn) {
        throw new Error(`No prompt found for revision tool: ${toolType}`);
      }
      
      const prompt = promptFn(input);
      
      const response = await axios.post("/api/openai", {
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
      loggingService.logApiCall('openai', prompt, response.data.completion, 'success', Date.now() - start);
      
    } catch (error) {
      console.error(`Error with ${toolType}:`, error);
      setRevisionResults(prev => ({
        ...prev,
        [toolType]: `Failed to use ${toolType}. Please try again.`
      }));
      loggingService.logApiCall('openai', prompt, error?.toString() || '', 'error', Date.now() - start);
    } finally {
      setRevisionLoading(false);
      setActiveRevisionType("");
    }
  };

  // Handle mouse enter for blockquote to highlight text in the textarea
  const handleBlockquoteHover = (issueId, isEnter) => {
    if (isEnter) {
      setHoveredIssueId(issueId);
    } else if (hoveredIssueId === issueId) {
      setHoveredIssueId(null);
    }
  };

  return (
    <>
      <h3>Revision Tools</h3>
      
      {/* Display a legend for the underline colors */}
      <div className="revision-legend">
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
            
            {/* Always show results if they exist, no toggle needed */}
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
                
                <div className="revision-results-content">
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
                            if (issue.toolType !== "Argument Improver") {
                              scrollEditorToIssue(issue);
                            }
                            pulseSidebarCard(id);
                          }}
                          style={{
                            borderLeft: `4px solid ${tool.color}`,
                            backgroundColor: issue.fixed ? '#f0f0f0' : `${tool.color}11`,
                            opacity: issue.fixed ? 0.6 : 1,
                            boxShadow: activeIssueId === id ? `0 0 0 2px ${tool.color}` : 'none',
                          }}
                        >
                          {issue.toolType === "Argument Improver" ? (
                            // Render Argument Improver format (Issue/Suggestion)
                            <>
                              <p style={{ marginBottom: '4px' }}>
                                <strong style={{ color: tool.color }}>Issue:</strong> {issue.issueDescription}
                              </p>
                              <p>
                                <strong style={{ color: tool.color }}>Suggestion:</strong> {issue.fix}
                              </p>
                            </>
                          ) : (
                            // Render original format for other tools (Problem/Issue/Fix)
                            <>
                              <p style={{ marginBottom: '4px' }}>
                                <strong style={{ color: tool.color }}>Problem:</strong> "{issue.text}"
                              </p>
                              <p style={{ marginBottom: '4px' }}>
                                <strong style={{ color: tool.color }}>Issue:</strong> {issue.issueDescription}
                              </p>
                              <p>
                                <strong style={{ color: tool.color }}>Fix:</strong> "{issue.fix}"
                              </p>
                            </>
                          )}
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
  );
};

export default RevisionTools; 