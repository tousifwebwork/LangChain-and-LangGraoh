require('dotenv').config();

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { StateGraph, MessagesAnnotation, END } = require('@langchain/langgraph');
const { ToolNode } = require('@langchain/langgraph/prebuilt');

const app = express();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Tools (empty for now, but wired correctly so you can add real tools later)
const tools = [];
const toolNode = new ToolNode(tools);

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  temperature: 0.5,
  apiKey: process.env.GEMINI_API_KEY, // langchain wrapper needs this passed explicitly
}).bindTools(tools);

const SYSTEM_PROMPT =
  'You are an AI assistant and your name is Jaris. If you are unable/dont know how to answer a question, please respond with "I am not sure about that."';

// Node: call the LLM with the running message history
const callLLM = async (state) => {
  console.log('--- Entered callLLM node ---');
  console.log('Incoming messages:', JSON.stringify(state.messages, null, 2));

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...state.messages];
  const response = await llm.invoke(messages);

  console.log('LLM response:', JSON.stringify(response, null, 2));
  return { messages: [response] };
};

// Conditional edge: go to Tools if the model requested a tool call, otherwise end
const shouldContinue = (state) => {
  const lastMessage = state.messages[state.messages.length - 1];
  console.log('--- shouldContinue check, tool_calls:', lastMessage.tool_calls);
  if (lastMessage.tool_calls?.length) {
    return 'Tools';
  }
  return END;
};

const graph = new StateGraph(MessagesAnnotation)
  .addNode('Agent', callLLM)
  .addNode('Tools', toolNode)
  .addEdge('__start__', 'Agent')
  .addConditionalEdges('Agent', shouldContinue, { Tools: 'Tools', [END]: END })
  .addEdge('Tools', 'Agent')
  .compile();

app.post('/generate', async (req, res) => {
  console.log('--- /generate hit, body:', req.body);
  const { prompt } = req.body;

  if (!prompt) {
    console.log('No prompt in request body — check Content-Type header on your client.');
    return res.status(400).json({ error: 'Missing "prompt" in request body.' });
  }

  try {
    const result = await graph.invoke({
      messages: [{ role: 'human', content: prompt }],
    });

    const lastMessage = result.messages[result.messages.length - 1];
    res.json({ text: lastMessage.content });
  } catch (error) {
    console.error('Graph error:', error);
    res.status(500).json({ error: 'An error occurred while generating content.' });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});