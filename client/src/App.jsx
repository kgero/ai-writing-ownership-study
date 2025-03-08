// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Landing from "./Landing";
import PreSurvey from "./PreSurvey";
import InformedConsent from "./InformedConsent";
import ConditionOne from "./ConditionOne";
import ConditionTwo from "./ConditionTwo";
import ConditionThree from "./ConditionThree";
import ConditionFour from "./ConditionFour";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page for user to enter the number */}
        <Route path="/" element={<Landing />} />

        <Route path="/consent/:num/:promptId" element={<InformedConsent />} />

        {/* A single form page for all users, identified by :num */}
        <Route path="/presurvey/:num/:promptId" element={<PreSurvey />} />

        {/* Different writing interfaces by route */}
        <Route path="/1/:promptId" element={<ConditionOne />} />
        <Route path="/2/:promptId" element={<ConditionTwo />} />
        <Route path="/3/:promptId" element={<ConditionThree />} />
        <Route path="/4/:promptId" element={<ConditionFour />} />

        {/* Optional: a fallback route for invalid URLs */}
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
