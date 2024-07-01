import { fetchMaquinaData } from "./connections.js";
import { createCard } from "./cardCreator.js";

export async function render(name, userName) {
  const data = await fetchMaquinaData(name);
  if (data && data.items) {
    const doneColumn = document.getElementById("done-items");
    const toDoColumn = document.getElementById("to-do-items");
    const inProgressColumn = document.getElementById("in-progress-items");

    data.items.forEach((item) => {
      const card = createCard(item, name, item.estado, userName);
      if (item.estado === "FEITO") {
        doneColumn.appendChild(card);
      } else if (item.estado === "PROXIMAS") {
        inProgressColumn.appendChild(card);
      } else {
        toDoColumn.appendChild(card);
      }
    });
  }
}
