var dropzone = document.getElementById('dropzone');
var jsonData; // Variável global para armazenar os dados JSON processados
var dropEnabled = true; // Variável para controlar se o evento de solta (drop) está habilitado

// Evento de clique no dropzone
dropzone.addEventListener('click', openFilePicker);

// Adiciona um listener de evento de dragover no elemento document
document.addEventListener('dragover', function (event) {
    event.preventDefault(); // Impede o comportamento padrão de abrir o PDF no navegador
    event.stopPropagation();
    if (dropEnabled) {
        dropzone.classList.add('dragover');
    }
    return false; // Evita o comportamento padrão do navegador
});

// Adiciona um listener de evento de drop no elemento document
document.addEventListener('drop', function (event) {
    event.preventDefault(); // Impede o comportamento padrão de abrir o PDF no navegador
    event.stopPropagation();
    dropzone.classList.remove('dragover');

    if (dropEnabled) {
        var file = event.dataTransfer.files[0];
        console.log("Arquivo solto:", file.name);
        handleFile(file);
    }
});

function openFilePicker() {
    if (dropEnabled) {
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf';
        fileInput.style.display = 'none';

        // Evento de mudança no input de arquivo
        fileInput.addEventListener('change', function (event) {
            var file = event.target.files[0];
            console.log("Arquivo selecionado:", file.name);
            handleFile(file);
        });

        // Simula o clique no input de arquivo
        fileInput.click();
    }
}

