// Adiciona um evento ao formulário para capturar o evento "submit"
document.getElementById('form').addEventListener('submit', (e) => {
    e.preventDefault(); // Previne o comportamento padrão de recarregar a página ao enviar o formulário

    // Captura e limpa os valores inseridos pelo usuário nos campos do formulário
    const name = document.getElementById('name').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const description = document.getElementById('description').value.trim();
    const status = document.getElementById('status').value; // Captura o status selecionado

    // Valida o CPF usando uma função auxiliar
    if (!validateCPF(cpf)) {
        alert('CPF inválido! Certifique-se de inserir apenas 11 dígitos numéricos.');
        return; // Interrompe o processo caso o CPF seja inválido
    }

    // Cria um objeto com os dados da ficha para envio ao backend
    const ficha = { name, cpf, description, status };

    // Faz uma requisição POST para o servidor, enviando a ficha como JSON
    fetch('/api/fichas', {
        method: 'POST', // Método HTTP para criar uma nova ficha
        headers: {
            'Content-Type': 'application/json', // Define o tipo de conteúdo como JSON
        },
        body: JSON.stringify(ficha), // Converte o objeto da ficha para uma string JSON
    })
        .then((response) => response.json()) // Converte a resposta do backend em um objeto JSON
        .then((data) => {
            if (Array.isArray(data)) {
                data.forEach((ficha) => addFichaToContainer(ficha));
            } else {
                addFichaToContainer(data); // Adiciona a ficha recém-criada ao container correspondente
            }
        })
        .catch((err) => console.error(err)); // Lida com erros caso a requisição falhe

    e.target.reset(); // Reseta o formulário após o envio
});

// Função para validar o CPF
function validateCPF(cpf) {
    const cpfPattern = /^\d{11}$/; // Define um padrão: apenas 11 dígitos numéricos
    return cpfPattern.test(cpf); // Retorna true se o CPF for válido, false caso contrário
}

// Função para adicionar uma ficha ao container baseado no status
function addFichaToContainer(ficha) {
    const container = document.getElementById(ficha.status); // Seleciona o container pelo status
    if (!container) {
        console.error(`Container com o status "${ficha.status}" não encontrado.`);
        return;
    }
    const div = document.createElement('div'); // Cria uma nova div para a ficha
    div.classList.add('ficha'); // Adiciona a classe "ficha" à div
    div.innerHTML = `
        <div><strong>ID:</strong> ${ficha.id}</div>
        <div><strong>Nome:</strong> ${ficha.name}</div>
        <div><strong>CPF:</strong> ${ficha.cpf}</div>
        <div><strong>Descrição:</strong> ${ficha.description}</div>
        <button style="margin-right: 10px;" onclick="deleteFicha(${ficha.id})">Deletar</button>
        <button style="background-color: #4CAF50; color: white; border: none; padding: 5px 10px; cursor: pointer;" onclick="updateFicha(${ficha.id})">Atualizar Status</button>
    `;
    div.setAttribute('data-id', ficha.id); // Define um atributo com o ID para identificar a div
    container.appendChild(div); // Adiciona a div ao container correspondente
}

// Recarrega as fichas do servidor e as exibe ao carregar a página
window.onload = () => {
    fetch('/api/fichas') // Faz uma requisição GET para listar as fichas
        .then((response) => response.json()) // Converte a resposta em JSON
        .then((fichas) => {
            fichas.forEach((ficha) => addFichaToContainer(ficha)); // Adiciona cada ficha ao container correspondente
        })
        .catch((err) => console.error(err)); // Lida com erros caso a requisição falhe
};

// Função para deletar uma ficha com base no ID
function deleteFicha(id) {
    const confirmDelete = confirm("Você tem certeza que deseja excluir esta ficha?"); // Confirmação antes de excluir

    if (confirmDelete) {
        fetch('/api/fichas', {
            method: 'DELETE', // Método HTTP para deletar a ficha
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: [id] }), // Passando o ID como um array
        })
            .then(() => {
                // Remove a ficha do container na interface
                const fichaDiv = document.querySelector(`.ficha[data-id="${id}"]`);
                if (fichaDiv) {
                    fichaDiv.remove(); // Remove a div correspondente da página
                }
            })
            .catch((err) => console.error(err)); // Lida com erros caso a requisição falhe
    }
}

// Função para atualizar o status de uma ficha com base no ID
function updateFicha(id) {
    const newStatus = prompt("Digite o novo status (Lead, Aguardando, Atendimento, Concluído, Insucesso):");
    if (!newStatus) {
        alert("Status não pode estar vazio.");
        return;
    }

    fetch(`/api/fichas/${id}`, {
        method: 'PUT', // Método HTTP para atualizar a ficha
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
    })
        .then((response) => response.json())
        .then((updatedFicha) => {
            // Remove a ficha da interface antiga
            const fichaDiv = document.querySelector(`.ficha[data-id="${id}"]`);
            if (fichaDiv) {
                fichaDiv.remove();
            }
            // Adiciona ao novo container baseado no status atualizado
            addFichaToContainer(updatedFicha);
        })
        .catch((err) => console.error(err));
}
