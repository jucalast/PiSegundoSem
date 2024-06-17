import BASE_URL from "../utils/config.js";

if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "../login/login.html";
}

function logout() {
  localStorage.clear();
  window.location.href = "../login/login.html";
}
document.getElementById("logout-button").addEventListener("click", logout);

$("#user-name").text(localStorage.getItem("nome") || "UserName");
var name = localStorage.getItem("nome");
var profilePic = $("#profilePic");
profilePic.attr("src", "https://api.dicebear.com/8.x/shapes/svg?seed=" + name);

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js";

document.getElementById("fileInput").addEventListener("change", function (event) {
  var file = event.target.files[0]; // Obtenha o arquivo que foi selecionado

  if (!file) {
    alert("Por favor, selecione um arquivo válido.");
    return;
  }

  // Processando o arquivo conforme seu tipo
  switch (file.type) {
    case "application/pdf":
      processPDF(file);
      break;
    case "text/xml":
      processXML(file);
      break;
    default:
      alert("Formato de arquivo não suportado!");
      break;
  }

  // Resetar o input file após o processamento para permitir a mesma seleção novamente
  event.target.value = "";
});

const dropZone = document.getElementById("drop-zone");

dropZone.addEventListener("dragover", function (event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
});

dropZone.addEventListener("drop", function (event) {
  event.stopPropagation();
  event.preventDefault();
  const file = event.dataTransfer.files[0]; // Obtenha o primeiro arquivo que foi solto

  if (!file) {
    alert("Por favor, solte um arquivo válido.");
    return;
  }

  switch (file.type) {
    case "application/pdf":
      processPDF(file);
      break;
    case "text/xml":
      processXML(file);
      break;
    default:
      alert("Formato de arquivo não suportado!");
      break;
  }
});

function processPDF(file) {
  var reader = new FileReader();
  reader.onload = function (event) {
    var typedarray = new Uint8Array(event.target.result);
    extractText(typedarray);
  };
  reader.readAsArrayBuffer(file);
}

function processXML(file) {
  var reader = new FileReader();
  reader.onload = function (event) {
    var xml = event.target.result;
    parseXML(xml);
  };
  reader.readAsText(file);
}

function buscarChapa() {
  const idCompra = document.getElementById("id_compra").value;
  fetchChapas(idCompra);
}

document.getElementById("buscarChapa").addEventListener("click", buscarChapa);

function fetchChapas(xPed) {
  clearTable(); // Limpa as tabelas antes de buscar e adicionar novos dados
  axios
    .get(`${BASE_URL}/recebimento/${xPed}`) // Altera o ID para puxar as chapas
    .then((response) => {
      const data = response.data;
      if (data && data.length > 0) {
        document.getElementById("drop-zone").style.display = "none";
        document.getElementById("tables").style.display = "block";
        data.forEach((chapa) => {
          const tableb = document.getElementById("bancoDados");
          chapa.valor_unitario = chapa.valor_unitario.replace(",", ".");
          chapa.valor_total = chapa.valor_total.replace(".", "").replace(",", ".");
          chapa.quantidade_recebida = chapa.quantidade_comprada;
          criarTable(tableb, chapa);
        });
      }
    })
    .catch((error) => {
      alert(`chapa ${xPed} não encontrada`);
      document.getElementById("drop-zone").style.display = "flex";
      document.getElementById("tables").style.display = "none";
      console.error("Erro ao buscar dados: ", error);
    });
}
//criar tabelasconst tableb = document.getElementById('bancoDados').getElementsByTagName('tbody')[0];

function clearTable() {
  clearRows(document.getElementById("tableBody")); // Limpa o tbody de bancoDados
  clearRows(document.getElementById("tableBody2")); // Limpa o tbody de recebimento
}

function clearRows(tbody) {
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild); // Remove todos os filhos do tbody
  }
}

