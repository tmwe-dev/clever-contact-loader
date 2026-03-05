import { ImportJob, ImportStatus } from '@/lib/types';
import { useState, useCallback } from 'react';

const generateId = () => Math.random().toString(36).slice(2, 10);

export function useImportJobs() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);

  const createJob = useCallback((filename: string, detectedFormat: string): ImportJob => {
    const job: ImportJob = {
      id: generateId(),
      filename,
      status: 'uploaded',
      createdAt: new Date(),
      detectedFormat,
      parsingOptions: {
        delimiter: ',',
        encoding: 'utf-8',
        hasHeader: true,
        quoteChar: '"',
        skipRows: 0,
        decimalChar: '.',
      },
      mappingSchema: [],
    };
    setCurrentJob(job);
    return job;
  }, []);

  const updateJob = useCallback((updates: Partial<ImportJob>) => {
    setCurrentJob(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  const updateJobStatus = useCallback((status: ImportStatus) => {
    updateJob({ status });
  }, [updateJob]);

  const finalizeJob = useCallback(() => {
    setCurrentJob(prev => {
      if (!prev) return null;
      const finalized = { ...prev, finishedAt: new Date() };
      setJobs(jobs => [finalized, ...jobs]);
      return finalized;
    });
  }, []);

  const resetCurrentJob = useCallback(() => {
    setCurrentJob(null);
  }, []);

  return {
    jobs,
    currentJob,
    createJob,
    updateJob,
    updateJobStatus,
    finalizeJob,
    resetCurrentJob,
  };
}
