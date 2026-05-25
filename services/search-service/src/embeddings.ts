import { pipeline } from '@xenova/transformers';

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embed = await getEmbedder();
  const result = await embed(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data as Float32Array).slice(0, 384);
}
