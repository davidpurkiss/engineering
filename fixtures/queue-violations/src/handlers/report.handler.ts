import { Queue } from 'bullmq';
import { queueManager } from '../queue/manager';
import { renderReport } from '../services/report.service';

export async function handleReport(job: { data: { reportId: string } }) {
  const url = await renderReport(job.data.reportId);
  await queueManager.enqueueEmail({ reportId: job.data.reportId, url });

  const retryQueue = new Queue('reports');
  await retryQueue.add('followup', { reportId: job.data.reportId }, { delay: 60_000 });
}
