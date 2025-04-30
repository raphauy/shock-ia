import { ElevenLabsClient } from 'elevenlabs';
import fs from 'fs';
import { config } from "dotenv"
import { generateAudioFromElevenLabs } from '@/services/model-services';
config()

async function main() {
    console.log("main init")

    const elevenlabs = new ElevenLabsClient({
        apiKey: process.env.ELEVENLABS_API_KEY,
    });

    const text= "Hola, ¿cómo estás? Esto es una prueba de audio con ElevenLabs, para ver si funciona correctamente. Estoy con Gabi Zimmer que es una persona muy especial para mi."

    const audioBase64 = await generateAudioFromElevenLabs(text)
    console.log("audioBase64: ", audioBase64)

    const audioBuffer = Buffer.from(audioBase64, 'base64')
    
    // Ignorar error de tipo ya que Buffer funciona correctamente con fs.writeFileSync
    // @ts-ignore
    fs.writeFileSync('audio.mp3', audioBuffer)
    
    console.log("Audio guardado correctamente en audio.mp3");
}

main()