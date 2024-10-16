# Discord Bot com Google Gemini
Este é um bot para Discord desenvolvido em TypeScript que utiliza a inteligência artificial Google Gemini para responder a mensagens. O bot também utiliza o Firebase Realtime Database para armazenar dados, proporcionando um armazenamento em tempo real e sincronizado. A configuração do Firebase é fácil e flexível, permitindo que você personalize o comportamento do bot.

> A maneira como o usuário utiliza a API do **Google Gemini** no seu projeto é de **total responsabilidade dele**.

## Funcionalidades
- Respostas automáticas a mensagens utilizando a API do Google Gemini.
- Armazenamento de dados em tempo real usando o Firebase Realtime Database.
- Prefixo de comando personalizável para interações no Discord.
- Instruções personalizadas para modificar o comportamento do bot.

## Instalação
### Pré-requisitos
- Node.js instalado (v14 ou superior)
- Yarn como gerenciador de pacotes
- Conta de desenvolvedor do Discord para criar e gerenciar o bot
- Chave de API do Google Gemini
- Projeto no Firebase para usar o Realtime Database

### Passo a passo
1. Clone este repositório:
   ```git clone https://github.com/henrilima/ai-bot.git```

2. Acesse o diretório do projeto:
   ```cd ai-bot```

3. Instale as dependências:

   ```yarn install```

4. Renomeie o arquivo `.env.example` para `.env` e preencha os seguintes valores:

    ```
    TOKEN=seu-token-do-discord
    GEMINI_API=sua-chave-api-gemini
    OWNER=id-do-dono-do-bot
    CHAT=id-do-chat-do-discord
    ```

5. Configure o Firebase Realtime Database. Crie um arquivo `firebase.ts` na raiz do projeto e adicione o seguinte código com as credenciais do Firebase:

   ```
   import { initializeApp } from "firebase/app";
   import { getDatabase } from "firebase/database";

   const firebaseConfig = {
     apiKey: "sua-api-key",
     authDomain: "seu-auth-domain",
     databaseURL: "sua-database-url",
     projectId: "seu-project-id",
     storageBucket: "seu-storage-bucket",
     messagingSenderId: "seu-messaging-sender-id",
     appId: "seu-app-id"
   };

   const app = initializeApp(firebaseConfig);
   const database = getDatabase(app);

   export { database };
    ```

    Certifique-se de obter as informações de configuração do seu projeto no [console do Firebase](https://console.firebase.google.com/).

6. Configure o prefixo, comandos e as instruções personalizadas no arquivo `config.json`:
    ```
    {
        "prefix": "!",
        "instructions": "Instruções personalizadas para o comportamento do bot"
    }
    ```

7. Execute o bot:

    ```
    yarn start
    ```

## Como Funciona
O bot utiliza o prefixo configurado no arquivo `config.json` para detectar comandos no servidor do Discord. Ele responde automaticamente às mensagens enviadas no chat configurado (usando o ID fornecido no arquivo `.env`) através da API do Google Gemini. Os dados e interações também podem ser armazenados e sincronizados usando o Firebase Realtime Database.

## Arquivo `.env`
- ``TOKEN``: O token do bot do Discord.
- ``GEMINI_API``: A chave da API Google Gemini.
- ``OWNER``: O ID do dono do bot no Discord.
- ``CHAT``: O ID do chat onde o bot vai interagir.

## Arquivo `config.json`
- ``prefix``: O prefixo dos comandos do bot (por padrão, `!`).
- ``instructions``: Instruções personalizadas para o comportamento do bot.

## Contribuição
Se você quiser contribuir com o projeto, sinta-se à vontade para abrir uma _issue_ ou enviar um _pull request_.

## Licença
Este projeto está licenciado sob a [Apache License 2.0](LICENSE).