// IdeasList.jsx
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from "axios";
import { llmPrompts } from "./config";
import loggingService from './loggingService.js';

const apiUrl = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = apiUrl;

const IdeasList = ({ ideas, setIdeas, promptText }) => {
  const [expandedIdea, setExpandedIdea] = useState(null);
  const [outlines, setOutlines] = useState({});
  const [loadingOutline, setLoadingOutline] = useState(null);
  const [loadingNewIdea, setLoadingNewIdea] = useState(false);
  
  // Parse the ideas markdown into an array of idea objects
  const parseIdeas = () => {
    if (!ideas) return [];
    
    // Split the ideas by bullet points and filter out empty items
    const splitIdeas = ideas.split(/\n\s*[-*]\s+/).filter(item => item.trim());
    
    // Remove the first item if it's not an actual idea (could be intro text)
    const filteredIdeas = splitIdeas[0].startsWith('I') ? splitIdeas.slice(1) : splitIdeas;
    
    // Add position indicators (pro/con/alt) based on index for first 3 ideas
    return filteredIdeas.map((idea, index) => {
      let position = "";
      
      return {
        id: index + 1,
        text: idea.trim(),
        position: position
      };
    });
  };
  
  const parsedIdeas = parseIdeas();
  
  // Toggle the expanded state of an idea
  const toggleExpand = (ideaId) => {
    setExpandedIdea(expandedIdea === ideaId ? null : ideaId);
  };
  
  // Generate an outline for a specific idea
  const generateOutline = async (ideaId, ideaText) => {
    const buttonClickTime = Date.now();
    loggingService.logButtonClick('generate_outline');
    const start = Date.now();
    let prompt;
    try {
      setLoadingOutline(ideaId);
      
      // Use the ideaOutline prompt from config
      prompt = llmPrompts.ideaOutline(promptText, ideaText);
      
      const response = await axios.post("http://localhost:5001/api/openai", {
        prompt: prompt
      });
      
      // Save the outline for this idea
      setOutlines(prev => ({
        ...prev,
        [ideaId]: response.data.completion
      }));
      
      // Automatically expand to show the outline
      setExpandedIdea(ideaId);
      loggingService.logApiCall('openai', prompt, response.data.completion, 'success', Date.now() - start, {
        triggeredBy: 'generate_outline_button',
        buttonClickTimestamp: buttonClickTime
      });
      
    } catch (error) {
      console.error("Error generating outline:", error);
      setOutlines(prev => ({
        ...prev,
        [ideaId]: "Failed to generate outline. Please try again."
      }));
      loggingService.logApiCall('openai', prompt, error?.toString() || '', 'error', Date.now() - start, {
        triggeredBy: 'generate_outline_button',
        buttonClickTimestamp: buttonClickTime
      });
    } finally {
      setLoadingOutline(null);
    }
  };
  
  // Generate a new single idea
  const generateNewIdea = async () => {
    try {
      setLoadingNewIdea(true);
      
      // Get all existing ideas to pass to the prompt
      const existingIdeasList = parseIdeas().map(idea => idea.text).join("\n");
      
      // Use the singleIdea prompt from config with existing ideas
      const prompt = llmPrompts.singleIdea(promptText, existingIdeasList);
      
      const response = await axios.post("http://localhost:5001/api/openai", {
        prompt: prompt
      });
      
      const newIdea = response.data.completion;
      
      // Add the new idea to the existing ideas
      const newIdeasText = ideas ? 
        `${ideas}\n- ${newIdea}` : 
        `- ${newIdea}`;
        
      setIdeas(newIdeasText);
      
    } catch (error) {
      console.error("Error generating new idea:", error);
    } finally {
      setLoadingNewIdea(false);
    }
  };
  
  return (
    <div className="ideas-container">
      <ul className="ideas-list">
        {parsedIdeas.map((idea) => (
          <li key={idea.id} className="idea-item">
            <div className="idea-header">
              <span className="idea-number">{idea.id}.</span>
              <div className="idea-text">
                {idea.text}
                <span style={{ color: "#666", fontSize: "0.9em", fontStyle: "italic" }}>{idea.position}</span>
              </div>
              {/* Show button only if no outline exists yet */}
              {!outlines[idea.id] && (
                <button 
                  className="outline-button" 
                  onClick={() => generateOutline(idea.id, idea.text)}
                  disabled={loadingOutline === idea.id}
                >
                  {loadingOutline === idea.id ? "Loading..." : "Generate\nOutline"}
                </button>
              )}
              {outlines[idea.id] && (
                <button 
                  className="carat-button" 
                  onClick={() => toggleExpand(idea.id)}
                >
                  {expandedIdea === idea.id ? "▼" : "►"}
                </button>
              )}
            </div>
            
            {outlines[idea.id] && expandedIdea === idea.id && (
              <div className="idea-outline" style={{ 
                fontSize: "0.9em", 
                lineHeight: "1.4"
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {outlines[idea.id]}
                </ReactMarkdown>
              </div>
            )}
          </li>
        ))}
      </ul>
      
      <button 
        onClick={generateNewIdea} 
        disabled={loadingNewIdea}
        style={{ marginTop: "15px", width: "100%" }}
      >
        {loadingNewIdea ? "Generating new idea..." : "Get Another Idea"}
      </button>
    </div>
  );
};

export default IdeasList;