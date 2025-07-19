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

  // Stage-specific instructions with AI and no-AI versions
  instructions: {
    outline: {
      base: `INSTRUCTIONS: Please write an outline for an essay on the topic below. This outline is for your own use, so you can use bullet points, notes or whatever style of planning you prefer. You will be asked to write a complete draft of the essay in the next step.

LENGTH: The final essay should be about 300 words, so your outline should be at least 60 words. There is a word count in the bottom righthand corner of the textbox. Your outline will be shown to you when you move to the drafting stage. You must have at least 60 words in the textbox to continue to the drafting stage.

TIME ALLOWED: You will have 10 minutes to write the outline. You will be given warnings when you have 5 minutes left, 2 minutes left, and 30 seconds left, at which point you will not be able to continue writing. You may move to the next stage before your time is up, whenever you feel you are ready.`,
      noai: `SUPPORT: You are not allowed to use any kind of AI support.`,
      ai: `SUPPORT: You may request ideas from a Large Language Model using the panel to the right.`
    },
    draft: {
      base: `INSTRUCTIONS: Please write a first draft for the essay based on your outline; your topic is below and your outline has been put in the righthand sidebar. This is just a first draft; once you are done you will be given more time to revise your essay.

LENGTH: Your final essay should be about 300 words. A word count is in the bottom righthand corner of the textbox. You must have at least 300 words in the textbox to continue to the revision stage.

TIME ALLOWED: You will have 10 minutes to write the draft. You will be given warnings when you have 5 minutes left, 2 minutes left, and 30 seconds left, at which point you will not be able to continue writing. You may move to the next stage before your time is up, whenever you feel you are ready.`,
      noai: `SUPPORT: You are not allowed to use any kind of AI support.`,
      ai: `n/a`
    },
    revision: {
      base: `INSTRUCTIONS: Please review and revise your essay below. Your draft is in the textbox. You may want to consider the strength of your arguments, the clarity of your writing, and the overall structure of your essay.

LENGTH: Your final essay should be about 300 words. A word count is in the bottom righthand corner of the textbox. You must have at least 250 words in the textbox to submit your essay.

TIME ALLOWED: You will have 10 minutes to revise your essay. You will be given warnings when you have 5 minutes left, 2 minutes left, and 30 seconds left, at which point you will not be able to continue writing. You may submit your essay before your time is up, whenever you feel you are ready.`,
      noai: `SUPPORT: You are not allowed to use any kind of AI support.`,
      ai: `SUPPORT: You may use AI revision tools in the panel to the right to help identify and correct issues in your writing.`
    }
  },

  // Helper function to get the appropriate instruction based on condition and stage
  getInstruction: (condition, stageName) => {
    const stage = stageName.toLowerCase();
    const hasAI = stageConfig[condition][stage];
    
    const baseInstruction = stageConfig.instructions[stage].base;
    const supportInstruction = hasAI ? 
      stageConfig.instructions[stage].ai : 
      stageConfig.instructions[stage].noai;
    
    return `${baseInstruction}\n\n${supportInstruction}`;
  },

  // Stage max times are listed in minutes
  stageTimes: {
    outline: 10,
    draft: 10,
    revision: 10
  },

  // Warning times in seconds before timeout
  warningTimes: [120, 60, 30], // 5 min, 2 min, 30 sec
  
  // Word count requirements for each stage
  wordCountRequirements: {
    outline: 60,
    draft: 300,
    revision: 250
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
        If there are no issues, return "No issues found".

`,

  contentpolisher: (draft) => `
Please briefly review the following essay for the most significant argument weaknesses:

${draft}

Identify only 2-3 of the most important argument issues. For each issue:
1. Number the issue (Issue 1, Issue 2, etc.)
2. Very briefly describe the argument weakness.
3. Provide a specific, actionable suggestion with concrete examples or specific steps.

Format as:
### Issue 1
> **Issue**: Brief description of the argument weakness
>
> **Suggestion**: Specific, actionable advice with concrete examples or steps

Be extremely concise. Focus only on argument quality and logic. For suggestions, provide specific examples, steps, or concrete details rather than general advice.
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