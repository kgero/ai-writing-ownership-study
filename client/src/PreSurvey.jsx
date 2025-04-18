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
    navigate(`/outline/${condition}/${promptId}`);
  };

  const statements = [
    "Statement/s about writing self-efficacy.",
    "Statement/s about technology acceptance.",
    "Statement/s about use of AI for writing support.",
    "Statement/s about confidence or ability with AI.",
    "Statement/s about need for cognition.",
  ];

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Pre-Task Survey</h2>

      {/* "handleSubmit(onSubmit)" wraps your onSubmit logic 
          and also handles validation checking */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ margin: "2rem auto" }}>

        {/* RADIO SELECT */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="survey-question" style={{ marginBottom: "0.5rem" }}>
            What is your age?
          </p>

          {["18-25", "26-35", "36-45", "46-55", "56 or over"].map((option) => (
            <label key={option} style={{ display: "block", marginBottom: "0.25rem" }}>
              <input
                type="radio"
                value={option}
                // Hook Form uses the same name for radio group
                {...register("ageChoice", { required: !devMode })}
              />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}

          {errors.ageChoice && (
            <p style={{ color: "red" }}>Please select your age.</p>
          )}
        </div>

        {/* RADIO SELECT */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="survey-question" style={{ marginBottom: "0.5rem" }}>
            What is your gender?
          </p>

          {["male", "female", "non-binary", "other", "prefer not to disclose"].map((option) => (
            <label key={option} style={{ display: "block", marginBottom: "0.25rem" }}>
              <input
                type="radio"
                value={option}
                // Hook Form uses the same name for radio group
                {...register("genderChoice", { required: !devMode })}
              />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}

          {errors.genderChoice && (
            <p style={{ color: "red" }}>Please select your gender.</p>
          )}
        </div>

        {/* MULTIPLE LIKERT STATEMENTS */}
        <div style={{ marginBottom: "1rem" }}>
          <p className="survey-question">On a scale from 1 (Strongly Disagree) to 7 (Strongly Agree), rate the following:</p>

          {statements.map((text, index) => (
            <div key={index} style={{ marginBottom: "1.5rem" }}>
              {/* Statement text */}
              <p className="survey-likert-statement" style={{ marginBottom: "0.5rem" }}>{text}</p>

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


        {/* SHORT ANSWER */}
        {/*<div style={{ marginBottom: "1rem" }}>
          <label htmlFor="shortAnswer" style={{ display: "block", marginBottom: "0.5rem" }}>
            1. Short Answer Question
          </label>
          <input
            id="shortAnswer"
            type="text"
            placeholder="Type your answer..."
            style={{ width: "100%", padding: "0.5rem" }}

            // "register('shortAnswer')" connects this input to Hook Form
            // "required: !devMode" means required if devMode = false
            {...register("shortAnswer", { required: !devMode })}
          />
          {errors.shortAnswer && (
            <p style={{ color: "red" }}>This field is required.</p>
          )}
        </div>*/}

        {/* RADIO SELECT */}
        {/*<div style={{ marginBottom: "1rem" }}>
          <p style={{ marginBottom: "0.5rem" }}>
            2. Radio Select: Which color do you like best?
          </p>

          {["red", "green", "blue"].map((option) => (
            <label key={option} style={{ display: "block", marginBottom: "0.25rem" }}>
              <input
                type="radio"
                value={option}
                // Hook Form uses the same name for radio group
                {...register("colorChoice", { required: !devMode })}
              />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}

          {errors.colorChoice && (
            <p style={{ color: "red" }}>Please select a color.</p>
          )}
        </div>*/}

        {/* SINGLE LIKERT SCALE */}
        {/*<div style={{ marginBottom: "1rem" }}>
          <p style={{ marginBottom: "0.5rem" }}>
            3. On a scale from 1 (Strongly Disagree) to 7 (Strongly Agree), rate this statement:
            <br />
            <em>"I enjoy writing code."</em>
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", maxWidth: "300px" }}>
            {Array.from({ length: 7 }, (_, i) => i + 1).map((numVal) => (
              <label key={numVal}>
                <input
                  type="radio"
                  value={numVal}
                  // Again, same name for a single group
                  {...register("likertValue", { required: !devMode })}
                />
                {numVal}
              </label>
            ))}
          </div>
          {errors.likertValue && (
            <p style={{ color: "red" }}>Please choose a rating.</p>
          )}
        </div>*/}

        {/* SUBMIT */}
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Submit
        </button>
      </form>
    </div>
  );
}
