export function getElementByID(id: string) {
  const element = document.getElementById(id);

  if (!element) throw new Error(`Element with ${id} was not found!`);

  return element;
}
