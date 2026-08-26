import { Queue, type ConnectionOptions } from 'bullmq';

export function declareQueues(connection: ConnectionOptions) {
  return new Queue('reports', {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
    },
  });
}
