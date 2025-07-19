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
  const [collapsedCards, setCollapsedCards] = useState(new Set());
  const [dismissedCards, setDismissedCards] = useState(new Set());


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
    }
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

        // All tools now require the quoted text to be found in the input
        if (problematicText && problematicText.length > 0 && input.includes(problematicText)) {
          const issueId = `${toolType}-${issueNumber}`;
          newIssueMap[issueId] = {
            text: problematicText,
            issueDescription: issueDescription || '',
            fix: fix || '',
            toolType: toolType,
            fixed: false,
            number: issueNumber
          };
          issueNumber++;
        } else if (problematicText && problematicText.length > 0) {
          // Log when quoted text isn't found (for debugging)
          console.log(`Quoted text not found in input for ${toolType}: "${problematicText}"`);
        }
      });

      console.log(`Processed results for ${toolType}`);
    });

    setIssueMap(newIssueMap);
  };

  // Process issues after revision results change
  useEffect(() => {
    if (Object.keys(revisionResults).length > 0) {
      processRevisionResults();
    }
  }, [revisionResults]);



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

  // Helper function to truncate text to one line
  const truncateToLine = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  // Toggle card collapse state
  const toggleCardCollapse = (issueId) => {
    setCollapsedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  // Toggle card dismiss state
  const toggleCardDismiss = (issueId) => {
    setDismissedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
        // Auto-collapse when dismissing
        setCollapsedCards(collapsed => new Set([...collapsed, issueId]));
      }
      return newSet;
    });
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



  return (
    <>
      <h3>Revision Tools</h3>
      

      
      {/* Render revision tools */}
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
            
            {/* Show results directly in sidebar */}
            {revisionResults[tool.id] && (
              <div style={{ marginTop: "10px" }}>
                {Object.entries(issueMap)
                  .filter(([id, issue]) => issue.toolType === tool.id)
                  .map(([id, issue]) => (
                    <blockquote
                      key={id}
                      data-sidebar-issue-id={id}
                      style={{
                        borderLeft: `4px solid ${tool.color}`,
                        backgroundColor: issue.fixed ? '#f0f0f0' : `${tool.color}11`,
                        opacity: (issue.fixed || dismissedCards.has(id)) ? 0.6 : 1,
                        boxShadow: activeIssueId === id ? `0 0 0 2px ${tool.color}` : 'none',
                        margin: collapsedCards.has(id) ? "2px 0" : "8px 0",
                        padding: collapsedCards.has(id) ? "6px 12px" : "12px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        lineHeight: collapsedCards.has(id) ? "1.2" : "1.4",
                        position: "relative"
                      }}
                    >
                      {/* Action buttons */}
                      <div style={{ 
                        position: "absolute", 
                        top: collapsedCards.has(id) ? "2px" : "8px", 
                        right: "8px", 
                        display: "flex", 
                        gap: "4px",
                        zIndex: 1
                      }}>
                        {!collapsedCards.has(id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveIssueId(id);
                              scrollEditorToIssue(issue);
                              pulseSidebarCard(id);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: "10px",
                              color: "#666",
                              cursor: "pointer",
                              padding: "2px 4px",
                              borderRadius: "2px"
                            }}
                            title="Highlight relevant text in essay"
                          >
                            Highlight
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardCollapse(id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "10px",
                            color: "#666",
                            cursor: "pointer",
                            padding: "2px 4px",
                            borderRadius: "2px"
                          }}
                          title={collapsedCards.has(id) ? "Show details" : "Hide details"}
                        >
                          {collapsedCards.has(id) ? "Show" : "Hide"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardDismiss(id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "10px",
                            color: dismissedCards.has(id) ? "#999" : "#666",
                            cursor: "pointer",
                            padding: "2px 4px",
                            borderRadius: "2px"
                          }}
                          title={dismissedCards.has(id) ? "Restore" : "Dismiss"}
                        >
                          {dismissedCards.has(id) ? "Restore" : "Dismiss"}
                        </button>
                      </div>

                      {collapsedCards.has(id) ? (
                        /* Collapsed view - just the quoted text */
                        <div style={{ 
                          fontStyle: "italic", 
                          color: dismissedCards.has(id) ? "#999" : "#555",
                          padding: "2px 0",
                          marginRight: "80px" // Space for the two remaining buttons
                        }}>
                          "{truncateToLine(issue.text)}"
                        </div>
                      ) : (
                        /* Expanded view - full content */
                        <>
                          {/* Quoted text at the top without label */}
                          {issue.text && (
                            <div style={{ 
                              marginBottom: "8px", 
                              fontStyle: "italic", 
                              color: "#555",
                              backgroundColor: "#f8f8f8",
                              padding: "6px 8px",
                              borderRadius: "3px",
                              border: "1px solid #e0e0e0",
                              marginTop: "15px"
                            }}>
                              "{issue.text}"
                            </div>
                          )}
                          
                          {/* Issue and Fix/Suggestion with clear visual hierarchy */}
                          <div style={{ marginBottom: "6px" }}>
                            <strong style={{ color: tool.color, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Issue:
                            </strong>
                            <span style={{ marginLeft: "4px" }}>{issue.issueDescription}</span>
                          </div>
                          
                          <div>
                            <strong style={{ color: tool.color, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {issue.toolType === "Argument Improver" ? "Suggestion:" : "Fix:"}
                            </strong>
                            <span style={{ marginLeft: "4px" }}>
                              {issue.toolType === "Argument Improver" ? issue.fix : `"${issue.fix}"`}
                            </span>
                          </div>
                        </>
                      )}
                    </blockquote>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default RevisionTools; 