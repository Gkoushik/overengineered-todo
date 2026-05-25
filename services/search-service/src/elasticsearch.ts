import { Client } from '@elastic/elasticsearch';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

export const esClient = new Client({ node: ELASTICSEARCH_URL });

const INDEX_NAME = 'tasks';

export async function initIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: INDEX_NAME });
  if (!exists) {
    await esClient.indices.create({
      index: INDEX_NAME,
      body: {
        mappings: {
          properties: {
            taskId: { type: 'keyword' },
            title: { type: 'text' },
            userId: { type: 'keyword' },
            embedding: { type: 'dense_vector', dims: 384, index: true, similarity: 'cosine' },
            createdAt: { type: 'date' },
          },
        },
      },
    });
  }
  console.log('[search-service] Elasticsearch index ready');
}

export async function indexTask(taskId: string, title: string, userId: string, embedding: number[]): Promise<void> {
  await esClient.index({
    index: INDEX_NAME,
    id: taskId,
    body: { taskId, title, userId, embedding, createdAt: new Date().toISOString() },
  });
}

export async function searchByVector(embedding: number[], userId: string, k: number = 5): Promise<Array<{ taskId: string; title: string; score: number }>> {
  const result = await esClient.search({
    index: INDEX_NAME,
    body: {
      query: {
        bool: {
          must: [{ term: { userId } }],
          should: [{
            script_score: {
              query: { match_all: {} },
              script: { source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0", params: { query_vector: embedding } },
            },
          }],
        },
      },
      size: k,
    },
  });

  return (result.hits.hits as any[]).map((hit) => ({
    taskId: hit._source.taskId,
    title: hit._source.title,
    score: hit._score,
  }));
}

export async function deleteTask(taskId: string): Promise<void> {
  await esClient.delete({ index: INDEX_NAME, id: taskId }).catch(() => {});
}
