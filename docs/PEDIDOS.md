# Pedidos realizados ao Copilot

## Frontend - Conexão com o backend

**Arquivo:** `src/App.jsx`

**Pedido aprovado:**

Contexto: Estamos na pasta oficina, arquivo src/App.jsx, branch setup/conexao-backend.

Tarefa: Substitua o conteúdo inicial do App.jsx por um componente React simples que faça uma requisição GET (usando fetch e useEffect) para a URL do backend no Render (https://oficina-servidor.onrender.com). Exiba na tela a mensagem retornada pelo servidor (por exemplo, "Backend está no ar"). Trate estados de carregamento e erro na tela.

**Restrições:**
- Não criar novos arquivos ou pastas sem permissão.
- Não instalar novos pacotes.
- Não usar bibliotecas externas como Axios.

**Resultado:** O frontend consulta o backend no Render e exibe a mensagem de status na tela.





# feat/veiculos-frontend 24/11
Contexto

O projeto Oficina Moura possui frontend em React/Vite. O backend de veículos está concluído, publicado e funcionando em:

https://oficina-servidor.onrender.com

A API disponibiliza as rotas GET, POST, PUT e DELETE /veiculos.

Cada veículo possui os campos:
- placa
- modelo
- nome_dono
- telefone_dono
Todos são obrigatórios.

Tarefa

Implementar a interface de gerenciamento de veículos, permitindo:
- Cadastrar veículos.
- Listar veículos cadastrados.
- Editar veículos existentes.
- Excluir veículos.
Integrar as operações com as rotas disponíveis no backend.

Restrições
- Primeiro, analise a estrutura atual do projeto.
- Siga os padrões e convenções já existentes.
- Não altere o backend.
- Não instale bibliotecas ou frameworks desnecessários.
- Não modifique arquivos fora do escopo da tarefa.
- Utilize exatamente os nomes dos campos definidos pela API.
- Trate erros retornados pelo backend.
- Antes de modificar arquivos, apresente um plano de implementação para revisão.
Pronto quando
- For possível cadastrar, listar, editar e excluir veículos pela interface.
- Os quatro campos obrigatórios forem validados.
- Ao tentar salvar o formulário com algum campo obrigatório vazio, a interface deve impedir o envio e informar visualmente qual campo precisa ser preenchido.
- Antes de excluir um veículo, a interface deve exibir uma confirmação, permitindo cancelar ou confirmar a exclusão. A requisição DELETE só deve ser enviada após a confirmação.
- As operações estiverem integradas à API pública.
- Os erros retornados pelo backend forem tratados adequadamente.
- Não houver erros no console do navegador.

# feat/veiculos-frontend  24/11
Revise o src/index.css. Você adicionou novas regras globais ao final do arquivo, duplicando definições existentes de :root, body, #root, h1 e h2.

Organize o arquivo para evitar duplicações, mantendo as configurações necessárias para a nova interface. Preserve o visual atual, a responsividade e as demais funcionalidades. Não altere outros arquivos.

Depois, mostre o diff para revisão. Não faça commit.