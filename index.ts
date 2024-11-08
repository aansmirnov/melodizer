import { getElementByID } from "./lib";

const uploaderElement = getElementByID("uploader");

const audioContext = new AudioContext();
let source = audioContext.createBufferSource();

let analyser = audioContext.createAnalyser();
analyser.fftSize = 256;

let dataArray: Uint8Array;

async function loadFile(event: Event) {
  const [file] = (event.target as HTMLInputElement).files || [];

  if (!file) throw new Error("File not found!");

  await playSong(file);
}

async function playSong(file: File) {
  const buffer = await file.arrayBuffer();
  const audioData = await audioContext.decodeAudioData(buffer);

  source.buffer = audioData;

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  analyser.connect(audioContext.destination);
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

uploaderElement.addEventListener("change", loadFile);
