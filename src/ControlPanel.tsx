import { useState } from "react";
import { ArrowDownToLine, Check, LockKeyhole, ShieldAlert } from "lucide-react";
import { isWebSerialSupported } from "./webSerial";

interface ControlPanelProps {
  tilt: number;
  onTiltChange: (tilt: number) => void;
  serialConnected: boolean;
  serialMessage: string;
  dropping: boolean;
  onDrop: () => void;
  onConnectSerial: () => void;
  onDisconnectSerial: () => void;
  onDispatch112: (message: string) => void;
}

export default function ControlPanel({
  tilt,
  onTiltChange,
  serialConnected,
  serialMessage,
  dropping,
  onDrop,
  onConnectSerial,
  onDisconnectSerial,
  onDispatch112,
}: ControlPanelProps) {
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [dispatchState, setDispatchState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [dispatchMessage, setDispatchMessage] = useState("");

  async function simulate112Dispatch() {
    if (!globalThis.crypto?.subtle) {
      setDispatchState("error");
      setDispatchMessage("Защищённое шифрование недоступно в этом контексте. Используйте localhost или HTTPS.");
      return;
    }

    setDispatchState("working");
    setDispatchMessage("");
    try {
      const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const payload = new TextEncoder().encode(JSON.stringify({
        event: "CRS10_DEMO_EMERGENCY",
        coordinates: "43.6500, 51.1600",
        createdAt: new Date().toISOString(),
      }));
      const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
      const packetId = Array.from(new Uint8Array(ciphertext).slice(0, 6), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const message = `Демо-пакет AES-GCM сформирован локально · ID ${packetId}. В 112/ДЧС не отправлен.`;
      setDispatchState("done");
      setDispatchMessage(message);
      onDispatch112(message);
    } catch (error) {
      setDispatchState("error");
      setDispatchMessage(error instanceof Error ? error.message : "Не удалось сформировать демонстрационный пакет.");
    }
  }

  return (
    <section className="panel p-4 sm:p-5" aria-label="Панель управления дроном">
      <div className="mb-4 flex items-center justify-between">
        <div><p className="eyebrow">MISSION CONTROL</p><h2 className="mt-1 text-sm font-bold text-white">Управление дроном</h2></div>
        <span className="rounded-md bg-mint/10 px-2 py-1 font-mono text-[9px] text-mint">CRS-10-04</span>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-lg border border-line bg-[#091522] px-3 py-3">
        <div><p className="text-[11px] font-medium text-slate-200">Наклон камеры</p><p className="mt-1 font-mono text-[10px] text-slate-500">GIMBAL · {tilt}°</p></div>
        <div className="flex gap-2">
          <button type="button" className="button-secondary !px-3 !py-2" onClick={() => onTiltChange(Math.max(-90, tilt - 5))} aria-label="Наклонить камеру вверх">↑ <span className="hidden sm:inline">Вверх</span></button>
          <button type="button" className="button-secondary !px-3 !py-2" onClick={() => onTiltChange(Math.min(20, tilt + 5))} aria-label="Наклонить камеру вниз">↓ <span className="hidden sm:inline">Вниз</span></button>
        </div>
      </div>

      {!confirmDrop ? (
        <button type="button" onClick={() => setConfirmDrop(true)} disabled={dropping} className={`drop-button w-full ${dropping ? "drop-active" : ""}`}>
          <span className="drop-icon"><ArrowDownToLine size={18} /></span>
          <span className="text-left"><span className="block text-xs font-extrabold tracking-wide">{dropping ? "КОМАНДА ОТПРАВЛЕНА" : "СБРОСИТЬ СПАСАТЕЛЬНЫЙ БАЛЛОН"}</span><span className="mt-1 block text-[9px] font-normal text-white/60">{serialConnected ? "Контроллер подключен · требуется подтверждение" : "ДЕМО-РЕЖИМ · реальный контроллер не подключен"}</span></span>
        </button>
      ) : (
        <div className="rounded-xl border border-red-400/30 bg-red-950/30 p-3">
          <div className="mb-3 flex gap-2"><ShieldAlert size={16} className="shrink-0 text-red-300" /><p className="text-[11px] leading-4 text-red-100">Подтвердите визуально: зона сброса свободна и команда соответствует протоколу учения. {serialConnected ? "Команда будет отправлена на контроллер." : "Будет выполнена только демонстрация."}</p></div>
          <div className="grid grid-cols-2 gap-2"><button type="button" className="button-danger" onClick={() => { setConfirmDrop(false); onDrop(); }}>ПОДТВЕРДИТЬ</button><button type="button" className="button-secondary justify-center" onClick={() => setConfirmDrop(false)}>Отмена</button></div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className={`flex items-center gap-1.5 text-[9px] ${serialConnected ? "text-mint" : "text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${serialConnected ? "bg-mint" : "bg-slate-600"}`} />{serialConnected ? "USB CONTROLLER READY" : "USB CONTROLLER OFFLINE"}</span>
        {isWebSerialSupported() && <button type="button" onClick={serialConnected ? onDisconnectSerial : onConnectSerial} className="text-[9px] text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-white">{serialConnected ? "Отключить" : "Подключить контроллер"}</button>}
        {!isWebSerialSupported() && <span className="text-[9px] text-slate-500">Web Serial: Chrome / Edge</span>}
      </div>
      {serialMessage && <p role="status" className="mt-2 text-[10px] leading-4 text-slate-400">{serialMessage}</p>}

      <div className="mt-4 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => void simulate112Dispatch()}
          disabled={dispatchState === "working"}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[.07] px-3 text-[10px] font-bold text-amber-100 hover:border-amber-200/40 hover:bg-amber-300/[.12]"
        >
          <LockKeyhole size={14} />{dispatchState === "working" ? "ФОРМИРОВАНИЕ AES-GCM…" : "АВТО-ВЫЗОВ ДЧС 112 · ДЕМО"}
        </button>
        {dispatchMessage && <p role="status" className={`mt-2 text-[10px] leading-4 ${dispatchState === "error" ? "text-red-300" : "text-slate-400"}`}>{dispatchState === "done" && <Check size={12} className="mr-1 inline text-mint" />}{dispatchMessage}</p>}
      </div>
      <p className="mt-3 text-[9px] leading-4 text-slate-600">Сброс и вызов ДЧС не предназначены для реального спасения. SOS: звоните 112.</p>
    </section>
  );
}
