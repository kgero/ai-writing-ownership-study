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
    outline: false,
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
I am planning to write a 300 word argumentative essay on the topic: ${promptText}.
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
I'm writing a 300 word essay on the topic: ${promptText}.
Here's my outline:
${outline}

Please provide a complete draft based on the outline.
Do not include any additional explanation text before or after the draft.
`,

  // New AI draft generation prompt
  aiDraft: (promptText, outline) => `
Please write a complete draft essay based on this outline and prompt.
      
Prompt: ${promptText}
      
Outline:
${outline}
      
Please create a well-structured essay of approximately 300 words that follows this outline.
`,

  revision: (promptText, draft) => `
I've written a draft essay on the topic: ${promptText}.
Here's my draft:
${draft}

Please suggest 3-4 specific improvements I could make to strengthen my essay.
Focus on clarity, organization, and persuasiveness.
Format your response in markdown with bullet points.
`,

  // New revision tool prompts
  proofreader: (draft) => `
Please review the following essay for typos, grammatical mistakes, and misplaced punctuation:

${draft}

Identify 3-5 specific issues with the text. For each issue:
1. Quote the problematic sentence or phrase.
2. Briefly explain what the problem is (1-2 sentences maximum).
3. Suggest a corrected version.

Format each issue as follows:
> "problematic text"
Issue: Brief explanation of the problem
Suggestion: Corrected version

Only identify actual errors - do not suggest stylistic changes unless they are grammatically incorrect.
If you find fewer than 3 issues, that's fine - only report actual problems.
`,

  contentpolisher: (draft) => `
Please review the following essay for weak arguments and confusing points:

${draft}

Identify 3-5 specific places where the argument could be strengthened. For each issue:
1. Quote the relevant sentence or passage.
2. Briefly explain why this argument is weak or how it could be improved (2-3 sentences maximum).
3. Suggest a specific way to strengthen this point.

Format each issue as follows:
> "quoted text with weak argument"
Issue: Brief explanation of the problem
Suggestion: How to strengthen this point

Focus only on the substance and persuasiveness of arguments, not on grammar or style.
If you find fewer than 3 issues, that's fine - only report actual problems.
`,

  writingclarity: (draft) => `
Please review the following essay for clarity and readability:

${draft}

Identify 3-5 specific passages that are unclear, hard to follow, or could be more concise. For each issue:
1. Quote the unclear or complex passage.
2. Briefly explain why this section is difficult to understand (1-2 sentences maximum).
3. Suggest a clearer, more readable alternative.

Format each issue as follows:
> "quoted unclear text"
Issue: Brief explanation of what makes this unclear
Suggestion: Clearer alternative phrasing

Focus only on clarity and readability, not on the substance of arguments or grammar.
If you find fewer than 3 issues, that's fine - only report actual problems.
`,

  // For generating extra single idea sentences
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

  // Legacy revision tool prompts (keeping for reference/compatibility)
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
};