var rowId = 0; // Variável global para manter o ID da linha
function criarTable(table, chapaData) {
  var tbody = table.querySelector("tbody");
  var row = tbody.insertRow(-1);

  var idCell = row.insertCell(0);
  idCell.innerHTML = `<input type='text' value='${chapaData.id_chapa ? chapaData.id_chapa : ""}' class='editable-id'>`;

  var cellContents = [
    `<input type='text' value='${chapaData.fornecedor}'>`,
    `<input type='text' value='${chapaData.id_compra}'>`,
    `<input type='text' class='quantity' value='${chapaData.quantidade_recebida}'>`,
    `<input type='text' value='${chapaData.qualidade}'>`,
    `<input type='text' value='${chapaData.largura}'>`,
    `<input type='text' value='${chapaData.comprimento}'>`,
    `<select>${["E", "B", "C", "BB", "BC", ""].map((type) => `<option value="${type}" ${type === chapaData.onda ? "selected" : ""}>${type}</option>`).join("")}</select>`,
    `<select><option value="Sim" ${chapaData.vincos.toLowerCase() === "não" ? "" : "selected"}>Sim</option><option value="Não" ${chapaData.vincos.toLowerCase() === "não" ? "selected" : ""}>Não</option></select>`,
    `<select style='width: 120px;'>${["Comprado", "Recebido", "Parcialmente", "Atrasado", "Cancelado"].map((status) => `<option ${status === chapaData.status ? "selected" : ""}>${status}</option>`).join("")}</select>`,
  ];

  cellContents.forEach((content, index) => {
    var cell = row.insertCell(index + 1);
    cell.innerHTML = content;
  });

  // Adicionando as células específicas baseado no ID da tabela
  if (table.id === "bancoDados") {
    let dataPrevistaCell = row.insertCell(-1);
    let formattedDataPrevista = chapaData.data_prevista.split("/").reverse().join("-");
    dataPrevistaCell.innerHTML = `<input type='date' value='${formattedDataPrevista}'>`;

    let copiarCell = row.insertCell(-1);
    let copiarButton = document.createElement("button");
    copiarButton.className = "recebido";
    copiarButton.textContent = "Copiar";
    copiarButton.addEventListener("click", function () {
      copiarParaRecebimento(this);
    });
    copiarCell.appendChild(copiarButton);
  } else if (table.id === "recebimento") {
    let dataRecebimentoCell = row.insertCell(-1);
    let todayDate = new Date().toISOString().slice(0, 10); // Esta já está no formato correto
    dataRecebimentoCell.innerHTML = `<input type='date' value='${todayDate}'>`;

    let atualizarCell = row.insertCell(-1);
    let atualizarButton = document.createElement("button");
    atualizarButton.className = "update-button";
    atualizarButton.textContent = "Atualizar";
    // Add event listener for atualizarButton here if needed
    atualizarCell.appendChild(atualizarButton);
  }
}

function copiarParaRecebimento(button) {
  const sourceRow = button.closest("tr"); // Encontra a linha do botão que foi clicado
  const targetTableBody = document.getElementById("tableBody2"); // Seleciona o tbody da tabela de destino
  const newRow = targetTableBody.insertRow(-1); // Cria uma nova linha no final do tbody de recebimento

  // Copia as células da linha de origem para a nova linha de destino, exceto as duas últimas
  Array.from(sourceRow.cells).forEach((cell, index) => {
    if (index < sourceRow.cells.length - 2) {
      // Ignora as duas últimas células
      let newCell = newRow.insertCell(-1);
      if (cell.querySelector("input, select")) {
        // Copia inputs ou selects
        if (cell.querySelector("input")) {
          let input = cell.querySelector("input");
          newCell.innerHTML = `<input type='${input.type}' value='${input.value}' ${input.type === "text" ? "" : "readonly"}>`;
        } else if (cell.querySelector("select")) {
          // Cria um novo select com as mesmas opções
          let select = cell.querySelector("select");
          let newSelect = document.createElement("select");
          Array.from(select.options).forEach((option) => {
            let newOption = new Option(option.text, option.value, option.selected, option.selected);
            newSelect.appendChild(newOption);
          });
          newCell.appendChild(newSelect);
        }
      } else {
        // Simplesmente copia o texto
        newCell.textContent = cell.textContent;
      }
    }
  });

  // Adiciona células específicas para a tabela de recebimento
  let todayDate = new Date().toISOString().slice(0, 10);
  newRow.insertCell(-1).innerHTML = `<input type='date' value='${todayDate}'>`; // Data de recebimento
  newRow.insertCell(-1).innerHTML = `<button class='update-button'>Atualizar</button>`; // Botão Atualizar

  comparar();
}

