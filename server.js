require('dotenv').config();

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai'); 

const app = express();

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY,});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  temperature: 0.5,
  apiKey: process.env.GEMINI_API_KEY,  
});



app.get('/', (req, res) => {
  res.send('Hello, World!');
});
 
app.post('/generate', async (req, res) => {
  
  const { prompt } = req.body; 

  try { 
    const response = await llm.invoke([
        {
            role: 'system', 
            content: 'you are an AI assistant and your name is Jaris. If you are unable/dont know how to answer a question, please respond with "I am not sure about that."', 
            role: 'user', 
            content: prompt 
        }
    ]); 
    res.json({ "ai: ": response.content });
  } catch (error) {
    console.error('Graph error:', error);
    res.status(500).json({ error: 'An error occurred while generating content.' });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`); 
});