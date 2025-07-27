// Writing prompts organized into two sets
export const writingPrompts = {
  setA: [
    { id: "a1", text: "Should universities require standardized testing for admissions?" },
    { id: "a2", text: "Should social media companies be responsible for moderating user content?" },
    { id: "a3", text: "Should remote work become the standard for office jobs?" }
  ],
  setB: [
    { id: "b1", text: "Should the government regulate artificial intelligence development?" },
    { id: "b2", text: "Should college athletes be paid for their participation?" },
    { id: "b3", text: "Should voting be mandatory in democratic elections?" }
  ],
  instructions: "Please write an essay...",
  ideasLLMprompt: (promptText) => `
I am writing a 500 word essay. The prompt is ${promptText}.
Please give me three ideas for the essay. Format your response in markdown.
Each idea should start with its number and thesis bolded, e.g., **Idea 1: Here is a sentence summarizing the argument.**,
and then some bullet points detailing how the essay would be structured.
`
}