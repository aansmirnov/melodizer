import { getElementByID } from "./lib";

const uploaderElement = getElementByID("uploader") as HTMLInputElement;
const uploadContainerElement = getElementByID("upload-container");
const playButtonElement = getElementByID("play-button");

let source: AudioBufferSourceNode | null;
let analyser: AnalyserNode | null;

let dataArray: Uint8Array | null;
let isAudioContextSuspended = false;

async function prepareFile(file: File) {
  if (source) {
    source.stop();
  }

  const audioContext = new AudioContext();

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

  if (audioContext.state === "suspended") {
    isAudioContextSuspended = true;
    playButtonElement.style.display = "block";

    return;
  }

  playSong();
}

function playSong() {
  if (!source) throw new Error("Buffer source not found!");

  source.start();
  draw();
}

function draw() {
  // @ToDO
}

// setInterval(() => {
//   console.log(analyser.getByteFrequencyData(dataArray));
//   console.log(dataArray);
//   console.log(source.context.currentTime, source.buffer?.duration);
// }, 500);

uploaderElement.addEventListener("change", async (event) => {
  const [file] = (event.target as HTMLInputElement).files || [];

  if (file) {
    prepareFile(file);
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

    await prepareFile(files[0]);
  }
});

playButtonElement.addEventListener("click", () => {
  playSong();

  playButtonElement.style.display = "none";
  isAudioContextSuspended = false;
});
