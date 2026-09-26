require('dotenv').config();

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');  
const { Annotation } = require('@langchain/langgraph');

const app = express();

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY,});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  temperature: 0.5,
  apiKey: process.env.GEMINI_API_KEY,  
});


const State = Annotation.Root({
    prompt: Annotation,
    AImsg: Annotation,
})

const callLLM = asycn (state) => {  
    console.log("styate : ",state);
    const response = await llm.invoke([
        {
            role: 'system', 
            content: 'you are an AI assistant and your name is Jaris. If you are unable/dont know how to answer a question, please respond with "I am not sure about that."', 
            role: 'user', 
            content: state.prompt 
        }
    ]);  
    return { AImsg: response.content};
}

const graph = new State.Graph(State)
.addNode("agent",callLLM)
.addEdge("__state__")





app.get('/', (req, res) => {
  res.send('Hello, World!');
});
 
app.post('/generate', async (req, res) => {
  
  const { input } = req.body; 
  
 res.json({ response: response[0].content });

});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`); 
});