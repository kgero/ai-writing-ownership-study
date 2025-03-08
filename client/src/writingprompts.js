// Or if you prefer, one object per interface
export const writingPrompts = {
  a: "Should universities require standardized testing for admissions?",
  b: "Should social media companies be responsible for moderating user content?",
  c: "Should remote work become the standard for office jobs?",
  d: "Should high schools make personal finance education mandatory?",
  instructions: "Please write an essay...",
  ideasLLMprompt: (promptText) => `
I am writing a 500 word essay. The prompt is ${promptText}.
Please give me three ideas for the essay. Format your response in markdown.
Each idea should start with its number and thesis bolded, e.g., **Idea 1: Here is a sentence summarizing the argument.**,
and then some bullet points detailing how the essay would be structured.
`
}