function addLine() {
  const table = document.getElementById("recebimento");
  const tbody = table.querySelector("tbody");
  const row = tbody.insertRow(-1);
  const fields = ["ID", "Fornecedor", "Id_compra", "Quantidade", "Qualidade", "Largura", "Comprimento", "Onda", "Vincos", "Status", "Data_recebimento"];

  fields.forEach((field, index) => {
    const cell = row.insertCell(index);
    if (field === "Status" || field === "Onda" || field == "Vincos") {
      // Adicionar dropdowns para campos específicos
      let selectHTML = `<select>`;
      if (field === "Status") {
        selectHTML += `<option>Comprado</option><option>Recebido</option><option>Parcialmente</option>`;
      } else if (field == "Onda") {
        selectHTML += `<option>E</option><option>B</option><option>C</option><option>BB</option><option>BC</option>`;
      } else {
        selectHTML += `<option>Sim</option><option>Não</option>`;
      }
      selectHTML += `</select>`;
      cell.innerHTML = selectHTML;
    } else if (field == "Data_recebimento") {
      cell.innerHTML = `<input type='date'>`;
    } else {
      cell.innerHTML = `<input type='text'>`; // Campos editáveis
    }
  });

  // Adicionar botão de atualizar
  const updateCell = row.insertCell(-1);
  updateCell.innerHTML = `<button class='update-button'>Atualizar</button>`;
}
document.getElementById("add-line-button").addEventListener("click", addLine);

function hideDropZone() {
  var dropZone = document.getElementById("drop-zone");
  var tables = document.getElementById("tables");
  if (dropZone.style.display === "none") {
    dropZone.style.display = "flex";
    tables.style.display = "none";
  } else {
    dropZone.style.display = "none";
    tables.style.display = "block";
  }
}
document.getElementById("toggle-drop-zone").addEventListener("click", hideDropZone);

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Verifica se o nó é do tipo Element
        // Aplica readonly aos inputs de texto e de data
        if (node.matches('#bancoDados input[type="text"], #bancoDados input[type="date"]')) {
          node.setAttribute("readonly", "true");
        }
        // Aplica disabled aos selects
        if (node.matches("#bancoDados select")) {
          node.setAttribute("disabled", "true");
        }
        // Verifica e modifica elementos filhos dentro de nó adicionado
        node.querySelectorAll('#bancoDados input[type="text"], #bancoDados input[type="date"], #bancoDados select').forEach((child) => {
          if (child.tagName === "INPUT" && (child.type === "text" || child.type === "date")) {
            child.setAttribute("readonly", "true");
          }
          if (child.tagName === "SELECT") {
            child.setAttribute("disabled", "true");
          }
        });
      }
    });
  });
});

// Configura o observer para observar mudanças na árvore do DOM
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

document.getElementById("drop-zone").addEventListener("dragover", function (event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
});

document.getElementById("drop-zone").addEventListener("drop", function (event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (!file) {
    alert("Por favor, solte um arquivo válido.");
  }
});

function comparar() {
  const table1 = document.getElementById("bancoDados").querySelector("tbody");
  const table2 = document.getElementById("recebimento").querySelector("tbody");

  for (let i = 0; i < table2.rows.length; i++) {
    const row2 = table2.rows[i];
    let foundMatch = false;

    for (let j = 0; j < table1.rows.length; j++) {
      const row1 = table1.rows[j];
      let allMatch = true;

      // Verifica as colunas de 'Quantidade' até 'Status'
      for (let k = 4; k <= 8; k++) {
        let cell1 = row1.cells[k].querySelector("input, select")
          ? row1.cells[k].querySelector("input, select").value.trim().toLowerCase()
          : row1.cells[k].textContent.trim().toLowerCase();
        let cell2 = row2.cells[k].querySelector("input, select")
          ? row2.cells[k].querySelector("input, select").value.trim().toLowerCase()
          : row2.cells[k].textContent.trim().toLowerCase();

        if (cell1 !== cell2) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        console.log(`Correspondência completa encontrada na linha ${i + 1}`);
        foundMatch = true;
        row2.cells[0].querySelector("input").value = row1.cells[0].querySelector("input").value;
        validar_status(row1, row2); // Chama a função para validar e alterar o status conforme necessário
        break;
      }
    }

    if (!foundMatch) {
      console.log(`Nenhuma correspondência completa encontrada para a linha ${i + 1}`);
    }
  }
}
document.getElementById("compare-tables").addEventListener("click", comparar);

