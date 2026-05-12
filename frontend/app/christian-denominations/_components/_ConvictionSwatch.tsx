import { getConvictionStyle } from '../_helpers';

export function ConvictionSwatch({ score, label }: { score: number; label: string }) {
  const style = getConvictionStyle(score);
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${style.dotColor} ring-2 ${style.ringColor} ring-offset-1`} />
      <span className="text-slate-500">{label}</span>
    </div>
  );
}