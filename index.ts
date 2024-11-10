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

let audioContext: AudioContext | null;
let source: AudioBufferSourceNode | null;
let analyser: AnalyserNode | null;
let dataArray: Uint8Array | null;
let isPlaying = false;
let interval: number | undefined;
let songFile: File | undefined;
let pauseTime = 0;

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

  controlButtonContentElement.innerHTML = isSuspend ? "&#x23F5;" : "&#x23F8;";
}

function playSong(offset?: number) {
  if (!doesBuffertSourceNodeExist(source)) return;

  source.start(0, offset);

  isPlaying = true;

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
  if (!doesBuffertSourceNodeExist(source)) return;

  const duration = getSourceDuration(source);
  const currentTime = source.context.currentTime;

  const lineProgressElement = getElementByID("line-progress");

  leftTimeElement.innerHTML = String(formatTime(currentTime));
  lineProgressElement.style.width = `${(currentTime / duration) * 100}%`;
}

function drawAudioVisualizer() {
  // @ToDO
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

  controlButtonContentElement.innerHTML = isPlaying ? "&#x23F5;" : "&#x23F8;";

  if (isPlaying) {
    clearInterval(interval);

    pauseTime = audioContext.currentTime;

    await audioContext.suspend();
    source = resetSourceNode(source);

    isPlaying = false;
  } else {
    await audioContext.resume();
    await prepareFile(songFile, true);

    playSong(pauseTime);
  }
});

// setInterval(() => {
//   console.log(analyser.getByteFrequencyData(dataArray));
//   console.log(dataArray);
// }, 500);
