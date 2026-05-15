export const SUGGESTED_PROMPTS = [
  "What surprised you most this week?",
  "Describe one small thing that made you smile.",
  "What's something you're looking forward to right now?",
  "Tell us about a place you went or wish you'd gone.",
  "What's something you learned — about yourself or the world?",
  "What's a song that's been with you this week and why?",
  "What did you eat that you want to remember?",
  "Describe a moment from the week worth keeping.",
  "What's something you're working through quietly?",
  "What's a conversation you had that stayed with you?",
  "If you had one extra hour this week, how would you use it?",
  "What's something beautiful you noticed?",
  "Tell us about something old you rediscovered.",
  "What are you grateful for that you don't say enough?",
  "What's the best decision you made this week, big or small?"
]

// Pick a consistent prompt for the current week number
export function getCurrentPrompt() {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7)
  return SUGGESTED_PROMPTS[(week - 1) % SUGGESTED_PROMPTS.length]
}
