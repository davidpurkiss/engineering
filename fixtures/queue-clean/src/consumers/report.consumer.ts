import { Worker, type ConnectionOptions } from 'bullmq';
import { handleReport } from '../handlers/report.handler';
import { parseReportJob } from '../types';

export function createReportConsumer(connection: ConnectionOptions, concurrency: number) {
  return new Worker(
    'reports',
    async (job) => {
      const parsed = parseReportJob(job.data);
      await handleReport(parsed);
    },
    { connection, concurrency },
  );
}
