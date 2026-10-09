import { notFound } from 'next/navigation';
import Workspace from '@/components/workspace';
export default async function Page({ params }: { params: Promise<{ path?: string[] }> }) {
  const path = (await params).path ?? [];
  if (path.length && (!['equipment', 'borrowers', 'loans'].includes(path[0]) || path.length > 3 || (path[1] && path[1] !== 'new' && !/^[a-f0-9]{24}$/i.test(path[1])) || (path[2] && (path[2] !== 'edit' || path[1] === 'new')))) notFound();
  return <Workspace path={path} />;
}