function validar_status(rowBancoDados, rowRecebimento) {
  console.log("Validando status...");

  const quantidadeBancoDados = parseInt(rowBancoDados.cells[3].querySelector("input").value, 10);
  const quantidadeRecebimento = parseInt(rowRecebimento.cells[3].querySelector("input").value, 10);

  if (quantidadeRecebimento >= quantidadeBancoDados) {
    rowRecebimento.cells[9].querySelector("select").value = "Recebido";
    console.log("Status mudado para Recebido");
  } else if (quantidadeRecebimento < quantidadeBancoDados) {
    rowRecebimento.cells[9].querySelector("select").value = "Parcialmente";
    console.log("Status mudado para Parcialmente");
  }
}

function alterarTema() {
  const toggle = document.getElementById("darkModeToggle");
  const theme = toggle.checked ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme); // Aplica o atributo de tema ao root do documento
  localStorage.setItem("theme", theme);

  // Aplica ou remove o filtro de inversão baseado no tema
  if (toggle.checked) {
    document.querySelector(".logo img").style.filter = "invert(100%)";
  } else {
    document.querySelector(".logo img").style.filter = "none";
  }
}

document.getElementById("darkModeToggle").addEventListener("change", alterarTema);

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark"; // Assume "dark" se nada estiver salvo
  const toggle = document.getElementById("darkModeToggle");
  toggle.checked = savedTheme === "dark";
  document.documentElement.setAttribute("data-theme", savedTheme); // Aplica o tema salvo ao carregar

  // Aplica a inversão inicial com base no tema salvo
  if (savedTheme === "dark") {
    document.querySelector(".logo img").style.filter = "invert(100%)";
  } else {
    document.querySelector(".logo img").style.filter = "none";
  }
});

//PDF

function extractText(data) {
  pdfjsLib.getDocument(data).promise.then(function (pdf) {
    var numPages = pdf.numPages;
    var promises = [];
    for (var i = 1; i <= numPages; i++) {
      promises.push(
        pdf.getPage(i).then(function (page) {
          return page.getTextContent().then(function (textContent) {
            return textContent.items.map((item) => item.str).join(" ");
          });
        }),
      );
    }

    Promise.all(promises)
      .then(function (pageTexts) {
        var fullText = pageTexts.join("\n").toUpperCase();
        processText(fullText);
      })
      .catch(function (error) {
        console.error("Erro ao extrair texto:", error);
      });
  });
}

function processText(text) {
  if (text.includes("FERNANDEZ")) {
    var result = fernandez(text);
    const tablef = document.getElementById("recebimento");
    const uniqueIds = new Set(); // Conjunto para armazenar IDs únicos

    // Primeiro acumula todos os IDs de compra únicos
    result.forEach((obj) => {
      if (Array.isArray(obj.id_compra)) {
        obj.id_compra.forEach((id) => uniqueIds.add(id)); // Adiciona cada ID ao conjunto
      } else {
        uniqueIds.add(obj.id_compra); // Adiciona o ID ao conjunto
      }
    });

    // Prepara chamadas de fetchChapas e acumula promessas
    const fetchPromises = [];
    uniqueIds.forEach((id) => {
      const fetchPromise = fetchChapas(id);
      fetchPromises.push(fetchPromise);
    });

    // Espera todas as fetchChapas terminarem
    Promise.all(fetchPromises)
      .then(() => {
        // Depois que todas as chamadas forem concluídas, processa cada objeto para criar a tabela
        result.forEach((obj) => {
          criarTable(tablef, obj);
        });
      })
      .catch((error) => {
        console.error("Erro durante a busca de chapas:", error);
      });
  } else if (text.includes("PENHA")) {
    var result = penha(text); // result é um array de objetos
    const tablep = document.getElementById("recebimento");
    const processedIds = new Set(); // Set para armazenar ids únicos

    result.forEach((obj) => {
      if (!processedIds.has(obj.id_compra)) {
        fetchChapas(obj.id_compra); // Executa se o id_compra ainda não foi processado
        processedIds.add(obj.id_compra); // Adiciona o id_compra ao Set
      }
    });

    result.forEach((obj) => criarTable(tablep, obj)); // Criar uma linha para cada objeto
  } else if (text.includes("IRANI")) {
    var result = irani(text); // result é um array de objetos
    const tablep = document.getElementById("recebimento");
    const processedIds = new Set(); // Set para armazenar ids únicos

    result.forEach((obj) => {
      if (!processedIds.has(obj.id_compra)) {
        fetchChapas(obj.id_compra); // Executa se o id_compra ainda não foi processado
        processedIds.add(obj.id_compra); // Adiciona o id_compra ao Set
      }
    });

    result.forEach((obj) => criarTable(tablep, obj)); // Criar uma linha para cada objeto
  } else {
    console.log("Não encontrou o fornecedor");
  }
}

