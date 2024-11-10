export function getElementByID(id: string) {
  const element = document.getElementById(id);

  if (!element) throw new Error(`Element with id="${id}" was not found!`);

  return element;
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedSeconds =
    remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

  return `${minutes}:${formattedSeconds}`;
}

export function getSourceDuration(source: AudioBufferSourceNode) {
  return source.buffer?.duration || 0;
}

export function doesBuffertSourceNodeExist(
  source: AudioBufferSourceNode | null
): source is AudioBufferSourceNode {
  if (!source) throw new Error("Buffer source not found!");

  return Boolean(source);
}

export function resetSourceNode(source: AudioBufferSourceNode | null) {
  if (!source) return source;

  source.stop();
  source.disconnect();
  source = null;

  return source;
}
