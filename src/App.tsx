import { useState } from "react";
import {
  Activity, AlertOctagon, Battery, Check, ChevronDown, CircleHelp, Clock3,
  Cloud, Cpu, Gauge, LifeBuoy, MapPin, Menu, Radio, RadioTower, Shield,
  Signal, Waves, X,
} from "lucide-react";
import VideoFeed from "./VideoFeed";
import MayorDashboard from "./MayorDashboard";
import ControlPanel from "./ControlPanel";
import { connectSerialController, disconnectSerialController, sendPayloadRelease, type SerialPort } from "./webSerial";
import { type AnalysisUpdate } from "./personDetector";

type Role = "operator" | "mayor" | "citizen";
type LogEntry = { time: string; message: string; tone: "mint" | "amber" | "slate" };

const roleLabels: Record<Role, string> = {
  mayor: "Акимат",
  operator: "ЧС Оператор",
  citizen: "Частный клиент",
};

const initialLog: LogEntry[] = [
  { time: "14:32:08", message: "CRS-10 · Патруль сектора завершён", tone: "slate" },
  { time: "14:29:41", message: "EDGE AI · Ожидание живого видеопотока", tone: "slate" },
  { time: "14:26:12", message: "СИСТЕМА · Спутниковый канал в резерве", tone: "mint" },
];