function penha(fullText) {
  var descricaoIndex = fullText.indexOf("DESCRIÇÃO DOS PRODUTOS/SERVIÇOS CÓDIGO");
  if (descricaoIndex === -1) {
    console.warn('Palavra-chave "DESCRIÇÃO DOS PRODUTOS/SERVIÇOS CÓDIGO" não encontrada.');
    return [];
  }
  var dadosIndex = fullText.indexOf("DADOS", descricaoIndex);
  if (dadosIndex === -1) {
    console.warn('Palavra-chave "DADOS" não encontrada.');
    return [];
  }
  var relevantText = fullText.substring(descricaoIndex + 40, dadosIndex);
  var resultArray = filtroPenha(relevantText);
  return resultArray.map(criaObjPenha); // Assegura que cada elemento de resultArray é processado por criaObjPenha
}

function filtroPenha(text) {
  console.log(text);
  function replaceMed(match) {
    return match.replace("-MED.", " ");
  }
  var result = text.replace(/\bUN\b|\bCHAPA DE PAP\. ONDUL\.-QUAL\.\b|\b--REF\.: CHAPA\b|\bPEDI DO\b|\b-N\/PEDIDO:\b|\b000\b|\bPEDI DO\b|\b:\b/g, "");
  result = result.replace(/(.*?)-MED\.(.*?)/g, replaceMed);
  result = result.replace(/(VINCADA)[\s\S]*?(ONDA)/, "$1 $2");
  result = result.replace(/PEDIDO/g, "");
  result = result.replace(/ONDA/g, "");
  result = result.replace(/-SEU PEDI  DO\b/g, "");
  result = result.replace(/:/g, "");
  result = result.replace(/-SEU/g, "");

  var resultArray = result.split(/\s+/).filter(Boolean);

  return organizarpenha(resultArray);
}

function organizarpenha(array) {
  console.log(array);
  var indexesToRemove = [0, 1, 2, 5, 6, 8, 9, 12, 17];
  var indexesToRemoveVincos = [0, 1, 2, 5, 6, 8, 9, 12, 17];
  var newArray = [];
  for (var i = 0; i < array.length; i += 18) {
    var subArray = array.slice(i, i + 18);

    if (subArray.length === 18 && subArray[17].length !== 7) {
      // Remove o último índice
      subArray.pop();

      // Adiciona o próximo índice ao subArray se disponível
      if (array[i + 18] !== undefined) {
        subArray.push(array[i + 18]);
        i++; // Incrementa i para evitar que o próximo índice seja duplicado em outro subArray
      }
    }
    console.log(subArray);
    if (subArray.length > 0) {
      for (var j = 0; j < indexesToRemove.length; j++) {
        if (subArray[14] == "VINCADA") {
          var index = indexesToRemoveVincos[j];
        } else {
          var index = indexesToRemove[j];
        }
        if (subArray[index]) {
          delete subArray[index];
        }
      }
      subArray = subArray.filter((item) => item !== undefined);

      if (subArray.length >= 5) {
        subArray[4] = subArray[4] + subArray[5];
        subArray.splice(5, 1);
      }

      newArray.push(subArray);
    }
  }
  return newArray;
}

