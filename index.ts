import { getElementByID } from "./lib";

const uploaderElement = getElementByID("uploader");
const audioElement = getElementByID("audio") as HTMLAudioElement;

function loadFile(event: Event) {
  const [file] = (event.target as HTMLInputElement).files || [];

  if (!file) throw new Error("File not found!");

  addFileToSource(file);
}

function addFileToSource(file: File) {
  audioElement.src = URL.createObjectURL(file);
}

function playMusic() {
  audioElement.play();
}

uploaderElement.addEventListener("change", loadFile);
audioElement.addEventListener("canplaythrough", playMusic);
