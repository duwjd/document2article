'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Integration = {
  provider: string;
  username: string | null;
  metadata: string | null;
  connectedAt: string;
};

export default function SettingsForm({
  user,
  integrations,
}: {
  user: { email: string; name: string | null };
  integrations: Integration[];
}) {
  const router = useRouter();
  const map = new Map(integrations.map((i) => [i.provider, i]));
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">계정 정보</h2>
        <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-slate-500">이메일</dt>
            <dd className="font-semibold text-slate-800">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">이름</dt>
            <dd className="font-semibold text-slate-800">{user.name ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <IntegrationCard
        provider="velog"
        label="Velog"
        description="Velog에 바로 발행합니다. velog.io > 설정 > 개발자 토큰(또는 user-access-token 쿠키)을 입력하세요."
        connected={map.get('velog')}
        fields={[
          { name: 'username', label: '사용자명 (@ 뒤 이름)', required: true },
          { name: 'token', label: 'Access Token', type: 'password', required: true },
        ]}
        onChanged={() => router.refresh()}
      />

      <IntegrationCard
        provider="notion"
        label="Notion"
        description="Notion Integration 토큰과 새 페이지를 만들 부모 페이지 ID가 필요합니다. 해당 페이지에 Integration을 공유해야 합니다."
        connected={map.get('notion')}
        fields={[
          { name: 'token', label: 'Internal Integration Token', type: 'password', required: true },
          { name: 'metadata.parentPageId', label: '부모 Page ID', required: true },
        ]}
        onChanged={() => router.refresh()}
      />

      <IntegrationCard
        provider="brunch"
        label="Brunch"
        description="Brunch는 공개 API를 제공하지 않으므로, 별칭을 저장해두면 내보내기 시 마크다운을 자동으로 클립보드에 복사해 드립니다."
        connected={map.get('brunch')}
        fields={[
          { name: 'username', label: '작가명 / 닉네임', required: true },
          { name: 'token', label: '메모 (선택)', required: false },
        ]}
        onChanged={() => router.refresh()}
      />
    </div>
  );
}

type FieldDef = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
};

function IntegrationCard({
  provider,
  label,
  description,
  connected,
  fields,
  onChanged,
}: {
  provider: string;
  label: string;
  description: string;
  connected?: Integration;
  fields: FieldDef[];
  onChanged: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (connected?.username) initial.username = connected.username;
    if (connected?.metadata) {
      try {
        const meta = JSON.parse(connected.metadata) as Record<string, string>;
        for (const [k, v] of Object.entries(meta)) initial[`metadata.${k}`] = v;
      } catch {}
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const metadata: Record<string, string> = {};
    const payload: Record<string, unknown> = { provider };
    for (const [k, v] of Object.entries(values)) {
      if (!v) continue;
      if (k.startsWith('metadata.')) metadata[k.replace('metadata.', '')] = v;
      else payload[k] = v;
    }
    if (Object.keys(metadata).length) payload.metadata = metadata;
    const res = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setMessage({ kind: 'ok', text: `${label} 연결이 저장되었습니다.` });
      onChanged();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage({ kind: 'err', text: data.error || '저장 실패' });
    }
  }

  async function disconnect() {
    if (!confirm(`${label} 연결을 해제하시겠습니까?`)) return;
    const res = await fetch(`/api/integrations?provider=${provider}`, { method: 'DELETE' });
    if (res.ok) {
      setValues({});
      setMessage({ kind: 'ok', text: `${label} 연결이 해제되었습니다.` });
      onChanged();
    }
  }

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            {label}
            {connected ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                ✓ 연결됨
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                미연결
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        {connected && (
          <button
            onClick={disconnect}
            className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            연결 해제
          </button>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              {f.label}
              {f.required && <span className="text-rose-500"> *</span>}
            </span>
            <input
              type={f.type || 'text'}
              required={f.required}
              value={values[f.name] || ''}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
            />
          </label>
        ))}
        {message && (
          <div
            className={`md:col-span-2 rounded-lg px-3 py-2 text-sm ${
              message.kind === 'ok'
                ? 'bg-brand-50 text-brand-800'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {message.text}
          </div>
        )}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? '저장 중…' : connected ? '업데이트' : '연결하기'}
          </button>
        </div>
      </form>
    </section>
  );
}