export default function App() {
  const [role, setRole] = useState<Role>("operator");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [tilt, setTilt] = useState(-12);
  const [dropping, setDropping] = useState(false);
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null);
  const [serialMessage, setSerialMessage] = useState("");
  const [sosSent, setSosSent] = useState(false);
  const [log, setLog] = useState(initialLog);

  function addLog(message: string, tone: LogEntry["tone"]) {
    setLog((current) => [{ time: new Date().toLocaleTimeString("ru-RU", { hour12: false }), message, tone }, ...current].slice(0, 5));
  }

  async function handleConnectSerial() {
    setSerialMessage("");
    try {
      const port = await connectSerialController();
      setSerialPort(port);
      setSerialMessage("Контроллер подключен · 115200 baud");
      addLog("HARDWARE · Контроллер макета подключен", "mint");
    } catch (error) {
      setSerialMessage(error instanceof Error ? error.message : "Не удалось подключить контроллер.");
    }
  }

  async function handleDisconnectSerial() {
    if (!serialPort) return;
    try {
      await disconnectSerialController(serialPort);
      setSerialPort(null);
      setSerialMessage("Контроллер отключен");
      addLog("HARDWARE · Контроллер отключен", "slate");
    } catch (error) {
      setSerialMessage(error instanceof Error ? error.message : "Не удалось отключить контроллер.");
    }
  }

  async function handlePayloadDrop() {
    setDropping(true);
    try {
      if (serialPort) {
        await sendPayloadRelease(serialPort);
        addLog("HARDWARE · Команда сброса отправлена контроллеру", "amber");
        setSerialMessage("Команда отправлена · дождитесь подтверждения датчика");
      } else {
        addLog("DEMO · Симуляция сброса баллона (контроллер не подключен)", "amber");
        setSerialMessage("Демонстрация: команда не отправлена на реальное оборудование");
      }
      window.setTimeout(() => setDropping(false), 1300);
    } catch (error) {
      setDropping(false);
      setSerialMessage(error instanceof Error ? error.message : "Ошибка передачи команды сброса.");
    }
  }

  function sendSos() {
    setSosSent(true);
    addLog("SOS · Запрос помощи зарегистрирован (демо)", "amber");
  }

  const nav = (
    <>
      <p className="eyebrow mb-3 px-3">РАБОЧЕЕ ПРОСТРАНСТВО</p>
      <button className="nav-item nav-item-active" onClick={() => setMobileMenuOpen(false)}><Activity size={17} /> Ситуационный обзор</button>
      <button className="nav-item" onClick={() => setRole("operator")}><RadioTower size={17} /> Флот дронов <span className="ml-auto rounded-full bg-mint/10 px-2 py-0.5 font-mono text-[9px] text-mint">08</span></button>
      <button className="nav-item" onClick={() => setRole("mayor")}><MapPin size={17} /> Карта покрытия</button>
      <button className="nav-item" onClick={() => setRole("operator")}><Shield size={17} /> Инциденты</button>
      <div className="my-5 border-t border-line" />
      <p className="eyebrow mb-3 px-3">ПЛАТФОРМА</p>
      <div className="sidebar-tech"><Cpu size={15} /><span>EDGE AI</span><span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint" /></div>
      <div className="sidebar-tech"><Cloud size={15} /><span>MICROSERVICES</span><span className="ml-auto text-[9px] text-mint">ONLINE</span></div>
      <div className="sidebar-tech"><Radio size={15} /><span>5G / SAT</span><span className="ml-auto text-[9px] text-mint">STANDBY</span></div>
      <div className="mt-auto hidden rounded-xl border border-mint/10 bg-mint/[.035] p-3 lg:block">
        <div className="mb-2 flex items-center gap-2 text-mint"><LifeBuoy size={16} /><span className="font-mono text-[10px]">CRS-10 PILOT</span></div>
        <p className="text-[10px] leading-4 text-slate-500">Система мониторинга и быстрого реагирования на побережье Каспия.</p>
      </div>
    </>
  );

  return (
    <div className="app-shell min-h-screen text-slate-100">
      <div className="scene-backdrop" aria-hidden="true">
        <svg className="scene-contours" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
          <path d="M-120 185 C100 50 260 290 470 174 S825 66 1010 205 S1370 302 1730 90" />
          <path d="M-110 220 C110 86 269 324 488 207 S831 101 1030 237 S1382 334 1730 125" />
          <path d="M-90 261 C129 125 288 365 506 247 S850 143 1052 279 S1401 376 1730 166" />
          <path d="M-70 304 C149 169 308 406 526 290 S870 185 1073 320 S1421 420 1730 207" />
          <path d="M-90 710 C150 590 282 830 514 702 S870 612 1072 744 S1410 825 1730 650" />
          <path d="M-80 752 C162 630 300 871 532 743 S886 654 1090 786 S1430 866 1730 691" />
          <path d="M-65 795 C176 671 317 912 548 785 S902 697 1108 828 S1448 908 1730 733" />
          <path d="M250 -80 C370 80 275 227 414 355 S547 594 408 732 S332 910 465 1080" />
          <path d="M291 -80 C414 85 315 238 454 367 S587 604 449 747 S372 925 505 1080" />
          <path d="M1250 -80 C1110 92 1265 240 1124 372 S1015 610 1153 748 S1240 930 1108 1080" />
          <path d="M1295 -80 C1154 96 1308 248 1168 381 S1059 619 1197 758 S1283 936 1152 1080" />
        </svg>
        <div className="scene-beacon scene-beacon-one" />
        <div className="scene-beacon scene-beacon-two" />
      </div>
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-line bg-ink/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button className="icon-button lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}>{mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}</button>
          <div className="brand-mark"><Waves size={19} /></div>
          <div>
            <div className="flex items-baseline gap-2"><span className="text-sm font-extrabold tracking-[.09em] text-white">CRS<span className="text-mint">-10</span></span><span className="hidden text-[10px] text-slate-500 sm:inline">CASPIAN RESCUE SYSTEMS</span></div>
            <p className="font-mono text-[8px] tracking-[.16em] text-slate-500 sm:hidden">CASPIAN RESCUE SYSTEMS</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-mint/15 bg-mint/[.045] px-3 py-1.5 md:flex">
          <span className="status-dot" /><span className="font-mono text-[9px] tracking-wide text-mint/90">СИСТЕМА В СЕТИ</span><span className="mx-1 h-3 w-px bg-line" /><span className="font-mono text-[9px] text-slate-400">АКТАУ · 14:32:08</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 font-mono text-[9px] text-slate-400 sm:flex"><Signal size={14} className="text-mint" /> 5G</div>
          <div className="relative">
            <label className="sr-only" htmlFor="role-select">Выбрать роль</label>
            <select id="role-select" value={role} onChange={(event) => setRole(event.target.value as Role)} className="role-select">
              <option value="mayor">Акимат</option><option value="operator">ЧС Оператор</option><option value="citizen">Частный клиент</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="hidden h-8 w-8 items-center justify-center rounded-full border border-line bg-panel text-[10px] font-bold text-mint sm:flex">CR</div>
        </div>
      </header>

      {mobileMenuOpen && <button className="fixed inset-0 z-20 bg-black/55 lg:hidden" aria-label="Закрыть меню" onClick={() => setMobileMenuOpen(false)} />}
      <div className="mx-auto flex max-w-[1600px]">
        <aside className={`fixed inset-y-[68px] left-0 z-30 flex w-[250px] flex-col border-r border-line bg-ink px-4 py-6 transition-transform lg:sticky lg:top-[68px] lg:z-10 lg:h-[calc(100vh-68px)] lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-7 rounded-xl border border-line bg-panel/70 p-3">
            <p className="font-mono text-[9px] tracking-[.13em] text-slate-500">ТЕКУЩАЯ ОПЕРАЦИЯ</p>
            <div className="mt-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-100">Сектор Актау · 01</span><span className="status-dot" /></div>
            <p className="mt-1 font-mono text-[9px] text-slate-500">43.638° N&nbsp; 51.156° E</p>
          </div>
          {nav}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="mx-auto max-w-[1300px]">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
              <div>
                <div className="mb-2 flex items-center gap-2"><span className="eyebrow">MANGYSTAU REGION</span><span className="h-1 w-1 rounded-full bg-slate-600" /><span className="font-mono text-[9px] text-slate-500">{roleLabels[role].toUpperCase()} VIEW</span></div>
                <h1 className="text-[22px] font-extrabold tracking-tight text-white sm:text-[28px]">{role === "mayor" ? "Ситуационный центр" : role === "citizen" ? "Безопасность акватории" : "Оперативный контроль"}</h1>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">{role === "mayor" ? "Мониторинг побережья и готовность спасательного флота" : role === "citizen" ? "Мониторинг пляжа и быстрый вызов помощи" : "Миссия CRS-10 · дрон CRS-10-04 · сектор Актау"}</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-panel/60 px-3 py-2 font-mono text-[9px] text-slate-400"><span className="status-dot" /> LIVE <span className="text-slate-600">/</span> {new Date().toLocaleDateString("ru-RU")}</div>
            </div>

            {role === "mayor" ? <MayorDashboard /> : role === "citizen" ? (
              <CitizenView sosSent={sosSent} onSos={sendSos} aiEnabled={aiEnabled} onAiEnabledChange={setAiEnabled} />
            ) : (
              <OperatorView
                aiEnabled={aiEnabled} onAiEnabledChange={setAiEnabled} tilt={tilt} onTiltChange={setTilt}
                dropping={dropping} onDrop={handlePayloadDrop}
                serialConnected={Boolean(serialPort)} serialMessage={serialMessage}
                onConnectSerial={handleConnectSerial} onDisconnectSerial={handleDisconnectSerial} log={log}
                onDispatch112={(message) => addLog(`ДЧС 112 · ${message}`, "mint")}
              />
            )}

            <footer className="mt-7 flex flex-col gap-2 border-t border-line py-4 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>CRS-10 · Проект пилотной системы мониторинга побережья Мангистау</span>
              <span className="flex items-center gap-1.5"><CircleHelp size={12} /> AI-детекция требует подтверждения оператором · Демо-интерфейс</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function OperatorView({
  aiEnabled, onAiEnabledChange, tilt, onTiltChange, dropping, onDrop,
  serialConnected, serialMessage, onConnectSerial, onDisconnectSerial, log, onDispatch112,
}: {
  aiEnabled: boolean; onAiEnabledChange: (enabled: boolean) => void; tilt: number; onTiltChange: (tilt: number) => void;
  dropping: boolean; onDrop: () => void;
  serialConnected: boolean; serialMessage: string; onConnectSerial: () => void; onDisconnectSerial: () => void; log: LogEntry[];
  onDispatch112: (message: string) => void;
}) {
  const [analysis, setAnalysis] = useState<AnalysisUpdate>({ status: "camera", people: [] });

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Telemetry icon={<Battery size={16} />} label="ЗАРЯД БАТАРЕИ" value="84" unit="%" detail="Демо-значение · расчёт 24 мин" accent />
        <Telemetry icon={<Gauge size={16} />} label="ВЫСОТА / СКОРОСТЬ" value="32" unit="м" detail="Демо-значения · 38 км/ч" />
        <Telemetry icon={<MapPin size={16} />} label="GPS · АКТАУ" value="43.650" unit="° N" detail="51.160° E · координаты макета" />
        <Telemetry icon={<Signal size={16} />} label="КАНАЛ СВЯЗИ" value="−62" unit="dBm" detail="Демо · 5G / спутник не подключены" accent />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.58fr)_minmax(300px,.82fr)]">
        <div className="space-y-4">
          <VideoFeed aiEnabled={aiEnabled} onAiEnabledChange={onAiEnabledChange} onAnalysisUpdate={setAnalysis} />
          <ArchitecturePanel />
        </div>
        <div className="space-y-4">
          <section className="panel p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div><p className="eyebrow">EDGE AI · RISK ANALYSIS</p><h2 className="mt-1 text-sm font-bold text-white">Анализ угроз</h2></div>
              <div className={`rounded-md px-2 py-1 font-mono text-[9px] ${analysis.people.length ? "bg-red-400/10 text-red-200" : analysis.status === "ready" ? "bg-mint/10 text-mint" : "bg-slate-700/40 text-slate-400"}`}>
                {analysis.people.length ? "ЧЕЛОВЕК В КАДРЕ" : analysis.status === "ready" ? "РИСК НЕ ОЦЕНЁН" : analysis.status === "loading" ? "AI ЗАГРУЖАЕТСЯ" : analysis.status === "error" ? "AI НЕДОСТУПЕН" : aiEnabled ? "ОЖИДАНИЕ КАМЕРЫ" : "AI OFF"}
              </div>
            </div>
            <div className="space-y-2">
              <RiskRow
                label="Человек в кадре"
                tag="COCO-SSD · CLASS: PERSON"
                status={analysis.status === "error" ? "unavailable" : analysis.status !== "ready" ? "waiting" : analysis.people.length ? "active" : "inactive"}
                value={analysis.status === "ready" ? `${analysis.people.length} ${analysis.people.length === 1 ? "ЦЕЛЬ" : "ЦЕЛЕЙ"}` : undefined}
              />
              <RiskRow label="Поведение утопающего" tag="ТРЕБУЕТ ОТДЕЛЬНОЙ МОДЕЛИ" status="unavailable" />
              <RiskRow label="Отжимное течение" tag="ТРЕБУЕТ ДАННЫХ О ВОЛНАХ" status="unavailable" />
            </div>
            {analysis.people.length > 0 && (
              <div className="mt-3 space-y-2 rounded-lg border border-mint/15 bg-mint/[.035] p-3">
                <p className="font-mono text-[9px] text-mint">ПОЛОЖЕНИЕ ЦЕЛИ В КАДРЕ</p>
                {analysis.people.map((person, index) => (
                  <div key={person.id} className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="text-slate-300">Человек #{index + 1}</span>
                    <span className="font-mono text-mint">X {person.centerX}% · Y {person.centerY}%</span>
                    <span className="font-mono text-slate-400">{Math.round(person.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <span className="text-[10px] text-slate-500">COCO-SSD · MobileNetV2</span>
              <span className="font-mono text-xs font-medium text-mint">{analysis.people.length ? `${Math.round(Math.max(...analysis.people.map((person) => person.confidence)) * 100)}%` : "—"}</span>
            </div>
            <div className="mt-3 rounded-md border border-amber-400/15 bg-amber-400/[.045] p-2.5 text-[10px] leading-4 text-amber-100/75">
              Координаты X/Y показывают положение в кадре, а не GPS человека. Модель распознаёт людей, но не определяет утопление и не подтверждает угрозу. Решение принимает оператор.
            </div>
          </section>

          <ControlPanel
            tilt={tilt}
            onTiltChange={onTiltChange}
            serialConnected={serialConnected}
            serialMessage={serialMessage}
            dropping={dropping}
            onDrop={onDrop}
            onConnectSerial={onConnectSerial}
            onDisconnectSerial={onDisconnectSerial}
            onDispatch112={onDispatch112}
          />

          <section className="panel p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between"><div><p className="eyebrow">EVENT STREAM</p><h2 className="mt-1 text-sm font-bold text-white">Журнал событий</h2></div><Clock3 size={15} className="text-slate-500" /></div>
            <div className="space-y-3">
              {log.map((entry, index) => <div key={`${entry.time}-${index}`} className="flex gap-2.5"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${entry.tone === "mint" ? "bg-mint" : entry.tone === "amber" ? "bg-amber-300" : "bg-slate-600"}`} /><div className="min-w-0"><p className="text-[10px] leading-4 text-slate-300">{entry.message}</p><p className="mt-0.5 font-mono text-[9px] text-slate-600">{entry.time}</p></div></div>)}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Telemetry({ icon, label, value, unit, detail, accent = false }: { icon: React.ReactNode; label: string; value: string; unit: string; detail: string; accent?: boolean }) {
  return <section className="panel p-3.5 sm:p-4"><div className="mb-2 flex items-center justify-between gap-1"><span className="eyebrow truncate">{label}</span><span className={accent ? "text-mint" : "text-slate-500"}>{icon}</span></div><p className="text-xl font-bold tracking-tight text-white sm:text-2xl">{value}<span className="ml-1 text-[11px] font-medium text-slate-400">{unit}</span></p><p className="mt-1 truncate text-[9px] text-slate-500">{detail}</p></section>;
}

