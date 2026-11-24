import { previewDbPlan } from '../previewDb';

const preview = { VERCEL_ENV: 'preview', DATABASE_URL: 'postgres://x', DIRECT_URL: 'postgres://y', VERCEL_GIT_COMMIT_REF: 'preview' };

describe('previewDbPlan', () => {
  it('pushes the schema on a preview build with its own database', () => {
    expect(previewDbPlan(preview)).toEqual({ push: true, args: ['prisma', 'db', 'push', '--skip-generate'] });
  });

  it('never pushes in production or locally', () => {
    expect(previewDbPlan({ ...preview, VERCEL_ENV: 'production' }).push).toBe(false);
    expect(previewDbPlan({ ...preview, VERCEL_ENV: undefined }).push).toBe(false);
  });

  it('never pushes from the main branch', () => {
    expect(previewDbPlan({ ...preview, VERCEL_GIT_COMMIT_REF: 'main' }).push).toBe(false);
  });

  it('skips when the preview has no database configured', () => {
    expect(previewDbPlan({ ...preview, DATABASE_URL: '' }).push).toBe(false);
    expect(previewDbPlan({ ...preview, DIRECT_URL: undefined }).push).toBe(false);
  });

  it('never accepts data loss, so a destructive change fails the build instead', () => {
    expect(previewDbPlan(preview).args).not.toContain('--accept-data-loss');
  });
});
