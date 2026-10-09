import { FetchOptions, JobSource, JobSourceAdapter, NormalizedJob, SyncResult } from "@/types/job";
import { HimalayasAdapter } from "./himalayas";
import { RemotiveAdapter } from "./remotive";
import { JobicyAdapter } from "./jobicy";
import { RemoteJobsOrgAdapter } from "./remotejobs-org";
import { RemoteLandersAdapter } from "./remote-landers";
import { ArbeitnowAdapter } from "./arbeitnow";
import { WeWorkRemotelyAdapter } from "./weworkremotely";
import { RemoteOKAdapter } from "./remoteok";
import { WorkingNomadsAdapter } from "./working-nomads";
import { LaraJobsAdapter } from "./larajobs";

export class JobSourceRegistry {
  private adapters: Map<JobSource, JobSourceAdapter> = new Map();

  constructor() {
    this.register(new HimalayasAdapter());
    this.register(new RemotiveAdapter());
    this.register(new JobicyAdapter());
    this.register(new RemoteJobsOrgAdapter());
    this.register(new RemoteLandersAdapter());
    this.register(new ArbeitnowAdapter());
    this.register(new WeWorkRemotelyAdapter());
    this.register(new RemoteOKAdapter());
    this.register(new WorkingNomadsAdapter());
    this.register(new LaraJobsAdapter());
  }

  register(adapter: JobSourceAdapter) {
    this.adapters.set(adapter.sourceName, adapter);
  }

  getAdapter(source: JobSource): JobSourceAdapter | undefined {
    return this.adapters.get(source);
  }

  getAllAdapters(): JobSourceAdapter[] {
    return Array.from(this.adapters.values());
  }

  getEnabledAdapters(): JobSourceAdapter[] {
    return this.getAllAdapters().filter((a) => a.isEnabled());
  }

  /**
   * Fetches jobs from all enabled adapters in parallel with fault tolerance.
   * If any adapter fails, the error is recorded and other sources continue.
   */
  async fetchFromAll(options?: FetchOptions): Promise<{
    jobs: NormalizedJob[];
    results: SyncResult[];
  }> {
    const adapters = this.getEnabledAdapters();
    const allJobs: NormalizedJob[] = [];
    const results: SyncResult[] = [];

    const fetchPromises = adapters.map(async (adapter) => {
      const startTime = Date.now();
      try {
        const fetched = await adapter.fetchJobs(options);
        const durationMs = Date.now() - startTime;
        allJobs.push(...fetched);
        results.push({
          source: adapter.sourceName,
          success: true,
          fetchedCount: fetched.length,
          savedCount: 0,
          durationMs,
        });
      } catch (err: unknown) {
        const durationMs = Date.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[JobSourceRegistry] Error fetching from ${adapter.sourceName}:`, errorMessage);
        results.push({
          source: adapter.sourceName,
          success: false,
          fetchedCount: 0,
          savedCount: 0,
          error: errorMessage,
          durationMs,
        });
      }
    });

    await Promise.all(fetchPromises);
    return { jobs: allJobs, results };
  }
}

// Singleton registry instance
export const jobSourceRegistry = new JobSourceRegistry();