function RiskRow({ label, tag, status, value }: { label: string; tag: string; status: "active" | "inactive" | "waiting" | "unavailable"; value?: string }) {
  const color = status === "active" ? "bg-red-400 text-red-200" : status === "inactive" ? "bg-slate-600 text-slate-500" : status === "waiting" ? "bg-amber-300 text-amber-200" : "bg-slate-700 text-slate-500";
  const labelText = value ?? (status === "active" ? "НАЙДЕН" : status === "inactive" ? "НЕ НАЙДЕН" : status === "waiting" ? "ОЖИДАНИЕ" : "НЕТ АНАЛИЗА");
  return <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white/[.02] px-3 py-2.5">
    <div className="flex min-w-0 items-center gap-2"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status === "active" ? "animate-pulse" : ""} ${color.split(" ")[0]}`} /><div className="min-w-0"><p className="truncate text-[10px] text-slate-200">{label}</p><p className="mt-0.5 truncate font-mono text-[8px] text-slate-500">{tag}</p></div></div>
    <span className={`shrink-0 font-mono text-[8px] ${color.split(" ")[1]}`}>{labelText}</span>
  </div>;
}

function ArchitecturePanel() {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="eyebrow">SYSTEM ARCHITECTURE</p><h2 className="mt-1 text-sm font-bold text-white">Связь и вычислительный контур</h2></div><span className="font-mono text-[8px] text-slate-500">REFERENCE DESIGN</span></div>
      <div className="grid gap-2 sm:grid-cols-3">
        <ArchNode title="EDGE AI · DEMO" description="COCO-SSD / MobileNetV2 · анализ класса «человек»" latency="INFERENCE · BROWSER" icon={<Cpu size={15} />} />
        <ArchNode title="STREAM · H.264 / WebRTC" description="RTSP ingest · целевая задержка <150 мс*" latency="5G · STARLINK FAILOVER" icon={<RadioTower size={15} />} />
        <ArchNode title="BACKEND · NODE.JS / GO" description="WebSocket events · API · dispatch 112" latency="MICROSERVICES" icon={<Cloud size={15} />} />
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-white/[.02] p-3 text-[9px] leading-4 text-slate-500"><AlertOctagon size={13} className="mt-0.5 shrink-0 text-amber-300/80" /><span>* Архитектурная цель, не измеренная характеристика текущего демо. Подключение к 112, RTSP/WebRTC, спутниковому каналу и Edge AI требует серверной реализации и согласования с оператором.</span></div>
    </section>
  );
}

function ArchNode({ title, description, latency, icon }: { title: string; description: string; latency: string; icon: React.ReactNode }) {
  return <div className="rounded-lg border border-line bg-[#091522] p-3"><div className="mb-2 flex items-center gap-2 text-mint">{icon}<span className="font-mono text-[8px] tracking-wide">{title}</span></div><p className="min-h-8 text-[9px] leading-4 text-slate-400">{description}</p><p className="mt-2 border-t border-line pt-2 font-mono text-[8px] text-slate-600">{latency}</p></div>;
}

function CitizenView({ sosSent, onSos, aiEnabled, onAiEnabledChange }: { sosSent: boolean; onSos: () => void; aiEnabled: boolean; onAiEnabledChange: (enabled: boolean) => void }) {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-4">
          <VideoFeed aiEnabled={aiEnabled} onAiEnabledChange={onAiEnabledChange} />
          <section className="panel p-5"><div className="mb-4 flex items-center gap-3"><div className="icon-tile"><MapPin size={17} /></div><div><h2 className="text-sm font-bold text-white">Ваша зона наблюдения</h2><p className="text-[10px] text-slate-500">Пляж Актау · городской сектор</p></div></div><div className="flex items-center justify-between border-t border-line pt-4"><div><p className="eyebrow">СТАТУС АКВАТОРИИ</p><p className="mt-1 text-sm font-semibold text-mint">Патруль активен</p></div><span className="font-mono text-[10px] text-slate-400">ДРОН · 1.2 км</span></div></section>
        </div>
        <div className="space-y-4">
          <section className="panel p-5">
            <p className="eyebrow">НУЖНА ПОМОЩЬ?</p><h2 className="mt-2 text-lg font-bold text-white">Свяжитесь со спасателями</h2><p className="mt-2 text-xs leading-5 text-slate-400">При непосредственной угрозе жизни звоните в службу спасения 112. Кнопка ниже — демонстрация отправки SOS в интерфейсе.</p>
            <button onClick={onSos} disabled={sosSent} className={`mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl px-4 text-sm font-extrabold transition ${sosSent ? "border border-mint/25 bg-mint/10 text-mint" : "bg-red-500 text-white shadow-[0_8px_28px_rgba(239,68,68,.2)] hover:bg-red-400 active:scale-[.99]"}`}>
              {sosSent ? <Check size={19} /> : <AlertOctagon size={19} />}{sosSent ? "SOS зарегистрирован (демо)" : "ОТПРАВИТЬ SOS"}
            </button>
            {sosSent && <p role="status" className="mt-3 text-[10px] leading-4 text-slate-400">Заявка показана только в журнале демо. Для реальной экстренной помощи позвоните 112.</p>}
            <a className="mt-4 block text-center text-xs font-semibold text-mint underline underline-offset-4" href="tel:112">Позвонить 112</a>
          </section>
          <section className="panel p-5"><div className="mb-3 flex items-center gap-2 text-mint"><Waves size={17} /><h2 className="text-sm font-bold text-white">Условия на побережье</h2></div><div className="space-y-3"><div className="flex justify-between text-xs"><span className="text-slate-400">Ветер</span><span className="text-slate-200">12 км/ч · северо-запад</span></div><div className="flex justify-between text-xs"><span className="text-slate-400">Волнение</span><span className="text-slate-200">0.4 м · умеренное</span></div><div className="flex justify-between text-xs"><span className="text-slate-400">Температура воды</span><span className="text-slate-200">+18°C</span></div></div><p className="mt-4 border-t border-line pt-3 text-[9px] text-slate-600">Демонстрационные данные · не использовать для принятия решений.</p></section>
        </div>
      </div>
    </div>
  );
}
