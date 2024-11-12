import { PAUSE_SIGN, PLAY_SIGN } from "./const";
import {
  formatTime,
  getElementByID,
  getSourceDuration,
  doesBuffertSourceNodeExist,
  resetSourceNode,
} from "./lib";

const uploaderElement = getElementByID("uploader") as HTMLInputElement;
const uploadContainerElement = getElementByID("upload-container");
const controlButtonElement = getElementByID("control-button");
const controlButtonContentElement = getElementByID("control-button-content");
const leftTimeElement = getElementByID("time-left");

const melodizerElement = getElementByID("melodizer") as HTMLCanvasElement;
const canvasContext = melodizerElement.getContext("2d");

melodizerElement.width = window.innerWidth;

const { width, height } = melodizerElement;
const barWidth = Math.round(width / 100);

let audioContext: AudioContext | null;
let source: AudioBufferSourceNode | null;
let analyser: AnalyserNode | null;
let dataArray: Uint8Array | null;
let isPlaying = false;
let interval: number | undefined;
let songFile: File | undefined;
let pauseTime = 0;
let animationFrame: number | null;
let isEnded = false;

async function prepareFile(file: File, resume = false) {
  if (source) {
    source = resetSourceNode(source);
  }

  audioContext = resume ? (audioContext as AudioContext) : new AudioContext();

  const buffer = await file.arrayBuffer();
  const audioData = await audioContext.decodeAudioData(buffer);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  source = audioContext.createBufferSource();
  source.buffer = audioData;

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  analyser.connect(audioContext.destination);

  const isSuspend = audioContext.state === "suspended";

  if (isSuspend) {
    drawControls();
    drawDuration();
    leftTimeElement.innerHTML = "00:00";
  }

  controlButtonContentElement.innerHTML = isSuspend ? PLAY_SIGN : PAUSE_SIGN;
}

function playSong(offset?: number) {
  if (!doesBuffertSourceNodeExist(source)) return;

  source.start(0, offset);

  isPlaying = true;

  if (animationFrame) window.cancelAnimationFrame(animationFrame);

  drawControls();
  drawDuration();
  drawAudioVisualizer();

  clearInterval(interval);
  interval = setInterval(drawProgress);
}

function drawControls() {
  const controlsElement = getElementByID("controls");
  controlsElement.style.display = "flex";
}

function drawDuration() {
  if (!doesBuffertSourceNodeExist(source)) return;

  const rightTimeElement = getElementByID("time-right");
  const duration = getSourceDuration(source);
  rightTimeElement.innerHTML = String(formatTime(duration));
}

function drawProgress() {
  if (isEnded || !doesBuffertSourceNodeExist(source)) return;

  const duration = getSourceDuration(source);
  const currentTime = source.context.currentTime;

  if (Math.floor(duration) === Math.floor(currentTime)) stopSong();

  const lineProgressElement = getElementByID("line-progress");

  leftTimeElement.innerHTML = String(formatTime(currentTime));
  lineProgressElement.style.width = `${(currentTime / duration) * 100}%`;
}

function stopSong() {
  isEnded = true;
  isPlaying = false;

  controlButtonContentElement.innerHTML = PLAY_SIGN;
}

function drawAudioVisualizer() {
  if (!canvasContext) throw new Error("2D context is not supported!");
  if (!analyser) throw new Error("Analyser not found!");
  if (!dataArray) throw new Error("DataArray is empty!");

  let barHeight;
  let x = 0;

  animationFrame = requestAnimationFrame(drawAudioVisualizer);

  analyser.getByteFrequencyData(dataArray);
  canvasContext.clearRect(0, 0, width, height);

  for (let i = 0; i < dataArray.length; i++) {
    barHeight = dataArray[i];

    const hue = (i / dataArray.length) * 360;

    canvasContext.fillStyle = `hsl(${hue}, 100%, 50%)`;
    canvasContext.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);

    x += barWidth;
  }
}

uploaderElement.addEventListener("change", async (event) => {
  const [file] = (event.target as HTMLInputElement).files || [];

  if (file) {
    songFile = file;

    clearInterval(interval);

    await prepareFile(file);
    playSong();
  }
});

uploadContainerElement.addEventListener("dragover", async (event) => {
  event.preventDefault();
});

uploadContainerElement.addEventListener("drop", async (event) => {
  event.preventDefault();

  if (event.dataTransfer?.files) {
    const files = event.dataTransfer.files;
    uploaderElement.files = files;

    const file = files[0];
    songFile = file;

    clearInterval(interval);

    await prepareFile(file);

    if (audioContext?.state === "suspended") {
      source?.start();
      return;
    }

    playSong();
  }
});

controlButtonElement.addEventListener("click", async () => {
  if (!songFile) throw new Error("File not found!");
  if (!audioContext) throw new Error("AudioContext does not exist!");

  controlButtonContentElement.innerHTML = isPlaying ? PLAY_SIGN : PAUSE_SIGN;

  if (isPlaying || isEnded) clearInterval(interval);

  if (isPlaying) {
    pauseTime = audioContext.currentTime;

    await audioContext.suspend();
    source = resetSourceNode(source);

    isPlaying = false;
  } else {
    await audioContext.resume();
    await prepareFile(songFile, !isEnded);

    isEnded = isEnded ? false : isEnded;
    const offset = isEnded ? undefined : pauseTime;

    playSong(offset);
  }
});