function criaObjPenha(array) {
  let id_compra = array[7] || "";
  const slashIndex = id_compra.indexOf("/");
  if (slashIndex !== -1) {
    id_compra = id_compra.substring(0, slashIndex);
  }
  id_compra = id_compra.replace(/\./g, "");
  var qRec = parseFloat(array[2].replace(/[,.]/g, ""));
  var valorUnitario = parseFloat(array[1].replace(",", ".")); // Correção para formato de número
  var valor_total = parseFloat(array[0].replace(".", "").replace(",", "."));

  var medidas = array[4].split("X").map(function (medidas) {
    return medidas.replace(/^0+/, "");
  });
  var vinco = "";
  if (array[5] == "VINCADA") {
    vinco = "sim";
  } else {
    vinco = "não";
  }

  return {
    id_compra: (id_compra || "").trim(),
    fornecedor: "Penha",
    qualidade: array[3] || "",
    largura: medidas[1],
    comprimento: medidas[0],
    onda: array[6] || "",
    vincos: vinco,
    valor_unitario: valorUnitario || "0", // Verificação e correção
    quantidade_recebida: qRec || "",
    valor_total: valor_total,
  };
}

function irani(fullText) {
  var descricaoIndex = fullText.indexOf("ALÍQ. IPI");
  if (descricaoIndex === -1) {
    console.warn('Palavra-chave "ALÍQ. IPI" não encontrada.');
    return [];
  }
  var dadosIndex = fullText.indexOf("DADOS", descricaoIndex);
  if (dadosIndex === -1) {
    console.warn('Palavra-chave "DADOS" não encontrada.');
    return [];
  }
  var relevantText = fullText.substring(descricaoIndex + 10, dadosIndex);
  var resultArray = relevantText.split(/\s+/).filter(Boolean);
  return organizarirani(resultArray);
}

function organizarirani(array) {
  var indexesToRemove = [0, 1, 2, 3, 6, 8, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 24, 25];
  var newArray = [];
  for (var i = 0; i < array.length; i += 26) {
    var subArray = array.slice(i, i + 26);
    if (subArray.length > 0) {
      var filteredSubArray = subArray.filter((item, index) => !indexesToRemove.includes(index));
      var filteredAndProcessed = filtroIrani(filteredSubArray);
      var objeto = criaObjIrani(filteredAndProcessed);
      newArray.push(objeto);
    }
  }

  return newArray;
}

function filtroIrani(array) {
  var splitIndex = array.findIndex((item) => item.includes("/"));
  if (splitIndex !== -1) {
    var parts = array[splitIndex].split("/");
    array.push(parts[0].trim()); // Adiciona a primeira parte no final do array
    array.push(parts[1].trim()); // Adiciona a segunda parte no final do array
    array.splice(splitIndex, 1); // Remove o elemento original que continha a barra
  }
  array[3] = array[3].replace(",", ".");
  array[3] = parseFloat(array[3] * 1000).toFixed(0);
  array[4] = array[4].replace(",", "");
  array[5] = array[5].replace(".", "").replace(",", ".");

  return array;
}

function criaObjIrani(array) {
  return {
    id_compra: array[2],
    fornecedor: "Irani",
    qualidade: array[6],
    comprimento: array[1],
    largura: array[0],
    onda: array[7],
    vincos: "", // Vazio como solicitado
    quantidade_recebida: array[3],
    valor_unitario: array[4],
    valor_total: array[5],
  };
}

function fernandez(fullText) {
  var aiIndex = fullText.indexOf("A.IPI");
  if (aiIndex === -1) {
    console.warn('Palavra-chave "A.IPI" não encontrada.');
    return [];
  }
  var relevantText = fullText.substring(aiIndex + 5).replace(/UN/g, "");
  var resultArray = relevantText.split(/\s+/).filter(Boolean);
  var idCompra = id_compraF(fullText);
  return organizarFernandez(resultArray, idCompra);
}

function organizarFernandez(array, idCompra) {
  console.log(array);
  var indexesToRemove = [0, 2, 3, 4, 7, 9, 10, 11, 12];
  var newArray = [];
  for (var i = 0; i < array.length; i += 13) {
    var subArray = array.slice(i, i + 13);
    console.log(subArray);
    if (subArray.length > 1) {
      var filteredSubArray = subArray.filter((item, index) => !indexesToRemove.includes(index));
      var filteredAndProcessed = filtroFernandez(filteredSubArray[0]);
      filteredSubArray.splice(0, 1);
      var objeto = criaObjFernandez([...filteredSubArray, ...filteredAndProcessed]);

      if (objeto.quantidade_recebida) {
        let quantidadeModificada = objeto.quantidade_recebida.replace(/\.|\,/g, (match) => (match === "," ? "." : ""));
        objeto.quantidade_recebida = parseFloat(quantidadeModificada).toString();
      }

      objeto.valor_unitario = objeto.valor_unitario.replace(/\./g, "").replace(/,/g, ".");
      objeto.valor_total = objeto.valor_total.replace(/\./g, "").replace(/,/g, ".");
      objeto.id_compra = idCompra;

      newArray.push(objeto);
    }
  }
  return newArray;
}

