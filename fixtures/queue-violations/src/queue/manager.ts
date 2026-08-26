import { Queue } from 'bullmq';

export const queueManager = {
  enqueueEmail: async (_payload: unknown) => {},
};

export function buildQueue(name: string) {
  return new Queue(name, { connection: { host: 'localhost' } });
}
