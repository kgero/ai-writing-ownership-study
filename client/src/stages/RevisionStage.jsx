// stages/RevisionStage.jsx
import React from "react";
import WritingStage from "../WritingStage";

export default function RevisionStage() {
  // No next stage for revision
  return <WritingStage stageName="Revision" nextStage={null} />;
}