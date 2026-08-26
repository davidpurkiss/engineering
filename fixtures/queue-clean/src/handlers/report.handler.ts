import { renderReport } from '../services/report.service';
import type { ReportJob, JobResult } from '../types';

export async function handleReport(job: ReportJob): Promise<JobResult> {
  const url = await renderReport(job.reportId);
  return { status: 'done', url };
}
