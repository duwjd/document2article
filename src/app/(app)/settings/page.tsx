import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import SettingsForm from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireUser();
  const integrations = await prisma.integration.findMany({
    where: { userId: user.id },
    select: {
      provider: true,
      username: true,
      metadata: true,
      connectedAt: true,
    },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">계정 설정</h1>
      <p className="mt-1 text-sm text-slate-500">
        Velog, Notion, Brunch 연동을 관리하고 글을 바로 발행하세요.
      </p>
      <div className="mt-6">
        <SettingsForm
          user={{ email: user.email, name: user.name }}
          integrations={integrations.map((i) => ({
            provider: i.provider,
            username: i.username,
            metadata: i.metadata,
            connectedAt: i.connectedAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
