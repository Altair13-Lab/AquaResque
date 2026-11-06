import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, Check, Crosshair, LocateFixed, Radio, ScanLine, Video, VideoOff, Waves } from "lucide-react";
import { detectPeople, loadPersonDetector, type AnalysisUpdate, type PersonDetection } from "./personDetector";

interface VideoFeedProps {
  aiEnabled: boolean;
  onAiEnabledChange: (enabled: boolean) => void;
  onAnalysisUpdate?: (update: AnalysisUpdate) => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

type CameraMode = "rgb" | "thermal" | "night";

export default function VideoFeed({ aiEnabled, onAiEnabledChange, onAnalysisUpdate }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onAnalysisUpdateRef = useRef(onAnalysisUpdate);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisUpdate>({ status: "camera", people: [] });
  const [cameraMode, setCameraMode] = useState<CameraMode>("rgb");

  const firstPerson = analysis.people[0];
  const leadTarget = firstPerson
    ? { x: Math.min(93, firstPerson.centerX + 13), y: Math.min(92, firstPerson.centerY + 9) }
    : null;

  useEffect(() => {
    onAnalysisUpdateRef.current = onAnalysisUpdate;
  }, [onAnalysisUpdate]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let analyzing = false;

    function publish(update: AnalysisUpdate) {
      setAnalysis(update);
      onAnalysisUpdateRef.current?.(update);
    }

    if (!aiEnabled) {
      publish({ status: "off", people: [] });
    } else if (!cameraActive) {
      publish({ status: "camera", people: [] });
    } else {
      publish({ status: "loading", people: [] });
      void loadPersonDetector()
        .then((model) => {
          if (cancelled) return;
          publish({ status: "ready", people: [] });

          const analyzeFrame = async () => {
            const video = videoRef.current;
            if (cancelled) return;

            if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !analyzing) {
              analyzing = true;
              try {
                const people = await detectPeople(model, video);
                if (!cancelled) publish({ status: "ready", people });
              } catch (error) {
                if (!cancelled) {
                  publish({
                    status: "error",
                    people: [],
                    message: error instanceof Error ? error.message : "Не удалось проанализировать видеокадр.",
                  });
                  return;
                }
              } finally {
                analyzing = false;
              }
            }

            if (!cancelled) timer = window.setTimeout(() => void analyzeFrame(), 450);
          };

          void analyzeFrame();
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            publish({
              status: "error",
              people: [],
              message: error instanceof Error ? error.message : "Не удалось загрузить модель распознавания.",
            });
          }
        });
    }

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [aiEnabled, cameraActive]);

  async function refreshDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setCameraError("Браузер не поддерживает доступ к камере.");
      return;
    }

    try {
      const inputs = await navigator.mediaDevices.enumerateDevices();
      const cameras = inputs
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `USB-камера ${index + 1}`,
        }));
      setDevices(cameras);
      if (!selectedDevice && cameras[0]) setSelectedDevice(cameras[0].deviceId);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Не удалось получить список камер.");
    }
  }

  async function connectCamera(deviceId = selectedDevice) {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Камера доступна только в защищенном контексте HTTPS или localhost.");
      return;
    }

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      await refreshDevices();
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraActive(false);
      setCameraError(error instanceof Error ? error.message : "Не удалось подключить камеру.");
    }
  }

  function toggleCamera() {
    if (cameraActive) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
      return;
    }

    void connectCamera();
  }

  function selectCamera(deviceId: string) {
    setSelectedDevice(deviceId);
    if (cameraActive) void connectCamera(deviceId);
  }

  return (
    <section className="panel overflow-hidden" aria-label="Видеопоток с дрона">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="icon-tile"><Video size={17} /></div>
          <div>
            <h2 className="text-sm font-bold text-white">Камера дрона</h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[.13em] text-slate-500">CAM-01 · 1080p / 30 FPS</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="status-pill"><span className="status-dot" />{cameraActive ? "USB LIVE" : "DEMO FEED"}</span>
        <label className="sr-only" htmlFor="camera-mode">Режим изображения камеры</label>
        <select id="camera-mode" className="mode-select" value={cameraMode} onChange={(event) => setCameraMode(event.target.value as CameraMode)}>
          <option value="rgb">RGB Normal</option>
          <option value="thermal">Thermal Heatmap</option>
          <option value="night">Night Vision IR</option>
        </select>
        <button
          type="button"
          className={`icon-button ${aiEnabled ? "text-mint" : ""}`}
          onClick={() => onAiEnabledChange(!aiEnabled)}
          aria-pressed={aiEnabled}
          aria-label={`${aiEnabled ? "Выключить" : "Включить"} AI-обнаружение`}
          title="Переключить AI-обнаружение"
        >
          <ScanLine size={17} />
        </button>
        </div>
      </div>

      <div className="video-stage relative aspect-[16/10] min-h-[230px] overflow-hidden sm:aspect-video">
        <video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover ${cameraActive ? "block" : "hidden"} ${cameraMode === "thermal" ? "camera-thermal" : cameraMode === "night" ? "camera-night" : ""}`} muted playsInline />
        {cameraActive && cameraMode === "thermal" && <div className="thermal-overlay absolute inset-0" aria-hidden="true" />}
        {!cameraActive && (
          <div className="demo-water absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="water-grid" />
            <div className="water-horizon" />
            <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 960 540" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="coast-glow" x1="0" x2="1">
                  <stop offset="0" stopColor="#55e6bd" stopOpacity="0" />
                  <stop offset=".5" stopColor="#55e6bd" stopOpacity=".24" />
                  <stop offset="1" stopColor="#55e6bd" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 128 C130 98 181 171 311 139 S500 123 606 159 S807 199 960 151" fill="none" stroke="#93d4df" strokeOpacity=".12" />
              <path d="M0 165 C124 135 205 204 326 171 S522 151 627 189 S823 223 960 182" fill="none" stroke="#93d4df" strokeOpacity=".15" />
              <path d="M0 205 C138 169 228 240 350 207 S540 189 648 226 S824 257 960 219" fill="none" stroke="#93d4df" strokeOpacity=".1" />
              <path d="M18 367 C163 336 234 382 363 350 S584 334 698 372 S852 392 945 368" fill="none" stroke="#a8d7dc" strokeOpacity=".1" />
              <path d="M0 399 C139 368 255 413 383 381 S588 367 710 405 S859 426 960 397" fill="none" stroke="#a8d7dc" strokeOpacity=".09" />
              <path d="M31 0 C102 65 93 128 155 173 S225 270 186 319 S160 447 226 540" fill="none" stroke="#c9e6e5" strokeOpacity=".11" />
              <path d="M57 0 C128 66 117 126 180 170 S252 269 213 323 S190 448 252 540" fill="none" stroke="#c9e6e5" strokeOpacity=".08" />
              <path d="M795 0 C738 62 762 111 706 169 S672 267 721 310 S751 438 689 540" fill="none" stroke="#c9e6e5" strokeOpacity=".1" />
              <path d="M829 0 C768 61 791 112 737 170 S701 268 751 315 S779 438 716 540" fill="none" stroke="#c9e6e5" strokeOpacity=".07" />
              <path d="M130 315 C259 286 344 321 457 301 S674 301 811 338" fill="none" stroke="url(#coast-glow)" strokeDasharray="4 9" />
              <circle cx="486" cy="301" r="13" fill="none" stroke="#55e6bd" strokeOpacity=".25" />
              <circle cx="486" cy="301" r="4" fill="#55e6bd" fillOpacity=".8" />
            </svg>
            <div className="absolute left-5 top-16 rounded-md border border-white/10 bg-[#07111d]/55 px-2.5 py-2 font-mono text-[8px] leading-4 text-slate-400 backdrop-blur">
              <span className="text-mint/80">SECTOR 01 · AKTAU</span><br />CASPIAN SEA / 43°38′N
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="rounded-full border border-white/10 bg-ink/65 p-3 text-white/70 backdrop-blur"><Camera size={22} /></div>
              <span className="font-mono text-[10px] uppercase tracking-[.22em] text-slate-300">Демонстрация акватории</span>
              <span className="text-center text-[11px] text-slate-400">Чтобы запустить реальный анализ, подключите USB-камеру</span>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-white/55"><Crosshair size={28} strokeWidth={1} /></div>
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md bg-black/45 px-2.5 py-1.5 font-mono text-[10px] text-white/80 backdrop-blur">
            <LocateFixed size={12} className="text-mint" /> ПОЗИЦИЯ ДРОНА · 43°38′N 51°09′E
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-md bg-black/45 px-2.5 py-1.5 font-mono text-[10px] text-white/80 backdrop-blur">
            <Radio size={12} className="text-mint" /> 5G · 42 ms
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-2 font-mono text-[10px] text-white/70">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> REC
            <span className="ml-2 text-white/50">GIMBAL −12°</span>
          </div>
          {aiEnabled && cameraActive && firstPerson && leadTarget && (
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              <line x1={`${firstPerson.centerX}%`} y1={`${firstPerson.centerY}%`} x2={`${leadTarget.x}%`} y2={`${leadTarget.y}%`} stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="5 5" />
            </svg>
          )}
          {aiEnabled && cameraActive && analysis.people.map((person: PersonDetection) => (
            <div
              key={person.id}
              className="ai-box absolute"
              style={{ left: `${person.left}%`, top: `${person.top}%`, width: `${person.width}%`, height: `${person.height}%` }}
            >
              <span className="ai-corner tl" /><span className="ai-corner tr" />
              <span className="ai-corner bl" /><span className="ai-corner br" />
              <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-mint px-2 py-1 font-mono text-[9px] font-bold text-ink shadow-lg">
                ЧЕЛОВЕК · {Math.round(person.confidence * 100)}%
              </span>
              <span className="absolute -bottom-6 left-0 whitespace-nowrap rounded bg-black/75 px-1.5 py-1 font-mono text-[8px] text-mint">
                X:{person.centerX}% · Y:{person.centerY}% КАДРА
              </span>
            </div>
          ))}
          {cameraActive && aiEnabled && leadTarget && (
            <div className="lead-marker absolute" style={{ left: `${leadTarget.x}%`, top: `${leadTarget.y}%` }}>
              <span className="lead-marker-pin"><Waves size={12} /></span>
              <span className="absolute left-4 top-0 whitespace-nowrap rounded bg-blue-950/85 px-1.5 py-1 font-mono text-[8px] text-sky-200">LEAD · СНОС</span>
            </div>
          )}
        </div>

      </div>

      <div className={`border-b border-line px-4 py-3 sm:px-5 ${analysis.status === "error" ? "bg-red-400/[.045]" : "bg-mint/[.025]"}`} aria-live="polite">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${analysis.status === "error" ? "border-red-300/20 bg-red-400/10 text-red-200" : "border-mint/15 bg-mint/[.06] text-mint"}`}>
            {analysis.status === "error" ? <AlertTriangle size={15} /> : analysis.status === "ready" ? <Check size={15} /> : <ScanLine size={15} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-white">
                {analysis.status === "off" ? "AI-анализ выключен" :
                  analysis.status === "camera" ? "Подключите камеру для поиска человека" :
                    analysis.status === "loading" ? "Загрузка модели распознавания…" :
                      analysis.status === "error" ? "AI-анализ недоступен" :
                        analysis.people.length ? `Обнаружено людей: ${analysis.people.length}` : "Анализ кадра активен · людей не обнаружено"}
              </p>
              <span className={`font-mono text-[8px] ${analysis.status === "ready" ? "text-mint" : analysis.status === "error" ? "text-red-300" : "text-slate-500"}`}>
                {analysis.status === "ready" ? "COCO-SSD · В РЕАЛЬНОМ ВРЕМЕНИ" : analysis.status === "loading" ? "ПЕРВЫЙ ЗАПУСК" : analysis.status === "error" ? "ОШИБКА" : analysis.status === "off" ? "OFF" : "ОЖИДАНИЕ КАМЕРЫ"}
              </span>
            </div>
            {analysis.status === "ready" && analysis.people.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.people.map((person) => (
                  <span key={person.id} className="rounded-md border border-mint/15 bg-black/20 px-2 py-1 font-mono text-[9px] text-mint">
                    Цель #{person.id + 1} · X {person.centerX}% / Y {person.centerY}% · уверенность {Math.round(person.confidence * 100)}%
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[10px] leading-4 text-slate-400">
                {analysis.status === "error" ? analysis.message :
                  analysis.status === "loading" ? "Модель загружается в браузер при первом запуске; нужен интернет." :
                    analysis.status === "camera" ? "Рамка появится вокруг человека в живом видеопотоке. X/Y — положение относительно кадра, не GPS." :
                      analysis.status === "off" ? "Включите AI, чтобы анализировать видеопоток камеры." :
                      "Распознаётся только класс «человек». Кадры анализируются локально в браузере, не загружаются на сервер; модель не определяет утопление."}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
        <label className="sr-only" htmlFor="camera-select">Выбрать USB-камеру</label>
        <select
          id="camera-select"
          value={selectedDevice}
          onChange={(event) => selectCamera(event.target.value)}
          onFocus={() => void refreshDevices()}
          className="select-field min-w-0 flex-1"
        >
          <option value="">Автоматический выбор камеры</option>
          {devices.map((device, index) => (
            <option key={device.deviceId || index} value={device.deviceId}>{device.label}</option>
          ))}
        </select>
        <button type="button" className={`button-secondary shrink-0 ${cameraActive ? "border-red-400/30 text-red-200" : ""}`} onClick={() => void toggleCamera()}>
          {cameraActive ? <VideoOff size={15} /> : <Camera size={15} />}
          {cameraActive ? "Отключить" : "Подключить USB"}
        </button>
      </div>
      {cameraMode !== "rgb" && (
        <p className="px-4 pb-3 text-[9px] leading-4 text-amber-100/70 sm:px-5">
          {cameraMode === "thermal"
            ? "Thermal Heatmap — только цветовой CSS-фильтр RGB-камеры; это не тепловизионное изображение."
            : "Night Vision IR — только зелёный CSS-фильтр RGB-камеры; ИК-сенсор не подключён."}
        </p>
      )}
      {cameraError && <p role="alert" className="px-5 pb-4 text-xs text-red-300">{cameraError}</p>}
      <div className="mx-4 mb-3 rounded-lg border border-sky-300/10 bg-sky-300/[.035] p-3 sm:mx-5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[10px] font-semibold text-sky-100"><Waves size={13} className="text-sky-300" /> Оценка сноса · NW → SE</span>
          <span className="font-mono text-[8px] text-sky-200/75">УЧЕБНЫЙ РАСЧЁТ</span>
        </div>
        <p className="mt-1.5 text-[9px] leading-4 text-slate-400">Упреждение на кадре: {analysis.people.length && leadTarget ? `цель #1 → X ${leadTarget.x}% / Y ${leadTarget.y}%` : "ожидание обнаруженной цели"}. Ветер 24 км/ч · течение 0,6 м/с — модельные значения.</p>
        <p className="mt-1 text-[9px] leading-4 text-slate-500">Маркер — визуальная демонстрация, не баллистический прогноз. Нужны датчики ветра/течения и калибровка сброса.</p>
      </div>
      <div className="border-t border-line px-4 py-2.5 font-mono text-[9px] text-slate-500 sm:px-5">
        {aiEnabled ? "COCO-SSD · анализ в браузере · координаты цели относительно кадра" : "AI выключен · поток камеры не анализируется"}
      </div>
    </section>
  );
}