function id_compraF(fullText) {
  var aiIndex = fullText.indexOf("PEDIDO DO CLIENTE:");
  if (aiIndex === -1) {
    console.warn('Palavra-chave "Pedido do Cliente:" não encontrada.');
    return [];
  }
  var dadosIndex = fullText.indexOf("PRODUTO", aiIndex);
  if (dadosIndex === -1) {
    console.warn('Palavra-chave "PRODUTO" não encontrada.');
    return [];
  }
  var relevantText = fullText.substring(aiIndex + 19, dadosIndex);
  relevantText = relevantText.replace(/\./g, "").replace("INCLUSAO", ""); // Remove ponto e a palavra INCLUSÃO
  var resultArray = relevantText.split(/\s+/).filter(Boolean);
  return resultArray;
}

function filtroFernandez(secondArray) {
  console.log(secondArray);
  let parts = secondArray.split("-");
  let secondPart = parts.length > 1 ? parts[1] : "";
  let result = secondPart.split(/(\d.+)/, 2);
  return [...parts.slice(0, 1), ...result];
}

function criaObjFernandez(array) {
  console.log(array);
  var medidas = array[5].split("X");
  return {
    id_compra: array[0],
    fornecedor: "Fernandez",
    qualidade: array[3],
    largura: medidas[0],
    comprimento: medidas[1],
    onda: array[4],
    vincos: "",
    quantidade_recebida: array[0],
    valor_unitario: array[2],
    valor_total: array[3],
  };
}

//XML

function parseXML(xml) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "application/xml");
  const products = xmlDoc.getElementsByTagName("det");
  const table = document.getElementById("recebimento");

  const supplier = extractSupplier(xmlDoc);
  const prodFunc = { Penha: prod_Penha, Fernandez: prod_Fernandez, Irani: prod_Irani };

  const uniqueIds = new Set();

  // Coletar todos os IDs de compra primeiro
  Array.from(products).forEach((product) => {
    const prodDetails = prodFunc[supplier]?.(product);
    if (!prodDetails) return;

    const chapaData = data_Chapa(prodDetails, product, supplier, xmlDoc);
    uniqueIds.add(chapaData.id_compra);
  });

  const fetchPromises = Array.from(uniqueIds).map((id) => fetchChapas(id));

  Array.from(products).forEach((product) => {
    const prodDetails = prodFunc[supplier]?.(product);
    if (!prodDetails) return;

    const chapaData = data_Chapa(prodDetails, product, supplier, xmlDoc);
    criarTable(table, chapaData); // Cria uma linha na tabela para cada chapaData
  });
}

function extractSupplier(xmlDoc) {
  const xNome = xmlDoc.getElementsByTagName("emit")[0].getElementsByTagName("xNome")[0].textContent;
  const supplierMap = {
    PENHA: "Penha",
    FERNANDEZ: "Fernandez",
    Irani: "Irani",
  };

  return Object.keys(supplierMap).find((key) => xNome.includes(key)) ? supplierMap[Object.keys(supplierMap).find((key) => xNome.includes(key))] : "";
}

function data_Chapa(prodDetails, product, supplier, xmlDoc) {
  const xPedContent = product.getElementsByTagName("xPed")[0].textContent;
  const slashIndex = xPedContent.indexOf("/");
  const cleanedText = slashIndex !== -1 ? xPedContent.substring(0, slashIndex) : xPedContent;
  const xPed = cleanedText.replace(/\D/g, "");
  let qCom = "";
  if (supplier == "Irani") {
    qCom = parseFloat(product.getElementsByTagName("qCom")[0].textContent * 1000).toFixed(0);
  } else {
    qCom = parseFloat(product.getElementsByTagName("qCom")[0].textContent) || 0;
  }
  const vUnCom = parseFloat(product.getElementsByTagName("vUnCom")[0].textContent) || 0;
  const vProd = parseFloat(product.getElementsByTagName("vProd")[0].textContent) || 0;

  const { qualidade, medida, tipoOnda, vincada } = prodDetails;
  var medidas = medida.split(/x/i).map(function (medidas) {
    return medidas.replace(/^0+/, "");
  });
  return {
    id_compra: xPed,
    fornecedor: supplier,
    qualidade: qualidade,
    comprimento: medidas[0],
    largura: medidas[1],
    onda: tipoOnda,
    quantidade_recebida: qCom,
    vincos: vincada,
    valor_unitario: vUnCom,
    valor_total: vProd,
  };
}

