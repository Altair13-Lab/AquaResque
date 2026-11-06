import { useEffect, useState } from "react";
import { CalendarDays, CircleHelp, MapPin, TriangleAlert, Waves } from "lucide-react";

type RiskStatus = "danger" | "safe" | "unknown";
type DailyRecords = Record<string, Record<string, RiskStatus>>;

const STORAGE_KEY = "crs10-beach-risk-records-v1";

const locations = [
  { id: "aktau", name: "МАКЕТ · сектор A (Актау)", x: 118, y: 145 },
  { id: "kuryk", name: "МАКЕТ · сектор B (Курык)", x: 245, y: 205 },
  { id: "akshukur", name: "МАКЕТ · сектор C (Акшукур)", x: 378, y: 260 },
];

const statusNames: Record<RiskStatus, string> = {
  danger: "ОПАСНО · УЧЕБНЫЙ СТАТУС",
  safe: "БЕЗ ОГРАНИЧЕНИЙ · УЧЕБНЫЙ",
  unknown: "НЕТ СВОДКИ",
};

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readDailyRecords(): DailyRecords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Некорректный формат локальных записей.");
    }
    const records = parsed as DailyRecords;
    for (const [date, daily] of Object.entries(records)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !daily || typeof daily !== "object") {
        throw new Error("Некорректный формат записи статуса.");
      }
      for (const status of Object.values(daily)) {
        if (status !== "danger" && status !== "safe" && status !== "unknown") {
          throw new Error("В записи найден неизвестный статус акватории.");
        }
      }
    }
    const today = localDateKey(new Date());
    if (!records[today]) {
      records[today] = { aktau: "danger", kuryk: "safe", akshukur: "unknown" };
    }
    return records;
  } catch (error) {
    console.error("Не удалось загрузить локальные статусы акватории.", error);
    return {};
  }
}

