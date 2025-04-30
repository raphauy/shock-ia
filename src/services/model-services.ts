import * as z from "zod"
import { prisma } from "@/lib/db"
import { ProviderDAO, getProviderDAO } from "./provider-services"
import OpenAI from "openai"
import { ElevenLabsClient } from "elevenlabs"
import { Readable, Writable } from "stream"
export type ModelDAO = {
	id: string
	name: string
	inputPrice: number
  outputPrice: number
	providerName: string
  streaming: boolean
  contextSize: number
	createdAt: Date
	updatedAt: Date
	provider: ProviderDAO
	providerId: string
}

export const modelSchema = z.object({
	name: z.string().min(1, "name is required."),
	inputPrice: z.string().refine((val) => !isNaN(Number(val)), { message: "(debe ser un número)" }).optional(),
  outputPrice: z.string().refine((val) => !isNaN(Number(val)), { message: "(debe ser un número)" }).optional(),
  streaming: z.boolean().default(false),
  contextSize: z.string().refine((val) => !isNaN(Number(val)), { message: "(debe ser un número)" }).optional(),
	providerId: z.string().min(1, "providerId is required."),
})

export type ModelFormValues = z.infer<typeof modelSchema>


export async function getModelsDAO() {
  const found = await prisma.model.findMany({
    orderBy: {
      providerName: 'desc'
    },    
  })
  return found as ModelDAO[]
}

export async function getSimilarModels(modelId: string) {
  const model= await getModelDAO(modelId)
  const providerId= model?.providerId
  const found = await prisma.model.findMany({
    where: {
      providerId
    },
    orderBy: {
      providerName: 'desc'
    },    
  })
  return found as ModelDAO[]
}

export async function getModelDAO(id: string) {
  const found = await prisma.model.findUnique({
    where: {
      id
    },
  })
  return found as ModelDAO
}
    
export async function createModel(data: ModelFormValues) {
  const provider= await getProviderDAO(data.providerId)
  if (!provider) throw new Error("Provider not found")
  const providerName= provider.name
  const inputPrice = data.inputPrice ? Number(data.inputPrice) : 0
  const outputPrice = data.outputPrice ? Number(data.outputPrice) : 0
  const contextSize = data.contextSize ? Number(data.contextSize) : 0
  const created = await prisma.model.create({
    data: {
      ...data,
      providerName,
      inputPrice,
      outputPrice,
      contextSize
    }
  })
  return created
}

export async function updateModel(id: string, data: ModelFormValues) {
  const provider= await getProviderDAO(data.providerId)
  if (!provider) throw new Error("Provider not found")
  const providerName= provider.name
  const inputPrice = data.inputPrice ? Number(data.inputPrice) : 0
  const outputPrice = data.outputPrice ? Number(data.outputPrice) : 0
  const contextSize = data.contextSize ? Number(data.contextSize) : 0
  const updated = await prisma.model.update({
    where: {
      id
    },
    data: {
      ...data,
      providerName,
      inputPrice,
      outputPrice,
      contextSize
    }
  })
  return updated
}

export async function deleteModel(id: string) {
  const deleted = await prisma.model.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullModelsDAO() {
  const found = await prisma.model.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
			provider: true,
		}
  })
  return found as ModelDAO[]
}
  
export async function getFullModelDAO(id: string) {
  const found = await prisma.model.findUnique({
    where: {
      id
    },
    include: {
			provider: true,
		}
  })
  return found as ModelDAO
}

export async function getFullModelDAOByName(name: string) {
  
  const found = await prisma.model.findFirst({
    where: {
      name
    },
    include: {
			provider: true,
		}
  })
  return found as ModelDAO
}

export async function generateAudioFromOpenAI(text: string, voice: string): Promise<string> {
  console.log("generating audio")
  console.log("text: ", text)
  const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
  })
  const response = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      input: text,
      // @ts-ignore
      voice: voice
  })

  // return the base64 of the audio
  const audioBuffer= await response.arrayBuffer()
  const audioBase64= Buffer.from(audioBuffer).toString('base64')
  return audioBase64
}

export async function generateAudioFromElevenLabs(text: string, voice: string): Promise<string> {
  const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  const audio: Readable = await elevenlabs.generate({
    voice,
    text: text,
    model_id: "eleven_multilingual_v2",
    output_format: "mp3_44100_128"
  })

  const chunks: Buffer[] = [];

  for await (const chunk of audio) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  // @ts-ignore
  const audioBuffer = Buffer.concat(chunks);
  const audioBase64 = audioBuffer.toString('base64');

  return audioBase64;
}