function prod_Fernandez(product) {
  var xProd = product.getElementsByTagName("xProd")[0].textContent;
  var parts = xProd.split("-");
  var tipoOnda = parts.length > 1 ? parts[1].match(/[A-Za-z]+/)[0] : "";
  var startOfMeasure = parts[1].indexOf(tipoOnda) + tipoOnda.length;
  var medida = parts.length > 1 ? parts[1].substring(startOfMeasure).trim() : "";

  return {
    qualidade: parts[0] ? parts[0].trim() : "",
    medida: medida,
    tipoOnda: tipoOnda,
    vincada: "", // Always empty for Fernandez
  };
}

function prod_Irani(product) {
  var xProd = product.getElementsByTagName("xProd")[0].textContent;
  var qualidade = xProd.match(/OND\.(.*?)\//)[1].trim();
  var ondaEmedida = xProd.split("/")[1];
  var tipoOnda = ondaEmedida.match(/([A-Za-z]+) /)[1];
  var medida = ondaEmedida.match(/\d+ X \d+/)[0];

  medida = invertDimensions(medida);

  function invertDimensions(dimensions) {
    const parts = dimensions.split(" X ");
    if (parts.length !== 2) {
      return dimensions;
    }
    return parts.reverse().join("X");
  }

  return {
    qualidade: qualidade,
    medida: medida,
    tipoOnda: tipoOnda,
    vincada: "", // Sempre vazio para Irani
  };
}

function prod_Penha(product) {
  var xProd = product.getElementsByTagName("xProd")[0].textContent;
  return {
    qualidade: xProd.match(/-QUAL\.(.*)-MED\./)[1],
    medida: xProd
      .match(/-MED\.(.*)--REF\./)[1]
      .replace(/^[^-]*-/, "")
      .trim(),
    tipoOnda: xProd.match(/ONDA (.*?)-SEU PEDIDO/)[1],
    vincada: /VINCADA/.test(xProd) ? "Sim" : "Não",
  };
}

document.addEventListener("DOMContentLoaded", function () {
  document.body.addEventListener("click", function (event) {
    if (event.target.classList.contains("update-button")) {
      sendDataToServer();
    }
  });
});

async function sendDataToServer() {
  try {
    var data = tableObj();
    console.log(data); // Log para depuração
    const response = await axios.put(`${BASE_URL}/recebimento`, data);
    alert("Dados atualizados com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar dados: ", error);
    alert("Erro ao atualizar os dados: " + error.message);
  }
}

function tableObj() {
  var table = document.getElementById("recebimento").getElementsByTagName("tbody")[0];
  var rows = table.rows;
  var data = [];

  for (let i = 0; i < rows.length; i++) {
    var row = rows[i];
    // Obtem o valor do input na primeira coluna
    var idChapaValue = row.cells[0].querySelector("input").value;

    // Verifica se a primeira coluna está vazia, se estiver, pula para a próxima iteração do loop
    if (idChapaValue.trim() === "") {
      continue;
    }

    var rowData = {
      id_chapa: idChapaValue,
      fornecedor: row.cells[1].querySelector("input").value,
      id_compra: row.cells[2].querySelector("input").value,
      quantidade_recebida: parseFloat(row.cells[3].querySelector("input").value) || 0,
      qualidade: row.cells[4].querySelector("input").value,
      largura: row.cells[5].querySelector("input").value,
      comprimento: row.cells[6].querySelector("input").value,
      onda: row.cells[7].querySelector("select").value,
      vincos: row.cells[8].querySelector("select").value,
      status: row.cells[9].querySelector("select").value,
      data_recebimento: row.cells[10].querySelector("input").value,
    };
    data.push(rowData);
  }
  return data;
}
