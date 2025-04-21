// FormPage.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";

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
    formState: { errors },
  } = useForm();

  // Called by handleSubmit when form is valid
  const onSubmit = (data) => {
    console.log("Form data:", data);
    // e.g. You could also do an axios POST here to save in your database

    // Then navigate to the appropriate interface route
    navigate(`/exit`);
  };

  const statements = [
    "I feel this piece of writing is mine.",
    "I feel this writing reflects my own voice and ideas.",
    "I feel I had complete control over the writing process."
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




        {/* SUBMIT */}
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Submit
        </button>
      </form>
    </div>
  );
}