function handleFile(file) {
    dropEnabled = false; // Desativa o evento de solta (drop) no documento
    console.log("Lendo arquivo:", file.name);
    var reader = new FileReader();

    reader.onload = function (event) {
        console.log("Arquivo lido com sucesso:", file.name);
        var pdfData = new Uint8Array(event.target.result);
        pdfjsLib.getDocument({ data: pdfData }).promise.then(function (pdf) {
            console.log("PDF processado com sucesso:", file.name);
            var infoPedido = {};
            var pedidoCompra = '';
            var infoProdComprados = [];
            var prodComprado = {};
            var lineNumber = 1;
            var isInfoPedido = false;
            var isPedidoCompra = false;
            var isInfoProdComprados = false;
            var isValoresExpressos = false;
            var hasInclusao = false;


            // Dentro da função handleFile(file), após todas as operações de processamento do arquivo, chame a função para abrir o modal
            pdf.getPage(1).then(function (page) {
                page.getTextContent().then(function (textContent) {
                    var items = textContent.items;
                    var fullText = items.map(function (item) {
                        return item.str.trim().toLowerCase();
                    }).join(' '); // Concatenar todo o texto em uma única string

                    // Verificar se a palavra "INCLUSÃO" está presente no texto
                    var hasInclusao = fullText.includes('inclusão');

                    // Extrair o número do cliente
                    var numeroClienteMatch = fullText.match(/\b\d+(?:\.\d+)?\b/);
                    var numeroCliente = numeroClienteMatch ? numeroClienteMatch[0] : '';

                    // Encontre a linha que contém o pedido de compra
                    var pedidoCompraLine = 0;
                    items.forEach(function (item, index) {
                        if (item.str.includes("INCLUSÃO")) {
                            pedidoCompraLine = index + 1; // Adicionamos 1 porque o índice começa em 0, mas as linhas começam em 1
                        }
                    });
                    var shouldSkipNextLine = false;

                    // Loop sobre cada item do texto
                    var skipNextValue = false; // Variável para controlar se devemos ignorar o próximo valor
                    items.forEach(function (item, index) {
                        var line = item.str.trim();

                        // Verifica se a linha contém o caractere "E" seguido por um número
                        if (line.startsWith('E ') && !isNaN(parseFloat(line.split(' ')[1]))) {
                            // Ignora a linha que contém o "E" e pula para a próxima
                            skipNextValue = true;
                            return;
                        }

                        // Verifica se a linha contém o número do cliente
                        if (line.includes('/ENCAIX')) {
                            // Captura o número do cliente usando uma expressão regular
                            var numeroClienteMatch = line.match(/\b\d+\/ENCAIX\b/);
                            if (numeroClienteMatch) {
                                numeroCliente = numeroClienteMatch[0];
                            } else {
                                console.error("Não foi possível capturar o número do cliente.");
                            }
                            skipNextValue = false; // Reinicia a variável para não ignorar o próximo valor
                        }

                        // Verifica se devemos adicionar o valor atual ao JSON
                        if (!skipNextValue) {
                            // Restante do código permanece o mesmo para adicionar os valores ao JSON
                            // ...
                        } else {
                            // Reinicia a variável para não ignorar o próximo valor
                            skipNextValue = false;
                        }

                        if (isValoresExpressos) {
                            return; // Saímos do loop se chegarmos aos valores expressos
                        }
                        if (lineNumber === 1 || lineNumber === 15 || lineNumber === 23) {
                            isInfoPedido = true;
                            isPedidoCompra = false;
                            isInfoProdComprados = false;
                            if (line !== '') {
                                switch (lineNumber) {
                                    case 1:
                                        infoPedido.comprador = line;
                                        break;
                                    case 15:
                                        infoPedido.data_compra = line;
                                        break;
                                    case 23:
                                        infoPedido.fornecedor = line;
                                        break;
                                }
                            }
                        } else if (lineNumber > pedidoCompraLine && !isValoresExpressos) {
                            if ((lineNumber - 56) % 19 === 0) {
                                isInfoPedido = false;
                                isPedidoCompra = false;
                                isInfoProdComprados = true;
                                if (Object.keys(prodComprado).length !== 0) {
                                    // Adiciona o número do cliente ao objeto prodComprado
                                    prodComprado.numero_cliente = numeroCliente;
                                    prodComprado.pedido_compra = hasInclusao ? "INCLUSÃO " + pedidoCompra : pedidoCompra;
                                    infoProdComprados.push(renameProperties(removeEmptyProperties(prodComprado)));
                                    prodComprado = {};
                                }
                            }
                            if (line === 'Valores expressos em Reais') {
                                isValoresExpressos = true;
                                return;
                            }
                            if (isInfoProdComprados) {

                                switch ((lineNumber - 56) % 19) {
                                    case 1:
                                        prodComprado.cliente = line;
                                        break;
                                    case 3:
                                        prodComprado['quantidade_comprada'] = line; // Alterado de 'quant.' para 'quantidade'
                                        break;
                                    case 5:
                                        prodComprado.unidade = line;
                                        break;
                                    case 7:
                                        prodComprado['qualidade'] = line; // Alterado de 'qual.' para 'qualidade'
                                        break;
                                    case 9:
                                        prodComprado.onda = line;
                                        break;
                                    case 11:
                                        prodComprado['gramatura'] = line;
                                        break;
                                    case 13:
                                        prodComprado['peso_total'] = line; // Alterado de 'peso_lote_chapa' para 'peso_total'
                                        break;
                                    case 15:
                                        prodComprado['valor_kilo'] = line; // Renomeado de 'coluna' para 'valor_kilo'
                                        break;
                                    case 17:
                                        prodComprado['valor_total'] = line; // Alterado de 'valor_lote_chapa' para 'valor_total'
                                        break;
                                    case 18:
                                        // Verifica se a linha contém o caractere "-"
                                        if (line.includes('-')) {
                                            var parts = line.split('-');
                                            // Verifica se o array resultante da divisão tem pelo menos dois elementos
                                            if (parts.length >= 2) {
                                                var descricao = parts[0].trim(); // Extrai a descrição antes do "-"
                                                var vincos = parts[1].trim().replace('VINCOS:', '').replace('vincos:', '').trim(); // Remove "VINCOS:" ou "vincos:"

                                                // Verifica se vincos contém o caractere "+"
                                                if (!vincos.includes('+')) {
                                                    vincos = 'não'; // Define vincos como "não" se não contiver "+"
                                                }

                                                prodComprado['medida'] = descricao; // Define a descrição como a medida
                                                prodComprado['vincos'] = vincos; // Define o valor após o "-" como vincos
                                            } else {
                                                console.error("Formato de linha inválido para a medida:", line);
                                                prodComprado['medida'] = ''; // Definindo medida como vazio
                                                prodComprado['vincos'] = ''; // Definindo vincos como vazio
                                            }
                                        } else {
                                            console.error("Caractere '-' não encontrado na linha:", line);
                                            prodComprado['medida'] = ''; // Definindo medida como vazio
                                            prodComprado['vincos'] = ''; // Definindo vincos como vazio
                                        }
                                        break;




                                }
                            }
                        }
                        lineNumber++;
                    });
                    // Se encontramos "INCLUSÃO", procuramos um número no formato "XX.XXX" no texto completo
                    if (hasInclusao) {
                        var regex = /\b\d{2}\.\d{3}\b/;
                        var match = fullText.match(regex);
                        if (match) {
                            pedidoCompra = match[0];
                        }
                    } else {
                        // Se não houver "INCLUSÃO", tentamos extrair o número do pedido de compra da linha 53
                        var pedidoCompraLine = items[54].str.trim(); // Linha 53 é indexada como 52
                        var pedidoCompraMatch = pedidoCompraLine.match(/\b\d{2}\.\d{3}\b/);
                        if (pedidoCompraMatch) {
                            pedidoCompra = pedidoCompraMatch[0];
                        } else {
                            console.error("Número do pedido de compra não encontrado na linha 55.");
                            // Lidar com a situação em que o número do pedido de compra não é encontrado na linha 53
                            // Por exemplo, definir um valor padrão para o pedido de compra ou lançar um erro
                            pedidoCompra = ''; // Definindo pedidoCompra como vazio
                        }
                    }

                    // Função para converter o id_compra no formato "xx.xxx" em um inteiro
                    function convertToInteger(idCompraStr) {
                        // Remove o ponto da string
                        return parseInt(idCompraStr.replace('.', ''));
                    }

                    // Função para adicionar a data prevista aos objetos em infoPedido e infoProdComprados
                    function addDateToJSON(dateValue, infoPedido, infoProdComprados) {
                        if (infoPedido) {
                            // Adiciona a data prevista ao objeto infoPedido
                            infoPedido.data_prevista = dateValue;
                        } else {
                            console.error("Objeto 'infoPedido' não está definido.");
                        }

                        if (infoProdComprados && Array.isArray(infoProdComprados)) {
                            // Adiciona a data prevista a cada objeto em infoProdComprados
                            infoProdComprados.forEach(function (prod) {
                                prod.data_prevista = dateValue;
                            });
                        } else {
                            console.error("Array 'infoProdComprados' não está definido ou não é um array.");
                        }
                    }


                    // Obtém o valor do input de data prevista
                    var dateValue = document.getElementById('expectedDate').value;

                    // Atribui a data prevista a infoPedido e infoProdComprados
                    addDateToJSON(dateValue, infoPedido, infoProdComprados);

                    // Constrói o objeto JSON final com base nas informações coletadas
                    jsonData = {
                        "info_prod_comprados": infoProdComprados.map(function (prod) {
                            return {
                                ...prod,
                                ...infoPedido,
                                "id_compra": convertToInteger(hasInclusao ? "INCLUSÃO " + pedidoCompra : pedidoCompra),
                                "data_prevista": dateValue  // Adiciona a data prevista ao objeto
                            };
                        })
                    };










                    // Adiciona o JSON diretamente à tabela no modal
                    var dataTable = document.getElementById('dataTable');
                    if (dataTable) {
                        // Limpa a tabela antes de adicionar novos dados
                        dataTable.innerHTML = '';

                        // Adiciona o cabeçalho da tabela
                        var headerRow = dataTable.insertRow();
                        ['Quant. Comprada', 'Qualidade', 'Onda', 'Medida', 'Vincos'].forEach(function (header) {
                            var th = document.createElement('th');
                            th.textContent = header;
                            th.classList.add('table-header'); // Adiciona a classe 'table-header'
                            headerRow.appendChild(th);
                        });

                        // Loop sobre cada item de infoProdComprados
                        infoProdComprados.forEach(function (prod, index) {
                            var row = dataTable.insertRow(); // Insere uma nova linha na tabela

                            // Definir o atributo 'data-id' com o índice do item em infoProdComprados
                            row.setAttribute('data-id', index);

                            // Exibir as informações desejadas na tabela, incluindo 'vincos'
                            var infoToShow = ['quantidade_comprada', 'qualidade', 'onda', 'medida', 'vincos'];

                            infoToShow.forEach(function (info) {
                                var cell = row.insertCell(); // Insere uma nova célula na linha
                                cell.textContent = prod[info]; // Define o valor da célula como o valor do objeto
                            });

                            // Adiciona uma classe específica para cada linha, alternando entre duas classes para linhas pares e ímpares
                            row.classList.add(index % 2 === 0 ? 'even-row' : 'odd-row');

                            // Criação dos botões "Editar" e "Confirmar"
                            var buttonContainer = document.createElement('div');
                            buttonContainer.classList.add('button-container');

                            var editButton = document.createElement('button');
                            editButton.classList.add('btn', 'btn-info', 'edit', 'mr-2');
                            editButton.addEventListener('click', function () {
                                editRow(row); // Função para editar os dados da linha
                            });

                            var editIcon = document.createElement('img');
                            editIcon.src = 'media/edit_icon_128873.svg';
                            editIcon.alt = 'Edit';
                            editIcon.classList.add('edit-icon'); // Aplica a classe CSS ao elemento img
                            editButton.appendChild(editIcon);

                            var confirmButton = document.createElement('button');
                            confirmButton.classList.add('btn', 'confirm', 'btn-success');
                            confirmButton.addEventListener('click', function () {
                                confirmData(row); // Função para confirmar os dados da linha
                            });

                            // Criar um elemento SVG
                            var confirmIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                            confirmIcon.setAttribute("width", "24");
                            confirmIcon.setAttribute("height", "24");
                            confirmIcon.setAttribute("viewBox", "0 0 512 512");
                            confirmIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");

                            // Adicionar o conteúdo do SVG
                            confirmIcon.innerHTML = `
        <path fill="#0c9113" d="M505.942,29.589c-8.077-8.077-21.172-8.077-29.249,0L232.468,273.813l-55.971-55.971c-8.077-8.076-21.172-8.076-29.249,0    c-8.077,8.077-8.077,21.172,0,29.249l70.595,70.596c3.879,3.879,9.14,6.058,14.625,6.058c5.485,0,10.746-2.179,14.625-6.058    l258.85-258.85C514.019,50.761,514.019,37.666,505.942,29.589z"/>
        <path fill="#0c9113" d="M444.254,235.318c-11.423,0-20.682,9.26-20.682,20.682v164.722c0,14.547-11.835,26.381-26.381,26.381H67.746    c-14.547,0-26.381-11.835-26.381-26.381V91.277c0-14.547,11.835-26.381,26.381-26.381h258.85c11.423,0,20.682-9.26,20.682-20.682    c0-11.422-9.259-20.682-20.682-20.682H67.746C30.391,23.532,0,53.923,0,91.277v329.445c0,37.356,30.391,67.746,67.746,67.746    h329.445c37.355,0,67.746-30.39,67.746-67.746V256C464.936,244.578,455.677,235.318,444.254,235.318z"/>
        `;

                            // Adicionar o ícone ao botão
                            confirmButton.appendChild(confirmIcon);

                            // Insere os botões no container
                            buttonContainer.appendChild(editButton); // Adiciona o botão "Editar" ao container
                            buttonContainer.appendChild(confirmButton); // Adiciona o botão "Confirmar" ao container

                            // Insere o container de botões na última célula da linha na tabela
                            var lastCell = row.insertCell();
                            lastCell.appendChild(buttonContainer);
                        });

                        // Função para desativar o botão "Editar" após ser clicado
                        function disableEditButton(button) {
                            button.disabled = true; // Desativa o botão
                            button.classList.add('disabled'); // Adiciona a classe 'disabled' para aplicar o estilo
                        }

                        // Função para editar os dados da linha
                        function editRow(row) {
                            // Percorre todas as células da linha, exceto a última que contém os botões
                            for (var i = 0; i < row.cells.length - 1; i++) {
                                var cell = row.cells[i];
                                var text = cell.textContent.trim();
                                // Substitui o texto pela entrada de texto para edição
                                cell.innerHTML = '<input type="text" class="form-control centered-input" value="' + text + '">';
                            }
                            // Desativa o botão "Editar" da linha
                            var editButton = row.querySelector('.edit');
                            editButton.disabled = true; // Desativa o botão
                            editButton.classList.add('disabled'); // Adiciona a classe 'disabled' para alterar o estilo do botão

                            // Define a imagem dentro do botão como cinza
                            var editIcon = editButton.querySelector('.edit-icon');
                            editIcon.style.filter = 'grayscale(100%)'; // Torna a imagem cinza
                        }

                        // Função para confirmar os dados da linha
                        function confirmData(row) {
                            // Verifica se jsonData está definido e se possui a propriedade info_prod_comprados
                            if (jsonData && jsonData.info_prod_comprados) {
                                var rowId = row.getAttribute('data-id'); // Obtém o identificador exclusivo da linha
                                var rowData = jsonData.info_prod_comprados[rowId]; // Obtém os dados correspondentes no objeto jsonData

                                // Verifica se rowData está definido antes de atualizar seus valores
                                if (rowData) {
                                    // Atualiza os valores correspondentes no objeto jsonData com os valores das células editadas
                                    rowData.quantidade_comprada = row.cells[0].querySelector('input').value;
                                    rowData.qualidade = row.cells[1].querySelector('input').value;
                                    rowData.onda = row.cells[2].querySelector('input').value;
                                    rowData.medida = row.cells[3].querySelector('input').value;
                                    rowData.vincos = row.cells[4].querySelector('input').value; // Adiciona vincos

                                    // Percorre todas as células da linha, exceto a última que contém os botões
                                    for (var i = 0; i < row.cells.length - 1; i++) {
                                        var cell = row.cells[i];
                                        var input = cell.querySelector('input');
                                        if (input) {
                                            // Atualiza o texto da célula com o valor do campo de entrada
                                            cell.textContent = input.value;
                                        }
                                    }

                                    // Reativa o botão "Editar" da linha
                                    var editButton = row.querySelector('.edit');
                                    editButton.disabled = false; // Ativa o botão
                                    editButton.classList.remove('disabled'); // Remove a classe 'disabled' para restaurar o estilo normal

                                    // Restaura a cor original da imagem dentro do botão
                                    var editIcon = editButton.querySelector('.edit-icon');
                                    editIcon.style.filter = 'none'; // Remove o efeito de escala de cinza
                                } else {
                                    console.error("Não foi possível encontrar os dados da linha no objeto jsonData.");
                                }
                            } else {
                                console.error("Objeto jsonData ou sua propriedade info_prod_comprados não estão definidos.");
                            }
                        }



                        // Adiciona bordas arredondadas às linhas da tabela
                        addRoundedBordersToTableRows();
                    } else {
                        console.error("Elemento da tabela não encontrado.");
                    }

                    // Exibe o modal com os dados
                    var modal = document.getElementById('myModal');
                    if (modal) {
                        modal.style.display = 'block';
                    } else {
                        console.error("Modal não encontrado.");
                    }
                });
            });
            abrirModal();
        }).finally(function () {
            dropEnabled = true; // Reativa o evento de solta (drop) no documento
            console.log("Evento de solta reativado.");
        });
    };

    reader.readAsArrayBuffer(file);
}

