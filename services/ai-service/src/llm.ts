import Anthropic from '@anthropic-ai/sdk';
import { Task, PriorityResult } from '@overengineered-todo/shared';
import { generateFallbackPriorities } from './fallback';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

export async function prioritizeTasks(tasks: Task[]): Promise<PriorityResult[]> {
  if (!CLAUDE_API_KEY) {
    console.log('[ai-service] No API key set, using fallback responses');
    return generateFallbackPriorities(tasks.map((t) => t.id));
  }

  try {
    return await prioritizeWithClaude(tasks);
  } catch (error) {
    console.error('[ai-service] LLM call failed, using fallback:', error);
    return generateFallbackPriorities(tasks.map((t) => t.id));
  }
}

async function prioritizeWithClaude(tasks: Task[]): Promise<PriorityResult[]> {
  const client = new Anthropic({ apiKey: CLAUDE_API_KEY });
  const taskList = tasks.map((t, i) => `${i + 1}. "${t.title}" (id: ${t.id})`).join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a slightly judgmental productivity AI. Rank these tasks by urgency and life impact. Be opinionated and a little sarcastic in your reasoning.\n\nTasks:\n${taskList}\n\nRespond as JSON array: [{"taskId": "...", "priority": N, "reasoning": "..."}] where priority is highest-first (N = total tasks means highest priority). Keep reasoning to one snarky sentence each.`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return generateFallbackPriorities(tasks.map((t) => t.id));
  return JSON.parse(jsonMatch[0]) as PriorityResult[];
}
