import { Worker } from 'bullmq';
import { buildQueue } from '../queue/manager';
import { handleReport } from '../handlers/report.handler';

export const reportQueue = buildQueue('reports');

export const reportWorker = new Worker('reports', async (job) => {
  await handleReport(job);
});
