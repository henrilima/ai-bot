export function splitMessageWithMarkdown(message: any) {
    const parts: Array<any> = [];

    // Remove todos os emojis da mensagem antes de processá-la
    const messageWithoutEmojis = message.replace(
        /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F18E}]|[\u{1F191}-\u{1F19A}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{23F0}]|[\u{23F3}]|[\u{23E9}-\u{23EF}]|[\u{25B6}]|[\u{25C0}]|[\u{1F1E6}-\u{1F1FF}])/gu,
        ""
    );

    const regex = /(```[\s\S]*?```)/g;
    let lastIndex = 0;

    messageWithoutEmojis.replace(
        regex,
        (match: any, codeBlock: string, index: number) => {
            if (index > lastIndex) {
                splitLargeText(
                    parts,
                    messageWithoutEmojis.slice(lastIndex, index),
                    "text"
                );
            }

            // Mantém o bloco de código intacto
            parts.push({ type: "code", content: codeBlock });
            lastIndex = index + codeBlock.length;
        }
    );

    if (lastIndex < messageWithoutEmojis.length) {
        splitLargeText(parts, messageWithoutEmojis.slice(lastIndex), "text");
    }

    return parts;
}

// Função auxiliar para dividir apenas o texto, sem dividir blocos de código
const splitLargeText = (parts: any[], content: string, type: string) => {
    const chunkSize = 1920;
    let currentChunk = "";

    // Preserva as quebras de linha e formatação Markdown
    const lines = content.split(/\n/); // Divide o conteúdo em linhas

    for (const line of lines) {
        const words = line.split(/\s+/); // Divide a linha em palavras

        for (const word of words) {
            // Verifica se o chunk atual mais a nova palavra excede o limite
            if (currentChunk.length + word.length + 1 > chunkSize) {
                // Adiciona o chunk atual à lista de partes
                if (currentChunk.trim()) {
                    parts.push({
                        type: type,
                        content: currentChunk.trim(),
                    });
                }
                currentChunk = word; // Inicia um novo chunk com a palavra atual
            } else {
                // Adiciona a palavra ao chunk atual
                currentChunk += (currentChunk ? " " : "") + word; // Adiciona espaço se não for a primeira palavra
            }
        }

        // Adiciona uma quebra de linha após cada linha, se não for a última linha
        if (currentChunk.length + 1 <= chunkSize) {
            currentChunk += "\n"; // Mantém a quebra de linha
        }
    }

    // Adiciona o último chunk se não estiver vazio
    if (currentChunk) {
        parts.push({
            type: type,
            content: currentChunk.trim(),
        });
    }
};
