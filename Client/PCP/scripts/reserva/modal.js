import { reserveChapas } from "../utils/connection.js";

export function handleShowSelectedButtonClick(getSelectedChapas) {
  const showSelectedButton = document.getElementById("showSelectedButton");
  const modalContent = document.getElementById("modalContent");
  const closeModal = document.getElementById("closeModal");
  const popupContainer = document.getElementById("popupContainer");

  removeExistingListener(showSelectedButton);
  showSelectedButton.onclick = () => {
    const selectedChapas = getSelectedChapas();
    if (selectedChapas.length > 0) {
      const modalHandler = createModalHandler(modalContent, closeModal, () => selectedChapas, popupContainer);
      modalHandler();
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Precisa selecionar pelomenos 1 chapa!",
      });
    }
  };
  closeModal.onclick = () => {
    popupContainer.style.display = "none";
  };

  window.addEventListener("click", (event) => {
    if (event.target == popupContainer) {
      popupContainer.style.display = "none";
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      popupContainer.style.display = "none";
    }
  });
}

function removeExistingListener(element) {
  if (element.onclick) {
    element.removeEventListener("click", element.onclick);
  }
}

function createModalHandler(modalContent, closeModal, getSelectedSubcards, popupContainer) {
  return () => {
    const newContent = document.createElement("div");

    const contentWrapper = document.createElement("div");
    contentWrapper.style.maxHeight = "70vh";
    contentWrapper.style.overflowY = "auto";

    const keys = ["id_chapa", "largura", "fornecedor", "qualidade", "quantidade_disponivel"];

    const selectedSubcards = getSelectedSubcards();
    selectedSubcards.forEach((chapa) => {
      contentWrapper.appendChild(createCard(chapa, keys));
    });

    contentWrapper.appendChild(createButtonFormContainer(selectedSubcards));

    newContent.appendChild(contentWrapper);

    Array.from(modalContent.childNodes).forEach((child) => {
      if (child !== closeModal) {
        modalContent.removeChild(child);
      }
    });

    modalContent.appendChild(newContent);

    popupContainer.style.display = "block";
  };
}

function createCard(chapa, keys) {
  const card = document.createElement("div");
  card.className = "card mb-3 shadow-sm";
  const cardBody = document.createElement("div");
  cardBody.className = "body-div card-body rounded d-flex align-items-center";

  const valueRow = document.createElement("div");
  valueRow.className = "value-row row flex-nowrap overflow-auto w-100 align-items-stretch";
  keys.forEach((key) => {
    const valueDiv = document.createElement("div");
    valueDiv.className = "card-value-div col text-center value align-items-center justify-content-center rounded";
    if (key === "largura") {
      let largura = chapa.largura;
      let comprimento = chapa.comprimento;
      valueDiv.textContent = `${largura} x ${comprimento}`;
    } else {
      valueDiv.textContent = chapa[key];
    }
    valueRow.appendChild(valueDiv);
  });
  cardBody.appendChild(valueRow);
  cardBody.appendChild(createFormRow(chapa));

  card.appendChild(cardBody);
  return card;
}

function createFormRow(chapa) {
  const formRow = document.createElement("div");
  formRow.className = "form-row row flex-nowrap overflow-auto w-100 align-items-stretch";

  const quantityInput = createInputCell("number", "Quantidade", `quantityInput-${chapa.id_chapa}`, "formQuantidade");

  const medidaInput = createInputCell("text", "medida", `medidaInput-${chapa.id_chapa}`);
  medidaInput.style.display = "none";

  /* const recycleTd = document.createElement("div");
  recycleTd.className = "form-cell col-1 text-center value align-items-center justify-content-center rounded";
  recycleTd.style.display = "flex";
  recycleTd.style.justifyContent = "center";
  recycleTd.style.alignItems = "center";

  const recycleCheckbox = document.createElement("input");
  recycleCheckbox.type = "checkbox";
  recycleCheckbox.id = `recycleCheckbox-${chapa.id_chapa}`;
  recycleCheckbox.style.width = "25px";
  recycleCheckbox.style.height = "25px";
  recycleCheckbox.onchange = () => {
    medidaInput.style.display = recycleCheckbox.checked ? "" : "none";
  };
  recycleTd.appendChild(recycleCheckbox); */

  formRow.appendChild(quantityInput);
  formRow.appendChild(medidaInput);
  /* formRow.appendChild(recycleTd); */

  return formRow;
}

function createInputCell(type, placeholder, id, additionalClass) {
  const cell = document.createElement("div");
  cell.className = "form-cell col text-center value align-items-center justify-content-center rounded";
  
  const input = document.createElement("input");
  input.type = type;
  input.placeholder = placeholder;
  input.id = id;
  input.min = 0;
  input.style.width = "50%";
  input.oninput = function () {
    if (this.value < 0) {
      this.value = 0;
    }
  };

  // Adiciona a classe adicional, se fornecida
  if (additionalClass) {
    input.classList.add(additionalClass);
  }

  cell.appendChild(input);
  return cell;
}


function createButtonFormContainer(selectedSubcards) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.justifyContent = "space-between";

  container.appendChild(createPartNumberForm());
  container.appendChild(createReserveButton(selectedSubcards));

  return container;
}

function createPartNumberForm() {
  const form = document.createElement("form");
  const input = document.createElement("input");
  input.type = "text";
  input.id = "partNumberInput";
  input.placeholder = "PART NUMBER";
  form.appendChild(input);

  $(input).mask("9999.9999");

  return form;
}

function createReserveButton(selectedSubcards) {
  const reserveButton = document.createElement("button");
  reserveButton.textContent = "RESERVAR";
  reserveButton.classList.add("agrupar-button");
  reserveButton.onclick = async () => {
    const partNumber = document.getElementById("partNumberInput").value;

    const chapas = selectedSubcards.map((subcard) => ({
      chapaID: subcard.id_chapa,
      quantity: document.getElementById(`quantityInput-${subcard.id_chapa}`).value,
      medida: document.getElementById(`medidaInput-${subcard.id_chapa}`).value,
      keepRemaining: document.getElementById(`recycleCheckbox-${subcard.id_chapa}`).checked,
    }));

    const loadingSpinner = document.getElementById("loadingSpinner");
    loadingSpinner.style.display = "block";

    try {
      const reservedBy = localStorage.getItem("nome");
      console.log("reservedBy:", reservedBy);
      const response = await reserveChapas({ partNumber, chapas, reservedBy });
      console.log("this is the response:", response);
      localStorage.setItem("showSwal", "true");
      localStorage.setItem("partNumber", partNumber);
      location.reload();
    } catch (error) {
      console.error("This is the error response:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message,
      });
    } finally {
      loadingSpinner.style.display = "none";
    }
  };
  return reserveButton;
}

document.addEventListener("DOMContentLoaded", () => {
  const showSwal = localStorage.getItem("showSwal");
  const partNumber = localStorage.getItem("partNumber");
  if (showSwal === "true") {
    Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    }).fire({
      icon: "success",
      title: `Item ${partNumber} reservado.`,
    });
    localStorage.removeItem("showSwal");
    localStorage.removeItem("partNumber");
  }
});
