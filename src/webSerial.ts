interface SerialWriter {
  write(data: Uint8Array): Promise<void>;
  releaseLock(): void;
}

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable: { getWriter(): SerialWriter } | null;
}

interface SerialApi {
  requestPort(): Promise<SerialPort>;
}

type SerialNavigator = Navigator & { serial?: SerialApi };

export function isWebSerialSupported(): boolean {
  return "serial" in navigator;
}

export async function connectSerialController(): Promise<SerialPort> {
  const serial = (navigator as SerialNavigator).serial;
  if (!serial) {
    throw new Error("Web Serial недоступен. Используйте Chrome или Edge на HTTPS/localhost.");
  }

  const port = await serial.requestPort();
  await port.open({ baudRate: 115200 });
  return port;
}

export async function sendPayloadRelease(port: SerialPort): Promise<void> {
  const writer = port.writable?.getWriter();
  if (!writer) {
    throw new Error("Контроллер не предоставляет канал передачи данных.");
  }

  try {
    await writer.write(new TextEncoder().encode("CRS10:PAYLOAD_RELEASE\n"));
  } finally {
    writer.releaseLock();
  }
}

export async function disconnectSerialController(port: SerialPort): Promise<void> {
  await port.close();
}

export type { SerialPort };
