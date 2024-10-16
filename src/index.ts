import dotenv from "dotenv";
dotenv.config();

// Importando as dependências do projeto
import {
    Client,
    GatewayIntentBits,
    ActivityType,
    ChannelType,
    EmbedBuilder,
} from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { splitMessageWithMarkdown } from "./functions";
import { ref, push, get, update, child, set } from "firebase/database";

import { database } from "./firebase";
import { inspect } from "util";
import fs from "fs";

// Importando as configurações do projeto
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

// Configurações do GEMINI API (API de inteligência artificial)
const GEMINI: any = process.env.GEMINI_API;
const genAI = new GoogleGenerativeAI(GEMINI);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: config.instructions,
});

// Criando um cliente para o bot através da dependência do Discord.js
const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Atividade do bot, alternando entre "Buscando dados..." e "Disponível para conversa."
const activities = [
    { name: "Buscando dados...", type: ActivityType.Watching },
    { name: "Disponível para conversa.", type: ActivityType.Watching },
];
let activityIndex = 0;

// Evento de logon do bot
bot.on("ready", () => {
    console.log(`Logged in as ${bot.user?.username}!`);

    // Configura a atividade do bot no Discord.js
    bot.user?.setPresence({
        activities: [activities[activityIndex]],
        status: "online",
    });

    // Atualiza a lista de atividades do bot a cada 30 segundos
    setInterval(() => {
        activityIndex = (activityIndex + 1) % activities.length;
        bot.user?.setPresence({
            activities: [activities[activityIndex]],
            status: "online",
        });
    }, 30000);
});

