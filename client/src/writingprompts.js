// Writing prompts organized into two sets
export const writingPrompts = {
  setA: [
    { id: "a1", text: "Should public schools ban smartphones during the school day, or permit limited use for learning and emergencies?" },
    { id: "a2", text: "Should we bring back extinct species like woolly mammoths using genetic engineering, or leave extinction as a natural boundary that shouldn't be crossed?" },
    { id: "a3", text: "Should large employers require workers to return to the office several days a week, or allow fully remote schedules by default?" }
  ],
  setB: [
    { id: "b1", text: "Should parents have the right to genetically edit their unborn children to prevent diseases, or should we ban genetic modifications to preserve natural human diversity?" },
    { id: "b2", text: "Should cities ban gas-powered leaf blowers to reduce noise and pollution, or leave equipment choices to homeowners and landscapers?" },
    { id: "b3", text: "Should the federal government broaden student-loan forgiveness programs, or prioritize other ways of addressing education debt?" }
  ],
  instructions: "Please write an essay...",
  ideasLLMprompt: (promptText) => `
I am writing a 500 word essay. The prompt is ${promptText}.
Please give me three ideas for the essay. Format your response in markdown.
Each idea should start with its number and thesis bolded, e.g., **Idea 1: Here is a sentence summarizing the argument.**,
and then some bullet points detailing how the essay would be structured.
`
}