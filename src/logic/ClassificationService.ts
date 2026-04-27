export type Priority = 'important' | 'unimportant';

/*import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";

// model setup
const apiKey: string = "AIzaSyDSY87OQyS2t8XetjMWphADkY3ejcl2RW8";
const genAI: GoogleGenerativeAI = new GoogleGenerativeAI(apiKey);
const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });*/
// import Groq from "groq-sdk";
// const client = new Groq({ apiKey: "", dangerouslyAllowBrowser: true });
// NEED TO FILL IN IF TESTING
const apiKey: string =  "APIKEY";

export async function classifyNotification(
  _source: string,
  _title: string,
  _content: string,
): Promise<Priority> {
  /*
  const result = await model.generateContent(
      `From this notification information, tell me whether this notification is urgent or no.
      Classify a notification as an urgency if it's an emergency of any type, or anything time sensitive.
      Output one word; if urgent, 'important', otherwise, 'unimportant'. Here's the notification,
       ${_source} ${_title}  ${_content}`);*/
    const result = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: `From this notification information, tell me whether this notification is urgent or no.
      Classify a notification as an urgency if it's an emergency of any type, or anything time sensitive.
      Output one word; if urgent, 'important', otherwise, 'unimportant'. Here's the notification,
      ${_source} ${_title}  ${_content}`}],
    }),
  });

  const data = await result.json();
  const text = data.choices[0].message.content.trim().toLowerCase();
  // parse llm reply
  //const text = result.response.text().trim().toLowerCase();
  //const text = result.choices[0].message.content.trim().toLowerCase();
  if (text === 'important' || text === 'unimportant') {
    return text;
  }
  // default if needed
  return 'important';
}
