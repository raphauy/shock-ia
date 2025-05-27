import OpenAI from "openai";


export async function transcribeAudio(audioUrl: string): Promise<string> {
    console.log("transcribing audio")
    console.log("audioUrl: ", audioUrl)
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
    })
    
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const file = new File([arrayBuffer], 'audio.oga', { type: 'audio/ogg' });

    const transcription = await client.audio.transcriptions.create({
        model: "whisper-1",
        file: file,
        language: "es"
    })
    return transcription.text
}

