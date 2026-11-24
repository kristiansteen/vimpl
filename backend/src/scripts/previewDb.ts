// B51: preview builds of the backend use their own database (a Supabase
// branch), set as DATABASE_URL / DIRECT_URL for Preview only in Vercel.
// On each preview build the schema is pushed to that database so new tables
// exist before anything is tested. Production is never touched from here.
import { spawnSync } from 'child_process';

type Env = Record<string, string | undefined>;

export function previewDbPlan(env: Env): { push: boolean; args: string[] } {
  const args = ['prisma', 'db', 'push', '--skip-generate'];
  const push =
    env.VERCEL_ENV === 'preview' &&
    env.VERCEL_GIT_COMMIT_REF !== 'main' &&
    !!env.DATABASE_URL &&
    !!env.DIRECT_URL;
  return { push, args };
}

if (require.main === module) {
  const plan = previewDbPlan(process.env);
  if (!plan.push) {
    console.log('[preview-db] not a preview build with its own database; schema not pushed');
  } else {
    console.log('[preview-db] pushing schema to the preview database');
    const r = spawnSync('npx', plan.args, { stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
}
