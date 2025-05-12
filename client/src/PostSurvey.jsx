// FormPage.jsx
import React from "react";
import axios from 'axios';
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";

const apiUrl = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = apiUrl;

export default function FormPage() {
  const { condition, promptId } = useParams();
  const navigate = useNavigate();

  // For dev toggling "required" off, set devMode = true
  // Switch to false for production
  const devMode = true;

  // Initialize React Hook Form
  // register => function to connect inputs to the form
  // handleSubmit => handles the form’s onSubmit
  // formState => object holding validation errors and other metadata
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // Set default values for sliders (optional)
      slider_0: 50,
      slider_1: 50,
    }
  });

  // Called by handleSubmit when form is valid
  const onSubmit = (data) => {
    console.log("Form data:", data);

    // Generate a unique participant ID if not stored already
    const participantId = localStorage.getItem('participantId') || 
                         `p_${Math.random().toString(36).substring(2, 10)}`;

    // Add metadata about the survey
    const surveyData = {
      participant_id: participantId,
      survey_type: "post", 
      prompt_id: promptId,
      condition: condition,
      responses: data,
      timestamp: new Date().toISOString()
    };
    
    // Submit to backend
    axios.post('/api/survey/submit', surveyData)
      .then(response => {
        console.log("Survey submitted successfully:", response.data);
        navigate(`/exit`);
      })
      .catch(error => {
        console.error("Error submitting survey:", error);
        // Handle error?? got to next stage anyway...
        navigate(`/exit`);
      });    
  };

  const statements = [
    "I feel this piece of writing is truly mine.",
    "I feel this writing reflects my own voice and ideas.",
    "I feel I had complete control over the writing process.",
    "If I were to share this essay with a colleague, I would acknowledge AI support.",
    "I put a lot of effort into writing this essay.",
    "I feel that I actively chose all the argument in this essay."
  ];

  const sliderStatements = [
    "What percentage of the ideas in this text would you attribute to yourself versus AI?",
    "What percentage of the final text would you attribute to yourself versus AI?"
  ];

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Post-Task Survey</h2>

      {/* "handleSubmit(onSubmit)" wraps your onSubmit logic 
          and also handles validation checking */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ margin: "2rem auto" }}>


        {/* MULTIPLE LIKERT STATEMENTS */}
        <div style={{ marginBottom: "1rem" }}>
          <p className="survey-question">On a scale from 1 (Strongly Disagree) to 7 (Strongly Agree), rate the following:</p>

          {statements.map((text, index) => (
            <div key={index} className="survey-likert-div">
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
                      {...register(`likert_${index}`, { required: !devMode })}
                    />
                    {numVal}
                  </label>
                ))}
                <span style={{ fontSize: ".9em"}}>Strongly Agree</span>
              </div>

              {/* If there's a validation error for this statement's likert */}
              {errors[`likert_${index}`] && (
                <p style={{ color: "red" }}>Please rate this statement.</p>
              )}
            </div>
          ))}
        </div>

        {/* PERCENTAGE SLIDERS */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="survey-question">Drag the slider to indicate your response:</p>

          {sliderStatements.map((text, index) => (
            <div key={index} className="survey-slider-div" style={{ marginBottom: "2rem" }}>
              {/* Statement text */}
              <p className="survey-slider-statement">{text}</p>

              {/* Slider container with labels */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>0% (All AI)</span>
                  <span>50% (Equal)</span>
                  <span>100% (All Me)</span>
                </div>

                {/* The actual slider input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  style={{ width: "100%" }}
                  {...register(`slider_${index}`, { 
                    required: !devMode,
                    valueAsNumber: true // This ensures the value is stored as a number
                  })}
                />

                {/* Current value display */}
                <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                  Selected: {watch(`slider_${index}`) || 50}%
                </div>
              </div>

              {/* Error message if validation fails */}
              {errors[`slider_${index}`] && (
                <p style={{ color: "red" }}>Please set a value for this question.</p>
              )}
            </div>
          ))}
        </div>


        {/* SUBMIT */}
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Submit
        </button>
      </form>
    </div>
  );
}
