// InformedConsent.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ConsentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  // Random assignment function
  const getRandomAssignment = () => {
    const random = Math.random();
    let condition;
    
    if (random < 0.25) {
      condition = 1; // 25% chance for condition 1
    } else if (random < 0.5) {
      condition = 2; // 25% chance for condition 2
    } else {
      condition = 4; // Remaining participants go to condition 4
    }

    // set remaining participants to condition 1
    condition = 1;
    
    const promptSet = Math.random() < 0.5 ? 'A' : 'B'; // A or B
    return { condition, promptSet };
  };

  // Parse Prolific parameters
  const getProlificParams = () => {
    const prolificPid = searchParams.get('PROLIFIC_PID') || null;
    const studyId = searchParams.get('STUDY_ID') || null;
    const sessionId = searchParams.get('SESSION_ID') || null;
    console.log('Prolific parameters:', { prolificPid, studyId, sessionId });
    return { prolificPid, studyId, sessionId };
  };

  // Handle form submission
  const handleSubmitForm = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Get Prolific parameters
    const prolificParams = getProlificParams();
    
    // Store Prolific parameters in localStorage only if they exist
    if (prolificParams.prolificPid) {
      localStorage.setItem('prolificPid', prolificParams.prolificPid);
      localStorage.setItem('participantId', prolificParams.prolificPid);
    }
    if (prolificParams.studyId) {
      localStorage.setItem('studyId', prolificParams.studyId);
    }
    if (prolificParams.sessionId) {
      localStorage.setItem('sessionId', prolificParams.sessionId);
    }

    // Get random assignment
    const { condition, promptSet } = getRandomAssignment();
    
    // Store assignment in localStorage
    localStorage.setItem('condition', condition);
    localStorage.setItem('promptSet', promptSet);

    // Navigate to instructions with new parameters
    navigate(`/instructions/${condition}/${promptSet}`);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h1>Informed Consent</h1>
      <form onSubmit={handleSubmitForm}>
        <div style={{ marginBottom: "1rem" }}>
          <p><strong>Project title:</strong> The Impact of Idea and Text Provenance in Writing on Ownership, Agency, and Authorship</p>
          <p><strong>Principal Investigator:</strong> Dr. Paramveer Dhillon, School of Information, University of Michigan — dhillonp@umich.edu</p>
          <p><strong>Co‑Principal Investigator:</strong> Dr. Katy Gero, School of Computer Science, University of Sydney — katy.gero@sydney.edu.au</p>
          <p><strong>IRB:</strong> University of Michigan Health Sciences &amp; Behavioral Sciences IRB (HSBS)</p>
          <p><strong>IRB number:</strong> HUM00272842 (Exemption 3)</p>
          <p><strong>IRB contact (questions about your rights as a participant):</strong> irbhsbs@umich.edu | +1 734‑936‑0933</p>


          <div class="section">
              <h2>What is this study about?</h2>
              <p>We are studying how AI writing tools affect writers' experience and writing quality.</p>
          </div>
          
          <div class="section">
              <h2>What will happen if I take part?</h2>
              <ol>
                  <li>Complete a short pre‑task survey about your background and views on writing and AI.</li>
                  <li>Write a 200‑300 word argumentative essay using our web interface. You may receive AI help at one or more stages of writing, or you may complete the task on your own.</li>
                  <li>Answer a brief post‑task survey about your experience.</li>
              </ol>
              <p>The whole session will take about 40 minutes.</p>
          </div>
          
          <div class="section">
              <h2>What data will be collected?</h2>
              <p>The app will securely record your writing and your interactions with the interface (including text you enter and any AI responses) so we can study writing processes.</p>
          </div>
          
          <div class="section">
              <h2>Use of AI tools</h2>
              <p>Please do not use any AI tools outside of those provided within the study interface. Using external AI assistance may compromise the research. We reserve the right to withhold or adjust payment if external AI use is detected (we employ an advanced custom AI detector).</p>
          </div>
          
          <div class="section">
              <h2>What are the risks?</h2>
              <p>The study involves minimal risk. You might experience mild fatigue or frustration typical of timed writing tasks. You may skip any question you prefer not to answer and may leave the study at any time.</p>
          </div>
          
          <div class="section">
              <h2>What are the benefits?</h2>
              <p>There is no direct personal benefit. You may find the writing practice interesting, and society may benefit from improved AI writing tools based on the results of this research.</p>
          </div>
          
          <div class="section">
              <h2>How will my information be protected?</h2>
              <p>No personally identifying information will be stored with your responses. Data are retained on secure, access‑controlled U‑M servers for up to ten years and may be shared in de‑identified form for scholarly purposes. Publications will never include information that could reasonably identify you.</p>
          </div>
          
          <div class="section">
              <h2>Will I be paid?</h2>
              <p>Yes. Upon completing the study, you will receive $10.00 base payment via Prolific, with an addition $5.00 bonus provided for the top 5% of essays. Payment may be prorated if you withdraw early or withheld/adjusted if you use external AI tools contrary to instructions.</p>
          </div>
          
          <div class="section">
              <h2>Voluntary participation</h2>
              <p>Taking part is completely voluntary. You may stop at any time by closing the browser tab without penalty.</p>
          </div>
          
          <div class="section">
              <h2>Debrief</h2>
              <p>A short debriefing page will appear at the end of the session, explaining the study in more detail and providing contact information for any follow‑up questions.</p>
          </div>
          
          <div class="contact">
              <h2>Who can I talk to?</h2>
              <ul>
                  <li>Study questions? Contact Dr. Gero (katy@g.harvard.edu) OR Dr. Dhillon (dhillonp@umich.edu).</li>
                  <li>Rights as a participant or complaints? Contact the U‑M IRB‑HSBS (irbhsbs@umich.edu | 734‑936‑0933).</li>
              </ul>
          </div>

          <p>By clicking the "I CONSENT" button below, you confirm that you are at least 18 years old, have read and understood this information, and voluntarily agree to participate.
If you do not wish to take part, simply close this tab.</p>

        </div>
        <button 
          type="submit" 
          disabled={isProcessing}
          style={{
            backgroundColor: isProcessing ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: isProcessing ? "not-allowed" : "pointer",
            width: "100%"
          }}
        >
          {isProcessing ? "Processing..." : "I CONSENT"}
        </button>
        
      </form>
    </div>
  );
}