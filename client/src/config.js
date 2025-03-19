// config.js
export const stageConfig = {
  // Define which conditions get AI support at each stage
  // For example:
  // Condition 1: No AI support at any stage
  // Condition 2: AI support for outline only
  // Condition 3: AI support for draft only
  // Condition 4: AI support for all stages
  1: {
    outline: false,
    draft: false,
    revision: false
  },
  2: {
    outline: true,
    draft: false,
    revision: false
  },
  3: {
    outline: false,
    draft: true,
    revision: false
  },
  4: {
    outline: true,
    draft: false,
    revision: true
  },
  
  // Essay prompts (moved from writingprompts.js)
  prompts: {
    a: "Should universities require standardized testing for admissions?",
    b: "Should social media companies be responsible for moderating user content?",
    c: "Should remote work become the standard for office jobs?",
    d: "Should high schools make personal finance education mandatory?"
  },
  
  // Stage-specific instructions
  instructions: {
    outline: "Write an outline for an essay on the following topic:",
    draft: "Write a draft essay based on your outline for the following topic:",
    revision: "Review and revise your draft essay on the following topic:"
  }
};

// LLM prompts for each stage
export const llmPrompts = {
  outline: (promptText) => `
I am planning to write a 500 word argumentative essay on the topic: ${promptText}.
Please give me 3 distinct thesis ideas for this essay:
- The first should argue in favor of the topic (pro position)
- The second should argue against the topic (con position)
- The third should be a nuanced or alternative perspective

Each idea must be extremely concise (10-15 words maximum) and make a clear argument.

Format your response with bullet points.

Do not include any additional explanation text before or after the bullet points.
Do not indicate which ideas are pro or con.
`,

  draft: (promptText, outline) => `
I'm writing a 500 word essay on the topic: ${promptText}.
Here's my outline:
${outline}

Please provide some suggestions for developing each section of my outline.
Format your response in markdown.
`,

  revision: (promptText, draft) => `
I've written a draft essay on the topic: ${promptText}.
Here's my draft:
${draft}

Please suggest 3-4 specific improvements I could make to strengthen my essay.
Focus on clarity, organization, and persuasiveness.
Format your response in markdown with bullet points.
`,

  // For generating single idea sentences
  singleIdea: (promptText, existingIdeas) => `
Generate a single interesting thesis statement for a 500-word argumentative essay on the topic: ${promptText}.
The statement must be extremely concise (10-15 words maximum) and make a clear argument.

Here are the existing ideas that have already been generated (DO NOT repeat these or anything similar):
${existingIdeas}

Provide ONLY the thesis statement with no additional text, introduction, or explanation.
`,

  // For generating outline for a specific idea
  ideaOutline: (promptText, idea) => `
Create a very concise outline for a 500-word argumentative essay on this topic: ${promptText}
The main thesis/idea is: ${idea}

The outline must be extremely brief (no more than 20 lines total) with minimal formatting:
- One short introduction point
- 2-3 main points (no more than 15 words each)
- One short conclusion point

Use simple bullet points only. No sub-bullets or complex formatting.
`,

  // Revision tool prompts
  styleenhancer: (draft) => `
Please enhance the style of this essay to make it more engaging and sophisticated, 
while maintaining the original meaning:

${draft}

Focus on improving vocabulary, sentence variation, and literary devices where appropriate.
Return the complete revised essay.
`,

  grammarchecker: (draft) => `
Please check and correct any grammar or spelling issues in this essay:

${draft}

Focus only on grammatical errors, punctuation, and spelling mistakes.
Return the complete corrected essay.
`,

  toneadjuster: (draft) => `
Please adjust the tone of this essay to be more academic and professional:

${draft}

Focus on formality, objectivity, and appropriate academic language.
Return the complete revised essay with adjusted tone.
`,

  contentpolisher: (draft) => `
Please polish the content of this essay by improving clarity, 
adding relevant details, and strengthening the argument where needed:

${draft}

Focus on logical flow, evidence support, and overall persuasiveness.
Return the complete polished essay.
`
};