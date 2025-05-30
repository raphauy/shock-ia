// import { OpenAIApi, Configuration } from "openai-edge";

// export const maxDuration = 59
// export const dynamic = 'force-dynamic'

// const config = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
// });

// const openai = new OpenAIApi(config);

// export async function POST(req: Request): Promise<Response> {
//   // Check if the OPENAI_API_KEY is set, if not return 400
//   if (!process.env.OPENAI_API_KEY_FOR_EMBEDDINGS || process.env.OPENAI_API_KEY_FOR_EMBEDDINGS === "") {
//     return new Response(
//       "Missing OPENAI_API_KEY – make sure to add it to your .env file.",
//       {
//         status: 400,
//       },
//     );
//   }

//   let { prompt } = await req.json();

//   const response = await openai.createChatCompletion({
//     model: "gpt-4-turbo",
//     messages: [
//       {
//         role: "system",
//         content:
//           "Eres un asistente de escritura de IA que continúa el texto existente basándose en el contexto del texto anterior. " +
//           "Dar más peso/prioridad a los últimos caracteres que a los iniciales. " +
//           "Limita tu respuesta a no más de 200 caracteres, pero asegúrese de construir oraciones completas.",
//         // we're disabling markdown for now until we can figure out a way to stream markdown text with proper formatting: https://github.com/steven-tey/novel/discussions/7
//         // "Use Markdown formatting when appropriate.",
//       },
//       {
//         role: "user",
//         content: prompt,
//       },
//     ],
//     temperature: 0.7,
//     top_p: 1,
//     frequency_penalty: 0,
//     presence_penalty: 0,
//     stream: true,
//     n: 1,
//   });

//   // Convert the response into a friendly text-stream
//   const stream = OpenAIStream(response);

//   // Respond with the stream
//   return new StreamingTextResponse(stream);
// }

export async function POST(req: Request): Promise<Response> {
  console.log("generate")
  return new Response("Hello, world!", { status: 200 });
}