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

  stageTitles: {
    outline: "Write an Outline for an Essay",
    draft: "Write a First Draft for an Essay",
    revision: "Revise your Essay"
  },

  // Stage-specific instructions
  instructions: {
    outline: `Please write an outline for an essay on the topic below.

This outline is for your own use, so you can use bullet points, notes or whatever style of planning you prefer. You will be asked to write a complete draft of the essay in the next step.

The final essay should be about 300 words, so your outline should be less than 100 words. (Note the word count in the bottom lefthand corner of the textbox.) Your outline will be shown to you when you move to the drafting stage.`,
    draft: `Please write a first draft for the essay based on your outline; your topic is below and your outline has been put in the righthand sidebar. 

Remember, your essay should be about 300 words. A word count is in the bottom righthand corner of the textbox.`,
    revision: `Please review and revise your essay below. Your draft is in the textbox.`
  },

  // Stage max times are listed in minutes
  stageTimes: {
    outline: 10,
    draft: 10,
    revision: 10
  },

  // Warning times in seconds before timeout
  warningTimes: [120, 60, 30] // 5 min, 2 min, 30 sec
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

  // New revision tool prompts
  proofreader: (draft) => `
        Please briefly review the following essay for the most critical typos, grammatical mistakes, and punctuation issues:
        
        ${draft}
        
        Identify only 2-3 of the most important issues. For each issue:
        1. Number the issue (Issue 1, Issue 2, etc.)
        2. Quote the problematic phrase EXACTLY as it appears in the text (keep it under 10 words), using "double quotes".
        3. Very briefly explain the problem in 5-10 words.
        4. Suggest a concise fix.
        
        Format as:
        ### Issue 1
        > "problematic text"
        >
        > **Issue**: Brief explanation
        >
        > **Fix**: "corrected version"
        
        Be extremely concise. Only identify actual errors.
        The quoted "problematic text" must appear EXACTLY as written in the original text - this is critical.

`,

  contentpolisher: (draft) => `
        Please briefly review the following essay for the most significant weak arguments:
        
        ${draft}
        
        Identify only 2-3 of the most important issues. For each issue:
        1. Number the issue (Issue 1, Issue 2, etc.)
        2. Quote the relevant phrase EXACTLY as it appears in the text (keep it under 10 words), using "double quotes".
        3. Very briefly explain the weakness in 5-10 words.
        4. Suggest a specific, concise improvement.
        
        Format as:
        ### Issue 1
        > "weak argument"
        >
        > **Issue**: Brief explanation
        >
        > **Fix**: Suggested improvement
        
        Be extremely concise. Focus only on substantive improvements.
        The quoted "weak argument" must appear EXACTLY as written in the original text - this is critical.
`,

  writingclarity: (draft) => `
        Please briefly review the following essay for the most unclear passages:
        
        ${draft}
        
        Identify only 2-3 of the most problematic passages. For each issue:
        1. Number the issue (Issue 1, Issue 2, etc.)
        2. Quote the unclear phrase EXACTLY as it appears in the text (keep it under 10 words), using "double quotes".
        3. Very briefly explain the clarity issue in 5-10 words.
        4. Suggest a clearer alternative.
        
        Format as:
        ### Issue 1
        > "unclear text"
        >
        > **Issue**: Brief explanation
        >
        > **Fix**: "clearer version"
        
        Be extremely concise. Focus only on clarity issues.
        The quoted "unclear text" must appear EXACTLY as written in the original text - this is critical.
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