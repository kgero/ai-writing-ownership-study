// FormPage.jsx
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ConsentPage() {
  const { num, promptId } = useParams();
  const navigate = useNavigate();

  // On form submit, do whatever you need with the data
  // then push the user to the chosen interface route
  const handleSubmitForm = (e) => {
    e.preventDefault();

    // Now route to the correct interface
    navigate(`/presurvey/${num}/${promptId}`);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Informed Consent</h2>
      <form onSubmit={handleSubmitForm}>
        <div style={{ marginBottom: "1rem" }}>
          <p>test test test</p>
        </div>
        <button type="submit">Submit & Go to Form</button>
      </form>
    </div>
  );
}