// Função para abrir o modal
function abrirModal() {
    var modal = document.getElementById('myModal');
    if (modal) {
        modal.style.display = 'block';
        console.log("Modal aberto.");
    } else {
        console.error("Modal não encontrado.");
    }
}
// Função para enviar os dados JSON para o backend
function sendJSONDataToBackend() {
    // Obtém o valor do input de data prevista
    var dateInput = document.getElementById('expectedDate');
    var dateValue = dateInput ? dateInput.value : '';

    // Verifica se o valor da data é válido
    if (dateValue.trim() === '') {
        // Exibe uma mensagem de erro e interrompe o processo de envio
        alert('Por favor, preencha a data prevista antes de enviar.');
        return;
    }

    let url = 'http://localhost:3000/compras';
    axios.post(url, jsonData, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(() => {
            console.log('Dados enviados com sucesso!');
        })
        .catch(error => {
            console.error('Erro ao enviar dados:', error);
        });
}

// Função para remover propriedades vazias de um objeto
function removeEmptyProperties(obj) {
    for (var prop in obj) {
        if (obj[prop] === '') {
            delete obj[prop];
        }
    }
    return obj;
}

// Função para renomear as propriedades do objeto quantidade qualidade onda e medida
function renameProperties(obj) {
    var newObj = {};
    newObj['numero_cliente'] = obj.cliente;
    newObj['quantidade_comprada'] = obj['quantidade_comprada']; // Renomeado de 'quant.' para 'quantidade'
    newObj['unidade'] = obj['unidade'];
    newObj['qualidade'] = obj['qualidade']; // Renomeado de 'qual.' para 'qualidade'
    newObj['onda'] = obj['onda'];
    newObj['gramatura'] = obj['gramatura'];
    newObj['peso_total'] = obj['peso_total']; // Renomeado de 'peso_lote_chapa' para 'peso_total'
    newObj['valor_unitario'] = obj['valor_kilo']; // Renomeado de 'coluna' para 'valor_kilo'
    newObj['valor_total'] = obj['valor_total']; // Renomeado de 'valor_lote_chapa' para 'valor_total'
    newObj['medida'] = obj['medida'];
    newObj['vincos'] = obj['vincos']; // Adiciona o campo 'vincos'
    newObj['status'] = "COMPRADO";
    return newObj;
}

function addRoundedBordersToTableRows() {
    var tableRows = document.querySelectorAll('#dataTable tbody tr');
    tableRows.forEach(function (row) {
        row.classList.add('rounded-rows'); // Adiciona a classe de bordas arredondadas a cada linha
    });
}

// Adiciona um evento de clique ao botão "Enviar"
var sendButton = document.getElementById('sendButton');
if (sendButton) {
    sendButton.addEventListener('click', sendJSONDataToBackend);
} else {
    console.error("Botão 'Enviar' não encontrado.");
}

// Adiciona um evento de clique ao botão "Editar"
var editButton = document.getElementById('editButton');
if (editButton) {
    editButton.addEventListener('click', function () {
        var jsonContent = document.getElementById('jsonContent');
        if (jsonContent) {
            // Exibe o conteúdo JSON formatado no elemento com id 'jsonContent'
            jsonContent.textContent = JSON.stringify(jsonData, null, 2);
            jsonContent.style.display = 'block'; // Exibe o elemento
        } else {
            console.error("Elemento 'jsonContent' não encontrado.");
        }
    });
} else {
    console.error("Botão 'Editar' não encontrado.");
}
