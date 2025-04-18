import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

export default function Exit() {
  return (
    <div className="container">
      <div className="landing">
        <h1>Thank you for completing our study!</h1>
        <p>Please use this code to indicate you finished the task.</p>
      </div>
    </div>
  );
}