export default function BeachSafetyMap() {
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [records, setRecords] = useState<DailyRecords>(readDailyRecords);
  const [storageError, setStorageError] = useState("");

  const currentRecords = records[selectedDate] ?? {};
  const hasReport = locations.some((location) => currentRecords[location.id] && currentRecords[location.id] !== "unknown");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      setStorageError("");
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Не удалось сохранить статусы в этом браузере.");
    }
  }, [records]);

  function updateStatus(locationId: string, status: RiskStatus) {
    setRecords((previous) => ({
      ...previous,
      [selectedDate]: {
        ...previous[selectedDate],
        [locationId]: status,
      },
    }));
  }

  function clearDay() {
    setRecords((previous) => ({
      ...previous,
      [selectedDate]: Object.fromEntries(locations.map((location) => [location.id, "unknown"])),
    }));
  }

  return (
    <section className="panel overflow-hidden" aria-labelledby="beach-map-title">
      <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="eyebrow">DAILY BEACH CONDITIONS · MANUAL / DEMO</p>
          <h2 id="beach-map-title" className="mt-1 text-lg font-bold text-white">Карта статуса пляжей</h2>
          <p className="mt-1 text-[10px] text-slate-400">Выберите дату и внесите статус по каждой зоне. Схема ориентировочная.</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-line bg-[#091522] px-3 py-2">
          <CalendarDays size={14} className="text-mint" />
          <span className="font-mono text-[9px] text-slate-400">ДАТА</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="bg-transparent font-mono text-[10px] text-slate-200 outline-none"
            aria-label="Дата статуса пляжей"
          />
        </label>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_.85fr]">
        <div className="risk-map-water relative min-h-[300px] overflow-hidden border-b border-line p-4 lg:border-b-0 lg:border-r sm:p-6">
          <div className="map-grid absolute inset-0 opacity-60" />
          <svg viewBox="0 0 480 330" className="relative min-h-[270px] w-full" role="img" aria-label="Ориентировочная схема секторов пляжей Актау и Мангистау">
            <path d="M0 0 H480 V150 C435 161 411 187 376 207 C331 231 307 224 275 254 C237 289 210 281 175 305 C120 335 63 307 0 330Z" fill="#132d38" />
            <path d="M0 270 C66 283 102 326 166 293 C218 266 243 275 281 239 C318 205 347 222 386 187 C420 158 447 143 480 134" fill="none" stroke="#92c8c8" strokeOpacity=".7" strokeWidth="2" />
            <path d="M15 249 C81 262 111 302 169 270 C221 241 250 251 290 215 C329 179 355 195 396 160 C427 134 452 119 475 110" fill="none" stroke="#55e6bd" strokeOpacity=".32" strokeDasharray="5 6" />
            <path d="M20 218 C85 231 121 269 174 237 C225 207 255 220 301 184 C341 153 369 166 407 134" fill="none" stroke="#90cbd5" strokeOpacity=".12" />
            <text x="21" y="34" fill="#90a5b3" fontSize="10" fontFamily="DM Mono, monospace">МАНГИСТАУ · КАСПИЙСКОЕ МОРЕ</text>
            <text x="22" y="57" fill="#617b8a" fontSize="8" fontFamily="DM Mono, monospace">ЗОНЫ НЕ ЯВЛЯЮТСЯ ТОЧНЫМИ ГРАНИЦАМИ ПЛЯЖЕЙ</text>
            {locations.map((location) => {
              const status = currentRecords[location.id] ?? "unknown";
              const color = status === "danger" ? "#fb7185" : status === "safe" ? "#55e6bd" : "#94a3b8";
              return (
                <g key={location.id}>
                  {status !== "unknown" && <circle cx={location.x} cy={location.y} r="22" fill={color} fillOpacity=".08" />}
                  <circle cx={location.x} cy={location.y} r="9" fill="#07111d" stroke={color} strokeWidth="2" />
                  <circle cx={location.x} cy={location.y} r="3" fill={color} />
                  <text x={location.x + 14} y={location.y - 7} fill="#d4e0e8" fontSize="9" fontFamily="DM Mono, monospace">{location.name}</text>
                </g>
              );
            })}
            <g transform="translate(345 92)">
              <path d="M0 -10 L4 0 L0 10 L-4 0Z" fill="#55e6bd" />
              <circle r="13" fill="none" stroke="#55e6bd" strokeOpacity=".4" />
              <text x="15" y="3" fill="#9fead4" fontSize="8" fontFamily="DM Mono, monospace">CRS-10 · МАКЕТ</text>
            </g>
          </svg>
          <div className="relative mt-3 flex flex-wrap gap-3 font-mono text-[8px] text-slate-400">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-red-400" />ОПАСНО</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-mint" />БЕЗ ОГРАНИЧЕНИЙ</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-slate-400" />НЕТ СВОДКИ</span>
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <div className={`flex items-start gap-2 rounded-lg border p-3 text-[10px] leading-4 ${hasReport ? "border-amber-300/15 bg-amber-300/[.045] text-amber-100/80" : "border-slate-400/15 bg-white/[.025] text-slate-300"}`}>
            {hasReport ? <TriangleAlert size={14} className="mt-0.5 shrink-0 text-amber-300" /> : <CircleHelp size={14} className="mt-0.5 shrink-0 text-slate-400" />}
            <span>{hasReport ? "Показаны пользовательские/учебные статусы, не официальное предупреждение. Проверьте условия и указания спасателей на месте." : "На эту дату нет внесённой сводки. «Нет данных» не означает, что купаться безопасно."}</span>
          </div>
          {locations.map((location) => {
            const status = currentRecords[location.id] ?? "unknown";
            return (
              <div key={location.id} className="flex flex-col gap-2 rounded-lg border border-line bg-white/[.02] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin size={14} className={status === "danger" ? "shrink-0 text-red-300" : status === "safe" ? "shrink-0 text-mint" : "shrink-0 text-slate-500"} />
                  <div className="min-w-0"><p className="truncate text-[10px] font-semibold text-slate-100">{location.name}</p><p className={`mt-0.5 font-mono text-[8px] ${status === "danger" ? "text-red-200" : status === "safe" ? "text-mint" : "text-slate-500"}`}>{statusNames[status]}</p></div>
                </div>
                <label className="sr-only" htmlFor={`risk-${location.id}`}>Статус зоны {location.name}</label>
                <select id={`risk-${location.id}`} value={status} onChange={(event) => updateStatus(location.id, event.target.value as RiskStatus)} className="select-field min-h-9 text-[9px]">
                  <option value="unknown">Нет сводки</option>
                  <option value="danger">Опасно · закрыть зону</option>
                  <option value="safe">Без ограничений · учебный</option>
                </select>
              </div>
            );
          })}
          <div className="flex items-start gap-2 border-t border-line pt-3 text-[9px] leading-4 text-slate-500"><Waves size={12} className="mt-0.5 shrink-0" /><span>Значения сохраняются только в этом браузере. Для оперативных предупреждений нужны официальные данные ДЧС, спасателей, метеослужбы и проверенные координаты пляжей.</span></div>
          {storageError && <p role="alert" className="text-[9px] text-red-300">Не удалось сохранить изменения: {storageError}</p>}
          <button type="button" className="button-secondary min-h-9 w-full text-[9px]" onClick={clearDay}>Очистить статусы выбранной даты</button>
        </div>
      </div>
    </section>
  );
}
