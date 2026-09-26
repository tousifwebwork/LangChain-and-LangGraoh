require("dotenv").config();

const express = require("express");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const {END,START,StateGraph,StateSchema,MessagesValue,} = require("@langchain/langgraph");

const app = express();
const PORT = 3000;

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  maxRetries: 2, 
});

const State = new StateSchema({messages: MessagesValue,});

const callLLM = async (state) => {
  const response = await llm.invoke(state.messages);
  return {messages: [response],};
};

const graph = new StateGraph(State)
.addNode("llm", callLLM)
.addEdge(START, "llm")
.addEdge("llm", END)
.compile();

app.get("/", (req, res) => {
  res.send("AI Agent is running!");
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  const result = await graph.invoke({
    messages: [
      {
        role: "user",
        content: "What is today's date?",
      },
    ],
  });

  console.log("AI:", result.messages.at(-1).content);
});