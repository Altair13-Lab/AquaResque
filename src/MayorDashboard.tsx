import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Clock3, MapPin, ShieldCheck, Waves, RadioTower } from "lucide-react";
import BeachSafetyMap from "./BeachSafetyMap";

const sectors = [
  { name: "Актау — Форт-Шевченко", status: "ПОД КОНТРОЛЕМ", width: "91%" },
  { name: "Форт-Шевченко — Баутино", status: "ПОД КОНТРОЛЕМ", width: "76%" },
  { name: "Баутино — Акшукур", status: "ПАТРУЛИРОВАНИЕ", width: "68%" },
];

export default function MayorDashboard() {
  return (
    <div className="space-y-5">
      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="eyebrow">REGIONAL COVERAGE · MANGYSTAU</p>
            <h2 className="mt-1 text-xl font-bold text-white">Безопасность побережья</h2>
            <p className="mt-1 text-xs text-slate-400">Оперативное покрытие Каспия от Актау до Акшукурa</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-lg border border-mint/20 bg-mint/[.06] px-3 py-2 text-xs text-mint sm:self-auto">
            <span className="status-dot" /> СХЕМА · 100 км зона мониторинга
          </div>
        </div>
        <div className="grid gap-0 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative min-h-[260px] overflow-hidden border-b border-line bg-[#0a1c29] p-5 lg:border-b-0 lg:border-r sm:p-7">
            <div className="map-grid absolute inset-0 opacity-50" />
            <svg viewBox="0 0 480 260" className="relative h-full min-h-[225px] w-full" role="img" aria-label="Схема 100 километров побережья Каспия">
              <path d="M75 26 C118 38 105 82 160 91 C214 99 197 132 256 141 C303 149 298 181 358 191 C398 198 411 221 455 230 L455 260 L75 260Z" fill="#123548" opacity=".8" />
              <path d="M75 26 C118 38 105 82 160 91 C214 99 197 132 256 141 C303 149 298 181 358 191 C398 198 411 221 455 230" fill="none" stroke="#55e6bd" strokeWidth="2" strokeDasharray="5 6" />
              <path d="M92 44 L151 87 L246 137 L344 186 L431 223" fill="none" stroke="#55e6bd" strokeWidth="1.5" opacity=".45" />
              {[["92","44","АКТАУ"],["151","87","КУРЫК"],["246","137","ФОРТ-ШЕВЧЕНКО"],["344","186","БАУТИНО"],["431","223","АКШУКУР"]].map(([cx, cy, name], i) => (
                <g key={name}>
                  <circle cx={cx} cy={cy} r={i === 0 ? 8 : 5} fill="#55e6bd" opacity=".18" />
                  <circle cx={cx} cy={cy} r={i === 0 ? 3.5 : 2.5} fill="#8affda" />
                  <text x={Number(cx) + 10} y={Number(cy) - 8} fill="#c7d7e3" fontSize="8" fontFamily="DM Mono, monospace">{name}</text>
                </g>
              ))}
              <g transform="translate(255 119)"><path d="M0 -12 L4 0 L0 12 L-4 0Z" fill="#f3a761" /><circle r="16" fill="none" stroke="#f3a761" opacity=".45" /></g>
              <text x="202" y="106" fill="#f3a761" fontSize="8" fontFamily="DM Mono, monospace">CRS-10 · В ПОЛЁТЕ</text>
            </svg>
            <div className="absolute bottom-4 left-5 flex items-center gap-2 text-[10px] text-slate-400 sm:left-7"><MapPin size={12} className="text-mint" /> Схема зоны патрулирования</div>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center justify-between"><p className="eyebrow">ПОКРЫТИЕ СЕКТОРОВ</p><span className="font-mono text-[10px] text-slate-500">3 СЕКТОРА</span></div>
            {sectors.map((sector) => (
              <div key={sector.name}>
                <div className="mb-2 flex items-center justify-between gap-2 text-[11px]"><span className="text-slate-200">{sector.name}</span><span className="font-mono text-[8px] text-mint/80">{sector.status}</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-mint/70 to-mint" style={{ width: sector.width }} /></div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 border-t border-line pt-4">
              <div className="rounded-lg bg-white/[.025] p-3"><p className="font-mono text-[9px] text-slate-500">ФЛОТ В СЕТИ</p><p className="mt-1 text-xl font-bold text-white">08 <span className="text-xs font-medium text-slate-500">/ 10</span></p></div>
              <div className="rounded-lg bg-white/[.025] p-3"><p className="font-mono text-[9px] text-slate-500">ГОТОВНОСТЬ</p><p className="mt-1 text-xl font-bold text-mint">94<span className="text-sm">%</span></p></div>
            </div>
          </div>
        </div>
      </section>

      <BeachSafetyMap />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Clock3 size={16} />} label="ЦЕЛЬ ПО ВРЕМЕНИ ОТКЛИКА" value="15 → 45" unit="мин → сек" detail="Проектный KPI · требует пилотной проверки" positive />
        <Metric icon={<ShieldCheck size={16} />} label="СПАСЁННЫЕ ЖИЗНИ" value="—" unit="" detail="Нет верифицированной статистики" />
        <Metric icon={<Waves size={16} />} label="ИНДЕКС БЕЗОПАСНОСТИ" value="НЕ РАССЧИТАН" unit="" detail="Нужна методика и официальные данные" />
        <Metric icon={<CircleDollarSign size={16} />} label="ЭКОНОМИЧЕСКИЙ ЭФФЕКТ" value="ПИЛОТ" unit="" detail="Расчёт затрат ещё не подключён" />
      </div>

      <section className="panel p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><div className="icon-tile"><RadioTower size={17} /></div><div><h2 className="text-sm font-bold text-white">Swarm status · рой CRS-10</h2><p className="mt-1 text-[10px] text-slate-500">Схема дежурства трёх бортов · данные макета</p></div></div>
          <span className="rounded-md border border-amber-300/15 bg-amber-300/[.05] px-2 py-1 font-mono text-[8px] text-amber-100/80">НЕ ПОДКЛЮЧЕНО К ФЛОТУ</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SwarmDrone name="CRS-10-01" sector="Сектор A · Актау" state="Учебный патруль" battery="84%" />
          <SwarmDrone name="CRS-10-02" sector="Сектор B · Курык" state="Резерв / готовность" battery="96%" />
          <SwarmDrone name="CRS-10-03" sector="Сектор C · Акшукур" state="На станции · проверка" battery="100%" />
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="icon-tile"><ShieldCheck size={17} /></div>
          <div><h2 className="text-sm font-bold text-white">Влияние на региональную безопасность</h2><p className="mt-1 text-xs text-slate-500">Оперативная оценка системы CRS-10 · пилотный проект</p></div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Impact title="РАННЕЕ ОБНАРУЖЕНИЕ" text="Edge AI анализирует видеопоток на борту и передаёт тревогу диспетчеру для подтверждения." icon={<Waves size={16} />} />
          <Impact title="БЫСТРЕЕ ПЕРВАЯ ПОМОЩЬ" text="Беспилотник доставляет спасательный баллон до прибытия береговой команды." icon={<ArrowUpRight size={16} />} />
          <Impact title="ПРОЗРАЧНОСТЬ ОПЕРАЦИЙ" text="События, время реагирования и статус флота доступны в единой панели." icon={<ArrowDownRight size={16} />} />
        </div>
        <p className="mt-4 text-[10px] leading-5 text-slate-500">Показатели эффективности являются проектными оценками и требуют подтверждения пилотными испытаниями и региональными данными.</p>
      </section>
    </div>
  );
}

function Metric({ icon, label, value, unit, detail, positive = false }: { icon: React.ReactNode; label: string; value: string; unit: string; detail: string; positive?: boolean }) {
  return <div className="panel p-4"><div className="mb-3 flex items-center justify-between"><span className="eyebrow">{label}</span><span className={positive ? "text-mint" : "text-slate-500"}>{icon}</span></div><p className="text-2xl font-bold tracking-tight text-white">{value}<span className="ml-1 text-sm font-medium text-slate-400">{unit}</span></p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div>;
}

function Impact({ title, text, icon }: { title: string; text: string; icon: React.ReactNode }) {
  return <div className="rounded-lg border border-line bg-white/[.02] p-4"><div className="mb-3 flex items-center gap-2 text-mint">{icon}<span className="font-mono text-[9px] tracking-wide">{title}</span></div><p className="text-xs leading-5 text-slate-400">{text}</p></div>;
}

function SwarmDrone({ name, sector, state, battery }: { name: string; sector: string; state: string; battery: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/[.02] p-3">
    <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-mint/10 bg-mint/[.05] text-mint"><RadioTower size={15} /></div><div className="min-w-0"><p className="font-mono text-[10px] font-medium text-slate-100">{name}</p><p className="mt-1 truncate text-[9px] text-slate-500">{sector} · {state}</p></div></div>
    <span className="shrink-0 font-mono text-[10px] text-slate-400">{battery}</span>
  </div>;
}
