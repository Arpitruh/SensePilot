export function validatePrompt(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 24000) throw new Error('Invalid prompt');
  return value.trim();
}

export async function summarizeNotes(notes, { consent = false, signal } = {}) {
  if (!consent) throw new Error('Meeting participant consent required');
  const prompt = validatePrompt(notes);
  const response = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: signal ?? AbortSignal.timeout(60000),
    body: JSON.stringify({model:'qwen2.5:3b',stream:false,messages:[
      {role:'system',content:'Summarize the supplied meeting notes. Identify decisions and action items. Do not invent details.'},
      {role:'user',content:prompt}
    ]})
  });
  if (!response.ok) throw new Error('Local AI request failed: '+response.status);
  const data = await response.json();
  if (typeof data.message?.content !== 'string') throw new Error('Invalid AI response');
  return data.message.content;
}
