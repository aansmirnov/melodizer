import { getElementByID } from "./lib";

const musicUploaderElement = getElementByID("music-uploader");
const musicAudioElement = getElementByID("music-audio") as HTMLAudioElement;

function loadFile(event: Event) {
  const [file] = (event.target as HTMLInputElement).files || [];

  if (!file) throw new Error("File not found!");

  addFileToSource(file);
}

function addFileToSource(file: File) {
  musicAudioElement.src = URL.createObjectURL(file);
}

function playMusic() {
  musicAudioElement.play();
}

musicUploaderElement.addEventListener("change", loadFile);
musicAudioElement.addEventListener("canplaythrough", playMusic);
