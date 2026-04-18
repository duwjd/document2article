import NewArticleForm from '@/components/NewArticleForm';
import { requireUser } from '@/lib/auth';

export default async function NewArticlePage() {
  await requireUser();
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">새 아티클 만들기</h1>
      <p className="mt-1 text-sm text-slate-500">
        PDF를 업로드하거나 웹페이지 URL을 붙여넣으면 마크다운으로 변환됩니다.
      </p>
      <div className="mt-6">
        <NewArticleForm />
      </div>
    </div>
  );
}
