// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Landing from "./Landing";
import PreSurvey from "./PreSurvey";
import PostSurvey from "./PostSurvey";
import Exit from "./Exit";
import InformedConsent from "./InformedConsent";
import OutlineStage from "./stages/OutlineStage";
import DraftStage from "./stages/DraftStage";
import RevisionStage from "./stages/RevisionStage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page for user to enter the number */}
        <Route path="/" element={<Landing />} />

        <Route path="/consent/:condition/:promptId" element={<InformedConsent />} />

        {/* A single form page for all users, identified by condition */}
        <Route path="/presurvey/:condition/:promptId" element={<PreSurvey />} />

        <Route path="/postsurvey/:condition/:promptId" element={<PostSurvey />} />
        <Route path="/exit/" element={<Exit />} />

        {/* Three writing stages */}
        <Route path="/outline/:condition/:promptId" element={<OutlineStage />} />
        <Route path="/draft/:condition/:promptId" element={<DraftStage />} />
        <Route path="/revision/:condition/:promptId" element={<RevisionStage />} />

        {/* Optional: a fallback route for invalid URLs */}
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;