// Evento de recebimento de uma nova mensagem
bot.on("messageCreate", async (message) => {
    const messageContent = message.content;
    // Pegando todos os argumentos da mensagem, removendo o prefixo
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);

    // Pega o primeiro argumento da lista de argumentos (o comando)
    const command = args.shift()?.toLowerCase();

    // Retornando nada quando o autor da mensagem for o próprio bot
    if (message.author.id === bot.user?.id) return;
    // Retornando nada caso o autor da mensagem for um bot
    if (message.author.bot) return;

    // Criando comando de ajuda
    if (command === "help" || command === "ajuda") {
        const embed = new EmbedBuilder()
            .setColor("#2f3135")
            .setTitle("Olá!")
            .setDescription(
                "**Sou uma assistente virtual, desenvolvida para te auxiliar no Discord. Você pode me usar para diversas tarefas, como encontrar informações, obter suporte e até mesmo para conversar. Abaixo segue a minha lista de comandos.**"
            )
            .setFooter({
                text: `Solicite ajuda ou reporte bugs pelo github do projeto. (github.com/henrilima/ai-bot)`,
            })
            .addFields(
                {
                    name: `${config.prefix}data`,
                    value: "Cadastra dados pessoais para serem usados no bot.",
                },
                {
                    name: `${config.prefix}clear-data`,
                    value: "Remove os dados pessoais salvos no banco de dados do bot.",
                },
                {
                    name: `${config.prefix}clear-chat`,
                    value: "Limpa o histórico de mensagens do chat do bot.",
                },
                {
                    name: `${config.prefix}help`,
                    value: "Mostra este bloco de ajuda.",
                },
                {
                    name: `${config.prefix}clean [quant. de mensagens]`,
                    value: "Apaga uma certa quantidade de mensagens do canal. Precisa de permissão de gerenciar mensagens.",
                }
            );

        message.channel.send({ embeds: [embed] });
    }

    // Criando comando de eval
    if (command === "eval") {
        if (message.channel?.type === ChannelType.GuildText) {
            // Verifica se o autor da mensagem é o dono do bot
            if (message.author.id === process.env.OWNER) {
                try {
                    const code = message.content.split(" ").slice(1).join(" ");
                    const evaled = eval(code);

                    if (typeof evaled !== "string") {
                        message.channel.send(
                            `\`\`\`js\n${inspect(evaled, { depth: 0 })}\`\`\``
                        );
                    } else {
                        message.channel.send(`\`\`\`js\n${evaled}\`\`\``);
                    }
                } catch (error) {
                    message.channel.send(`\`\`\`js\n${error}\`\`\``);
                }
            } else {
                message.channel.send(
                    "Você não tem permissão para usar este comando."
                );
            }
        }
    }

    // Criando o comando de salvar dados do usuário
    if (command === "data") {
        const dataRef = ref(database, "users/" + message.author?.id);
        const snapshot = await get(dataRef);
        const content = args.join(" ");

        if (!args[0]) {
            let messageToSend =
                "Para cadastrar instruções pessoais, insira argumentos no comando. Como: `!data Meu apelido é Henri.`";
            if (snapshot.val().content) {
                messageToSend += `\n\nAtualmente, você possui as seguintes instruções de usuário: \`${
                    snapshot.val().content
                }\``;
            }

            return message.reply(messageToSend);
        }

        // Caso o snapshot exista, atualiza as instruções
        // Caso o snapshot não exista, cria um novo registro
        update(dataRef, { author: message.author.username, content });
        return message.reply(
            "Os seus dados e instruções de usuários foram cadastrados."
        );
    }

    if (command === "clear-data") {
        const dataRef = ref(database, "users/" + message.author?.id);

        update(dataRef, {
            author: null,
            content: null,
        });

        return message.reply("Todas os seus dados foram excluídos.");
    }

    // Criando o comando de remover o histórico de mensagens do usuário
    if (command === "clear-chat") {
        if (message.channel?.type === ChannelType.GuildText) {
            const dataRef = ref(database, "users/" + message.author?.id);
            const history = await get(child(dataRef, "/history"));

            if (history.exists()) {
                const allHistory = history.val() || {};
                if (Object.keys(allHistory).length > 0) {
                    set(child(dataRef, "/history"), []);
                    return message.reply(
                        "Todas as mensagens do histórico foram excluídas."
                    );
                } else {
                    return message.reply(
                        "O seu histórico não possui nenhuma mensagem."
                    );
                }
            } else {
                return message.reply(
                    "Você não possui mensagens armazenadas no histórico."
                );
            }
        }
    }

    // Criando o comando de limpar mensagens do chat
    if (command === "clean" || command === "clear") {
        if (message.channel?.type === ChannelType.GuildText) {
            if (!message.member?.permissions.has("ManageMessages")) {
                message.reply(
                    "Você não possui permissão para limpar mensagens."
                );
                return;
            }

            let messages = Number(args[0]);
            if (!messages || messages < 1 || messages > 100) {
                message.reply(
                    "Por favor, forneça um número entre 1 e 100 para limpar as mensagens."
                );
                return;
            }

            const messagesToDelete = await message.channel.messages.fetch({
                limit: messages,
            });
            await message.channel.bulkDelete(messagesToDelete, true);

            message.channel.send(`Mensagens limpas!`).then((msg) => {
                setTimeout(() => msg.delete(), 2000);
            });
        }
    }

    // Verificando se o canal que foi enviada a mensagem é o canal permitido para o bot falar
    if (String(message.channel.id) !== process.env.CHAT) return;

    if (message.attachments.size > 0) {
        console.log("A mensagem contém mídia. Não vou responder.");
        return;
    }

    // Bloqueando o bot responder a mensagens que comecem com símbolos ou caracteres especiais
    const keys = /[^\w\s]/g;
    const isKeyStart = keys.test(messageContent.charAt(0));
    if (isKeyStart) return;

    // Inicializando o modelo do chatbot
    try {
        const dataRef = ref(database, "users/" + message.author?.id);
        const snapshot = await get(dataRef);
        const userData: string =
            snapshot.val()?.content || "Este usuário não tem dados.";

        const history = await get(child(dataRef, "/history"));
        const allHistory = history.val() || {};
        const historyData = [];
        var userLimit = 0;

        // Adicionando as mensagens do histórico ao chatbot
        if (Object.keys(allHistory).length > 0) {
            for (let i of Object.keys(allHistory)) {
                historyData.push(allHistory[i]);

                if (allHistory[i].role === "user") {
                    userLimit += 1;
                }
            }
        }

        const userChat = model.startChat({
            history: historyData,
        });

        // Verificando se o limite de histórico de perguntas foi ultrapassado
        if (userLimit + 1 > 25) {
            return message.reply(
                `Você excedeu o limite do histórico de mensagens **(25 perguntas)**. Para continuar usando o bot limpe o seu chat com o comando **\`${config.prefix}clear-chat\`** (Isso irá apagar todos os dados enviados no chat, mas não inclui os salvos pelo comando **\`${config.prefix}data\`**).`
            );
        }

        // Enviando a mensagem do usuário ao chatbot e salvando no histórico
        const userInput =
            "Dados PESSOAIS do usuário (Só use quando necessário): " +
            userData +
            " :: Pergunta do usuário (O que você deve responder): " +
            messageContent;

        const result = await userChat.sendMessage(userInput);
        const messageResponse = result.response.text();

        // Salvando a resposta do chatbot no histórico do usuário
        push(child(dataRef, "history"), {
            role: "user",
            parts: [{ text: messageContent }],
        });

        const parts = splitMessageWithMarkdown(messageResponse);

        // Enviando as respostas do chatbot ao canal
        for (const part of parts) {
            // Salvando a resposta do chatbot no histórico do bot
            push(child(dataRef, "history"), {
                role: "model",
                parts: [{ text: part.content }],
            });
            message.channel.send(part);
        }
    } catch (e) {
        console.error("Failed to generate content:", e);
        message.reply(
            "Ocorreu um erro ao gerar uma resposta, peço perdão por isso."
        );
    }
});

// Iniciando o bot
bot.login(process.env.TOKEN);
