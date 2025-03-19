// stages/OutlineStage.jsx
import React from "react";
import WritingStage from "../WritingStage";

export default function OutlineStage() {
  return <WritingStage stageName="Outline" nextStage="Draft" />;
}