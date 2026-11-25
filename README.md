# Oficina Moura - Frontend

## Sobre o sistema

O Oficina Moura é um sistema para organização da rotina de uma oficina mecânica. Neste projeto, o frontend permite gerenciar veículos e ordens de serviço, mantendo os dados dos clientes e o acompanhamento dos atendimentos em uma interface web.

## Funcionalidades

- Cadastrar, listar, editar e excluir veículos;
- Cadastrar e listar ordens de serviço;
- Atualizar o status das ordens de serviço;
- Filtrar ordens de serviço pelo status;
- Consultar o histórico de serviços de um veículo.

A edição completa e a exclusão de ordens de serviço ainda não possuem ações na interface deste frontend.

## Tecnologias utilizadas

- React 19;
- Vite 8;
- JavaScript com módulos ES;
- CSS;
- API REST para comunicação com o backend.

## Links

- Aplicação em produção: https://oficina-mu-nine.vercel.app/
- Repositório: https://github.com/RuanUntaller/oficina
- Backend: https://oficina-servidor.onrender.com

## Fora do escopo

Nesta etapa do projeto, não estão incluídos recursos como login e autenticação de usuários nem controle de estoque de peças e produtos.

## Como executar localmente

Pré-requisitos: Node.js e npm.

1. Entre na pasta do projeto:

   ```bash
   cd oficina
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Abra no navegador o endereço mostrado pelo Vite.

Para gerar os arquivos da versão de produção:

```bash
npm run build
```

## Configuração do backend

O código utiliza diretamente a URL fixa `https://oficina-servidor.onrender.com` para acessar a API. Como a aplicação não usa `import.meta.env` ou outra variável de ambiente para essa configuração, não é necessária nenhuma variável de ambiente. Não crie ou informe `.env` com senhas ou chaves.
