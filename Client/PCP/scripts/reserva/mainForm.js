import { Card } from "./card.js";
import { handleShowSelectedButtonClick as reservarModal } from "./modal.js";
import { fetchChapas } from "../utils/connection.js";

export class Reservar {
  constructor() {
    this.sortKeyElement = document.getElementById("sortKey");
    this.sortOrderElement = document.getElementById("sortOrder");
    this.filterElements = {
      comprimento: document.getElementById("filterLength"),
      largura: document.getElementById("filterWidth"),
      vincos: document.getElementById("filterVincos"),
      qualidade: document.getElementById("filterQualidade"),
      onda: document.getElementById("filterOnda"),
    };
    this.containerElement = document.getElementById("container");
    this.clearButtonElement = document.getElementById("clearButton");
    this.updateFormElement = document.getElementById("groupingForm");
    this.checkboxButtons = document.querySelectorAll(".checkbox-button");
    this.selectedChapas = new Map();
  }

  initialize() {
    this.updateFormElement.addEventListener("submit", (event) => this.onFormSubmit(event));
    this.checkboxButtons.forEach((button) => button.addEventListener("click", (event) => this.onCheckboxButtonClick(event)));
    this.sortOrderElement.addEventListener("click", (event) => this.onSortOrderClick(event));
    this.clearButtonElement.addEventListener("click", () => this.onClearButtonClick());

    this.populateCards();
  }

  onFormSubmit(event) {
    event.preventDefault();
    this.populateCards();
  }

  onCheckboxButtonClick(event) {
    const isChecked = event.target.getAttribute("data-checked") === "true";
    event.target.setAttribute("data-checked", !isChecked);
  }

  onSortOrderClick(event) {
    const isAscending = event.target.getAttribute("data-sort") === "asc";
    event.target.setAttribute("data-sort", isAscending ? "descending" : "asc");
    event.target.innerHTML = isAscending ? " &#8595" : " &#8593";
    this.populateCards();
  }

  onClearButtonClick() {
    this.selectedChapas.clear();
    document.querySelectorAll(".card-checkbox").forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  async populateCards() {
    const sortKey = this.sortKeyElement.value;
    const sortOrder = this.sortOrderElement.getAttribute("data-sort");

    let filterCriteria = {};
    for (let key in this.filterElements) {
      const value = this.filterElements[key].value;
      if (value) {
        filterCriteria[key] = value;
      }
    }

    try {
      let items = await fetchChapas(sortKey, sortOrder, filterCriteria);

      const onSubcardSelectionChange = (chapa, isSelected) => {
        if (isSelected) {
          this.selectedChapas.set(chapa.id_chapa, chapa);
        } else {
          this.selectedChapas.delete(chapa.id_chapa);
        }
      };

      this.containerElement.innerHTML = "";
      items.forEach((chapa, index) => {
        const keys = ["medida", "vincos", "qualidade", "onda", "quantidade_comprada", "quantidade_estoque", "data_prevista", "status"];
        const card = new Card(chapa, keys, index, sortKey, onSubcardSelectionChange, this.selectedChapas.has(chapa.id_chapa));
        this.containerElement.appendChild(card.createCard());
      });

      reservarModal(() => Array.from(this.selectedChapas.values()));
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }
}