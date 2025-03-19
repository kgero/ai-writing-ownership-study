// stages/DraftStage.jsx
import React from "react";
import WritingStage from "../WritingStage";

export default function DraftStage() {
  return <WritingStage stageName="Draft" nextStage="Revision" />;
}