// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Landing from "./Landing";
import PreSurvey from "./PreSurvey";
import PostSurvey from "./PostSurvey";
import Exit from "./Exit";
import InformedConsent from "./InformedConsent";
import Instructions from "./Instructions";
import OutlineStage from "./stages/OutlineStage";
import DraftStage from "./stages/DraftStage";
import RevisionStage from "./stages/RevisionStage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Entry point - informed consent with random assignment */}
        <Route path="/" element={<InformedConsent />} />
        <Route path="/consent" element={<InformedConsent />} />

        {/* Instructions page with topic selection */}
        <Route path="/instructions/:condition/:promptSet" element={<Instructions />} />

        {/* A single form page for all users, identified by condition */}
        <Route path="/presurvey/:condition/:promptSet/:promptId" element={<PreSurvey />} />

        <Route path="/postsurvey/:condition/:promptSet/:promptId" element={<PostSurvey />} />
        <Route path="/exit/" element={<Exit />} />

        {/* Three writing stages */}
        <Route path="/outline/:condition/:promptSet/:promptId" element={<OutlineStage />} />
        <Route path="/draft/:condition/:promptSet/:promptId" element={<DraftStage />} />
        <Route path="/revision/:condition/:promptSet/:promptId" element={<RevisionStage />} />

        {/* Optional: a fallback route for invalid URLs */}
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;