import { createElementWithClass } from "../utils/dom.js";
import { deleteChapaFromItem } from "../utils/connection.js";

export class ChapaCard {
  constructor(chapa, itemStatus, itemId) {
    this.chapa = chapa;
    this.itemStatus = itemStatus;
    this.itemId = itemId;
    this.keys = ["status", "largura", "vincos", "qualidade", "onda", "data_prevista"];
  }

  createValueDiv(key, value) {
    let valueDiv = createElementWithClass("div", `card-value-div col-12 col-sm text-center value align-items-center justify-content-center rounded`);

    if (key.startsWith("data")) {
      let dateParts;
      if (value.includes("/")) {
        // Date is in "dd/mm/yyyy" format
        dateParts = value.split("/");
      } else if (value.includes("-")) {
        // Date is in "yyyy-mm-dd" format
        dateParts = value.split("-");
        dateParts.reverse();
      }
      if (dateParts) {
        let [day, month] = dateParts;
        value = `${day}/${month}`;
      }
    }

    if (key === "status") {
      valueDiv.className += " card-status ";
      let status = value.toLowerCase();
      if (status === "recebido") {
        valueDiv.className += "card-status-recebido";
      } else if (status === "comprado") {
        valueDiv.className += "card-status-comprado";
      } else if (status === "parcial" || status === "parcialmente") {
        valueDiv.className += "card-status-parcial";
      } else if (status === "usado") {
        valueDiv.className += "card-status-usado";
      }

      valueDiv.textContent = value.toUpperCase();
    } else if (key === "largura") {
      let largura = this.chapa.largura;
      let comprimento = this.chapa.comprimento;
      value = `${largura} x ${comprimento}`;
      valueDiv.textContent = value;
    } else {
      valueDiv.textContent = value;
    }

    return valueDiv;
  }

  createValueRow() {
    let valueRow = createElementWithClass("div", "value-row row flex-nowrap flex-sm-wrap overflow-auto w-100 align-items-stretch");
    this.keys.forEach((key) => {
      if (this.chapa[key] !== null && this.chapa[key] !== undefined) {
        valueRow.appendChild(this.createValueDiv(key, this.chapa[key]));
      }
    });

    if (this.itemStatus.toLowerCase() == "reservado") {
      const deleteButton = this.createDeleteButton();
      valueRow.appendChild(deleteButton);
    }

    return valueRow;
  }

  createDeleteButton() {
    const deleteButton = createElementWithClass("button", "btn btn-danger ml-auto card-chapa-delete-button");
    deleteButton.textContent = "Deletar";
    deleteButton.addEventListener("click", () => {
      deleteChapaFromItem(this.itemId, this.chapa.id_chapa);
    });
    return deleteButton;
  }

  render() {
    const chapaCard = createElementWithClass("div", "card mt-3 chapa-card");
    const cardBody = createElementWithClass("div", "card-body d-flex align-items-start");
    chapaCard.appendChild(cardBody);

    const valueRow = this.createValueRow();
    cardBody.appendChild(valueRow);

    return chapaCard;
  }
}
