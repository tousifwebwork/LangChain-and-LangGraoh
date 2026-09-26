

const { StateSchema, MessagesValue, StateGraph, START, END } = require('@langchain/langgraph');
const express = require('express');

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.send('Email Agent is running!');
});


const State = new StateSchema({
  messages: MessagesValue,
});

let index=0;

const calltoAgent = (state) => {
   const texts = [
    "Hello from the agent!",
    "LangGraph is running!",
    "Random message generated!",
    "Agent is working...",
    "Keep coding!",
  ];
  const response  = texts[index];
  index++;
  if (index >= texts.length) {
    index = 0; 
  }
  return { messages: [{ role: "ai", content: response }] };
};

const graph = new StateGraph(State)
.addNode("calltoAgent", calltoAgent)
.addEdge(START, "calltoAgent")
.addEdge("calltoAgent", END)
.compile();



app.listen(PORT, () => {
  console.log(`Email Agent is running on http://localhost:${PORT}`);
    setInterval(async () => {
     const res = await graph.invoke({messages: []});
     console.log("Agent:", res.messages[0].content);
    }, 2000);
});