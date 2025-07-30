// FormPage.jsx
import React from "react";
import axios from 'axios';
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import loggingService from './loggingService.js';

const apiUrl = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = apiUrl;


export default function FormPage() {
  const { condition, promptSet, promptId } = useParams();
  const navigate = useNavigate();

  // For dev toggling "required" off, set devMode = true
  // Switch to false for production
  const devMode = false;

  // Initialize React Hook Form
  // register => function to connect inputs to the form
  // handleSubmit => handles the form’s onSubmit
  // formState => object holding validation errors and other metadata
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Called by handleSubmit when form is valid
  const onSubmit = (data) => {
    console.log("Form data:", data);

    // For multi-select checkboxes, transform the data format
    if (data.aiToolsUsed) {
      // Convert from object format to array of selected values
      const selectedTools = Object.keys(data.aiToolsUsed)
        .filter(key => data.aiToolsUsed[key] === true)
        .map(key => key);
      
      // Replace the original format with the array
      data.aiToolsUsed = selectedTools;
    }
  
    // Get participant ID from loggingService
    const participantId = loggingService.getParticipantId();

    // Get session ID from loggingService
    const sessionId = loggingService.getOrCreateSessionId();

    // Add metadata about the survey
    const surveyData = {
      participant_id: participantId,
      session_id: sessionId,
      survey_type: "pre", 
      prompt_id: promptId,
      condition: condition,
      responses: data,
      timestamp: new Date().toISOString()
    };
    
    // Submit to backend
    axios.post('/api/survey/submit', surveyData)
      .then(response => {
        console.log("Survey submitted successfully:", response.data);
        navigate(`/outline/${condition}/${promptSet}/${promptId}`); 
      })
      .catch(error => {
        console.error("Error submitting survey:", error);
        // Handle error?? got to next stage anyway...
        navigate(`/outline/${condition}/${promptSet}/${promptId}`);
      });
  };

  const statementsNFC = [
    "I prefer complex to simple problems.",
    "I like tasks that require little thought once I've learned them.",
    "Learning new ways to think doesn't excite me very much.",
    "I prefer a task that is intellectual and difficult to one that requires little thought.",
  ];

  const statementsTechAccept = [
    "I find new technologies easy to use.",
    "Learning to use new technologies is easy for me.",
    "I find new technologies useful in my daily life.",
    "Using new technologies increases my productivity.",
  ];

  const statementsAIwriting = [
    "I feel confident in my ability to use AI writing tools effectively.",
    "I believe AI writing tools can improve my writing quality.",
  ];

  const statementsWritingEfficacy = [
    "I can come up with creative ideas for my writing.",
    "I can organize my ideas in a logical way.",
    "I can write grammatically correct sentences.",
    "I can revise my own writing effectively.",
    "I can craft persuasive arguments in writing.",
    "I can write concisely without unnecessary details.",
    "I can structure an engaging introduction.",
    "Overall, I am confident in my writing abilities.",
  ];

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Pre-Task Survey</h2>

      <form onSubmit={handleSubmit(onSubmit)} style={{ margin: "2rem auto" }}>

        {/* RADIO SELECT */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="survey-question">
            What is your age?
          </p>

          {["18-25", "26-35", "36-45", "46-55", "56 or over"].map((option) => (
            <label key={option} style={{ display: "block", marginBottom: "0.25rem" }}>
              <input
                type="radio"
                value={option}
                // Hook Form uses the same name for radio group
                {...register("age", { required: !devMode })}
              />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}

          {errors.age && (
            <p style={{ color: "red" }}>Please select your age.</p>
          )}
        </div>

        {/* RADIO SELECT */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="survey-question">
            What is your gender?
          </p>

          {["male", "female", "non-binary/third gender", "prefer not to disclose"].map((option) => (
            <label key={option} style={{ display: "block", marginBottom: "0.25rem" }}>
              <input
                type="radio"
                value={option}
                // Hook Form uses the same name for radio group
                {...register("gender", { required: !devMode })}
              />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}

          {errors.gender && (
            <p style={{ color: "red" }}>Please select your gender.</p>
          )}
        </div>

        {/* RADIO SELECT */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="survey-question">
            What is your highest level of education?
          </p>

          {["High school diploma", "Bachelor's degree", "Master's degree", "Doctorate", "Other"].map((option) => (
            <label key={option} style={{ display: "block", marginBottom: "0.25rem" }}>
              <input
                type="radio"
                value={option}
                // Hook Form uses the same name for radio group
                {...register("education", { required: !devMode })}
              />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}

          {errors.education && (
            <p style={{ color: "red" }}>Please select your level of education.</p>
          )}
        </div>

        {/* RADIO SELECT */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="survey-question">
            Is English your native language?
          </p>

          {["Yes", "No"].map((option) => (
            <label key={option} style={{ display: "block", marginBottom: "0.25rem" }}>
              <input
                type="radio"
                value={option}
                // Hook Form uses the same name for radio group
                {...register("nativeEnglish", { required: !devMode })}
              />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}

          {errors.nativeEnglish && (
            <p style={{ color: "red" }}>Please select yes or no.</p>
          )}
        </div>

        {/* Need for Cognition Questions */}
        <div style={{ marginBottom: "1rem" }}>
          <p className="survey-question">On a scale from 1 (Strongly Disagree) to 5 (Strongly Agree), rate the following:</p>

          {statementsNFC.map((text, index) => (
            <div key={index} className="survey-likert-div likert-question-container">
              {/* Statement text */}
              <p className="survey-likert-statement">{text}</p>

              {/* Horizontal scale: Strongly Disagree ... 1 2 3 4 5 ... Strongly Agree */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: ".9em"}}>Strongly Disagree</span>
                {Array.from({ length: 5 }, (_, i) => i + 1).map((numVal) => (
                  <label key={numVal} style={{ display: "flex", flexDirection: "column" }}>
                    <input
                      type="radio"
                      value={numVal}
                      // Each statement gets a unique name, e.g. "likert_0", "likert_1", etc.
                      {...register(`nfc_${index}`, { required: !devMode })}
                    />
                    {numVal}
                  </label>
                ))}
                <span style={{ fontSize: ".9em"}}>Strongly Agree</span>
              </div>

              {/* If there's a validation error for this statement's likert */}
              {errors[`nfc_${index}`] && (
                <p style={{ color: "red" }}>Please rate this statement.</p>
              )}
            </div>
          ))}
        </div>

        {/* Technology Acceptance Questions */}
        <div style={{ marginBottom: "1rem" }}>
          <p className="survey-question">On a scale from 1 (Strongly Disagree) to 7 (Strongly Agree), rate the following:</p>

          {statementsTechAccept.map((text, index) => (
            <div key={index} className="survey-likert-div likert-question-container">
              {/* Statement text */}
              <p className="survey-likert-statement">{text}</p>

              {/* Horizontal scale: Strongly Disagree ... 1 2 3 4 5 6 7 ... Strongly Agree */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: ".9em"}}>Strongly Disagree</span>
                {Array.from({ length: 7 }, (_, i) => i + 1).map((numVal) => (
                  <label key={numVal} style={{ display: "flex", flexDirection: "column" }}>
                    <input
                      type="radio"
                      value={numVal}
                      // Each statement gets a unique name, e.g. "likert_0", "likert_1", etc.
                      {...register(`techAccept_${index}`, { required: !devMode })}
                    />
                    {numVal}
                  </label>
                ))}
                <span style={{ fontSize: ".9em"}}>Strongly Agree</span>
              </div>

              {/* If there's a validation error for this statement's likert */}
              {errors[`techAccept_${index}`] && (
                <p style={{ color: "red" }}>Please rate this statement.</p>
              )}
            </div>
          ))}
        </div>

        {/* RADIO SELECT */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="survey-question">
            How often do you use AI tools <i>for writing</i> (e.g., ChatGPT, Google Gemini, Claude)?
          </p>

          {["Never", "Rarely", "Occasionally", "Frequently"].map((option) => (
            <label key={option} style={{ display: "block", marginBottom: "0.25rem" }}>
              <input
                type="radio"
                value={option}
                // Hook Form uses the same name for radio group
                {...register("aiFrequency", { required: !devMode })}
              />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}

          {errors.aiFrequency && (
            <p style={{ color: "red" }}>Please select how frequently you use AI writing tools.</p>
          )}
        </div>

        {/* MULTI-SELECT CHECKBOX */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="survey-question">
            Which writing tasks have you used AI for? (Select all that apply)
          </p>

          {["Brainstorming ideas", "Drafting content", "Revising/editing", "I don't use AI for writing"].map((option) => (
            <label key={option} style={{ display: "block", marginBottom: "0.25rem" }}>
              <input
                type="checkbox"
                value={option}
                // For checkboxes, we still use register but with different handling
                {...register("aiUseType")}
              />
              {" " + option}
            </label>
          ))}

          {/* Optional validation if you require at least one selection */}
          {errors.aiUseType && (
            <p style={{ color: "red" }}>Please select at least one option.</p>
          )}
        </div>

        {/* AI writing Likert Questions */}
        <div style={{ marginBottom: "1rem" }}>
          <p className="survey-question">On a scale from 1 (Strongly Disagree) to 7 (Strongly Agree), rate the following:</p>

          {statementsAIwriting.map((text, index) => (
            <div key={index} className="survey-likert-div likert-question-container">
              {/* Statement text */}
              <p className="survey-likert-statement">{text}</p>

              {/* Horizontal scale: Strongly Disagree ... 1 2 3 4 5 6 7 ... Strongly Agree */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: ".9em"}}>Strongly Disagree</span>
                {Array.from({ length: 7 }, (_, i) => i + 1).map((numVal) => (
                  <label key={numVal} style={{ display: "flex", flexDirection: "column" }}>
                    <input
                      type="radio"
                      value={numVal}
                      // Each statement gets a unique name, e.g. "likert_0", "likert_1", etc.
                      {...register(`AIwriting_${index}`, { required: !devMode })}
                    />
                    {numVal}
                  </label>
                ))}
                <span style={{ fontSize: ".9em"}}>Strongly Agree</span>
              </div>

              {/* If there's a validation error for this statement's likert */}
              {errors[`AIwriting_${index}`] && (
                <p style={{ color: "red" }}>Please rate this statement.</p>
              )}
            </div>
          ))}
        </div>


        {/* Writing Self-Efficacy Questions */}
        <div style={{ marginBottom: "1rem" }}>
          <p className="survey-question">On a scale from 1 (Strongly Disagree) to 7 (Strongly Agree), rate the following:</p>

          {statementsWritingEfficacy.map((text, index) => (
            <div key={index} className="survey-likert-div likert-question-container">
              {/* Statement text */}
              <p className="survey-likert-statement">{text}</p>

              {/* Horizontal scale: Strongly Disagree ... 1 2 3 4 5 6 7 ... Strongly Agree */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: ".9em"}}>Strongly Disagree</span>
                {Array.from({ length: 7 }, (_, i) => i + 1).map((numVal) => (
                  <label key={numVal} style={{ display: "flex", flexDirection: "column" }}>
                    <input
                      type="radio"
                      value={numVal}
                      // Each statement gets a unique name, e.g. "likert_0", "likert_1", etc.
                      {...register(`writingEfficacy_${index}`, { required: !devMode })}
                    />
                    {numVal}
                  </label>
                ))}
                <span style={{ fontSize: ".9em"}}>Strongly Agree</span>
              </div>

              {/* If there's a validation error for this statement's likert */}
              {errors[`writingEfficacy_${index}`] && (
                <p style={{ color: "red" }}>Please rate this statement.</p>
              )}
            </div>
          ))}
        </div>

        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Submit
        </button>
      </form>
    </div>
  );
}
