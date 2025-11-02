
import { GoogleGenAI, Type } from "@google/genai";
import type { Page } from '../types';

// Assume process.env.API_KEY is configured in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Please set process.env.API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const model = "gemini-2.5-flash";

export const analyzeMedicineImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    };

    const textPart = {
      text: `You are an AI assistant for the HealthMate application. Your task is to analyze an image of a medicine strip and provide a helpful summary for a non-medical user.

**Instructions:**
1. First, determine if the image is actually of a medicine strip or packaging.
    * If it is NOT a medicine, respond ONLY with: "This does not appear to be a medicine. Please upload a clear image of a medicine strip or box."
2. If it IS a medicine, identify it and provide a detailed, easy-to-understand summary.
3. Format the response using Markdown with the following sections exactly:
    - **Medicine Name**: The identified name of the medicine.
    - **Main Purpose**: What this medicine is typically used for.
    - **Common Dosage**: A general, typical dosage.
    - **Potential Side Effects**: List 2-3 common side effects.
    - **Common Drug Interactions**: List 2-3 common drugs or substances it might interact with.
    - **Expiry Date**: If visible on the packaging, state the expiry date. If not visible, state "Not visible in the image."
4. If any piece of information cannot be determined, state that clearly under the relevant heading.
5. **Crucially, end your response with the following disclaimer in bold:**
    **Disclaimer: This information is AI-generated and for informational purposes only. It is not a substitute for professional medical advice. Always consult with a qualified healthcare provider before taking any medication.**`,
    };

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing medicine image:", error);
    return "Sorry, I couldn't analyze the image. Please try again.";
  }
};

export const summarizeMedicalReport = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    };

    const textPart = {
      text: `From this image of a medical report, extract and summarize the key information. 
        Format the response using Markdown for clarity, with the following sections:
        - **Report Type**: What kind of report is this (e.g., Blood Test, MRI Scan)?
        - **Key Findings**: List the most important results or observations.
        - **Vitals Summary**: Summarize any vital signs mentioned.
        - **Potential Concerns**: Highlight any results that are outside the normal range or might require follow-up.

        Make the language simple and easy for a non-medical person to understand. If the image does not appear to be a medical report, respond with "This does not seem to be a medical report. Please upload a clear image of a report."
        
        Finally, add this disclaimer at the end: **Disclaimer: This is an AI-generated summary and is not a substitute for professional medical advice. Consult with your doctor to understand the full report.**`,
    };

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  } catch (error) {
    console.error("Error summarizing medical report:", error);
    return "Sorry, I couldn't summarize the report. Please try again.";
  }
};

export const getDailyHealthTip = async (language: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model,
        contents: `Provide a short, simple, and actionable daily health tip. The tip should be culturally relevant for someone in India. The response should be only the tip itself, in ${language}.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting daily health tip:", error);
    return "Stay hydrated and eat well!";
  }
};

export const analyzeSymptoms = async (symptoms: string, language: string): Promise<string> => {
  try {
    const langName = language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English';
    const response = await ai.models.generateContent({
      model,
      contents: `You are an AI assistant for the HealthMate application. A user has described their symptoms. Your task is to provide a helpful, safe, and preliminary analysis.

**User's Symptoms:** "${symptoms}"

**Instructions:**
1.  Analyze the described symptoms.
2.  Provide the response in ${langName}.
3.  Format the response using Markdown with the following sections exactly:
    - **Initial Analysis**: Briefly summarize the user's main symptoms.
    - **Possible Conditions**: List 2-3 potential, common, and generally non-alarming conditions that might cause these symptoms. **DO NOT** suggest serious or life-threatening diseases like cancer, heart attack, etc. Keep it general (e.g., "Common cold," "Viral fever," "Muscle strain").
    - **Recommended Self-Care**: Provide a few simple, safe, and general self-care tips. (e.g., "Get plenty of rest," "Stay hydrated by drinking water or clear fluids," "Over-the-counter pain relievers may help").
    - **When to See a Doctor**: List clear, simple red-flag symptoms that should prompt the user to seek professional medical help. (e.g., "If you have difficulty breathing," "If the fever is very high or lasts more than 3 days," "If symptoms worsen significantly").
4.  **Crucially, end your entire response with the following disclaimer in bold:**
    **Disclaimer: This is an AI-generated analysis and is not a substitute for professional medical advice. It is for informational purposes only. Consult with a qualified doctor for an accurate diagnosis and treatment plan.**`,
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    return "Sorry, I couldn't analyze the symptoms. Please try again or consult a doctor.";
  }
};

export const processVoiceCommand = async (command: string, conversationalFormId: string | null, language: string, currentPage: Page): Promise<any> => {
    try {
        const langName = language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English';
        const prompt = `
            You are 'HealthMate AI', an advanced conversational assistant for a healthcare application. Your primary role is to understand user voice commands—which may be complex, colloquial, or brief—and translate them into precise JSON actions. Your most important task is to accurately interpret search and navigation requests, as you are the main way for many users to find information. You must be highly context-aware, considering the user's current screen ('currentPage') to interpret their intent accurately. Your spoken responses should be natural, helpful, and reassuring, not just robotic confirmations. Always respond in the user's specified language.

            **User's Command Details:**
            - Language Spoken: ${langName}
            - Transcribed Command: "${command}"

            **Application Context:**
            - Current Page: "${currentPage}"
            - Is a conversational form active?: ${conversationalFormId ? `Yes, form ID is "${conversationalFormId}"` : "No"}

            **INTENT DETECTION LOGIC:**

            1.  **form_response**: (HIGHEST PRIORITY) If a conversational form is active, the user's speech is an answer to a question. The intent MUST be "form_response". Extract the user's answer into the \`payload.value\`.

            2.  **search_hospitals** / **search_medicines**: (HIGH PRIORITY) If the command is to find, look for, or inquire about hospitals, doctors, clinics, departments (e.g., "cardiology", "children's doctor"), medicines, pills, or pharmacy items. This is a primary function.
                - Keywords: "search for", "find", "look for", "any", "where can I get", "I need".
                - If it's about medical facilities or professionals -> intent is "search_hospitals". Navigate to "appointments".
                - If it's about pharmacy products -> intent is "search_medicines". Navigate to "order-medicine".
                - Extract the user's search term into \`payload.query\`. Be specific (e.g., "children's doctor in Kakinada").

            3.  **Contextual Interpretation**: If a command is short or ambiguous (e.g., just "cardiology", "pain relief"), you MUST use the \`currentPage\` to determine the most logical intent. For example, on the 'dashboard', "cardiology" implies a hospital search. On the 'order-medicine' page, "pain relief" implies a medicine search. If the intent is still completely unclear even with context, use the 'unknown' intent and ask for clarification in your response.

            4.  **start_conversation**: If the user explicitly asks to begin a multi-step, voice-driven task like "book an appointment", "set a new reminder", OR wants to perform a key multi-step action like "checkout".
                - If for booking -> \`payload.formId: "booking_flow"\`.
                - If for reminders -> \`payload.formId: "reminder_flow"\`.
                - If for medicine order delivery (command is "checkout" or similar on 'order-medicine' page) -> \`payload.formId: "delivery_flow"\`.
                - Your response should be the first question of that flow.

            5.  **navigate**: If the command is a simple request to go to a different screen without any search term.
                - Keywords: "go to", "open", "show me", "navigate to", "check symptoms", "track my vitals".
                - For "check symptoms" or similar, the page MUST be "symptom-checker".
                - Valid Pages: "dashboard", "appointments", "scan", "reminders", "order-medicine", "order-history", "settings", "symptom-checker", "vitals".

            6.  **action**: If the command is a specific action on the current page. This is highly context-dependent.
                - On 'settings' page: "edit my profile" -> \`{"action": "edit_profile"}\`
                - On 'reminders' page: "show me what I missed" -> \`{"action": "search_missed_reminders"}\`

            7.  **logout**: If the user wants to sign out or log out.

            8.  **unknown**: If the command is ambiguous or doesn't fit any other intent. Your response must ask for clarification.

            **RESPONSE SCHEMA:**
            You MUST return ONLY a valid JSON object matching this schema. The "response" field MUST be a complete, friendly sentence in ${langName}.

            {
              "intent": "navigate" | "search_hospitals" | "search_medicines" | "form_response" | "action" | "logout" | "unknown" | "start_conversation",
              "payload": {
                "page": "[page_name]",
                "query": "[search_term]",
                "value": "[user's_answer]",
                "action": "[action_name]",
                "formId": "[form_id_to_start]"
              },
              "response": "[A complete, friendly, and helpful confirmation message to speak back to the user in ${langName}]"
            }

            **IMPROVED EXAMPLES:**
            - Lang: English, Command: "Show me my order history", Page: "dashboard" -> {"intent": "navigate", "payload": {"page": "order-history"}, "response": "Of course, opening your order history now."}
            - Lang: English, Command: "check my symptoms", Page: "dashboard" -> {"intent": "navigate", "payload": {"page": "symptom-checker"}, "response": "I can help with that. Opening the symptom checker."}
            - Lang: English, Command: "track my vitals", Page: "dashboard" -> {"intent": "navigate", "payload": {"page": "vitals"}, "response": "Okay, opening your vitals tracker."}
            - Lang: English, Command: "Find me cardiology hospitals in Vizag", Page: "dashboard" -> {"intent": "search_hospitals", "payload": {"page": "appointments", "query": "cardiology hospitals in Vizag"}, "response": "Searching for cardiology hospitals in Vizag for you."}
            - Lang: English, Command: "cardiology", Page: "dashboard" -> {"intent": "search_hospitals", "payload": {"page": "appointments", "query": "cardiology"}, "response": "Looking up cardiology hospitals for you."}
            - Lang: English, Command: "Do you have any pain relief gel?", Page: "dashboard" -> {"intent": "search_medicines", "payload": {"page": "order-medicine", "query": "Pain Relief Gel"}, "response": "Yes, let's check for pain relief gels now."}
            - Lang: English, Command: "Her name is Priya", Form: "booking_flow" -> {"intent": "form_response", "payload": {"value": "Priya"}, "response": "Got it, Priya."}
            - Lang: English, Command: "I need to set a reminder for my mom", Page: "reminders" -> {"intent": "start_conversation", "payload": {"formId": "reminder_flow"}, "response": "Okay, I can set a reminder. Who is this reminder for?"}
            - Lang: English, Command: "checkout now", Page: "order-medicine" -> {"intent": "start_conversation", "payload": {"formId": "delivery_flow"}, "response": "Great, let's get your delivery details. What is the full address for delivery?"}
            - Lang: English, Command: "please log me out", Page: "any" -> {"intent": "logout", "payload": {}, "response": "Okay, signing you out now. Goodbye!"}
            - Lang: Telugu, Command: "నా సెట్టింగ్‌లను చూపించు", Page: "dashboard" -> {"intent": "navigate", "payload": {"page": "settings"}, "response": "ఖచ్చితంగా, మీ సెట్టింగ్‌లను తెరుస్తున్నాను."}
            - Lang: Telugu, Command: "గుంటూరులో గుండె డాక్టర్లు ఎక్కడ ఉన్నారు?", Page: "dashboard" -> {"intent": "search_hospitals", "payload": {"page": "appointments", "query": "గుండె డాక్టర్లు గుంటూరు"}, "response": "సరే, గుంటూరులోని గుండె వైద్యుల కోసం చూస్తున్నాను."}
            - Lang: Hindi, Command: "मेरी ऑर्डर हिस्ट्री दिखाओ", Page: "dashboard" -> {"intent": "navigate", "payload": {"page": "order-history"}, "response": "ज़रूर, आपकी ऑर्डर हिस्ट्री दिखा रहा हूँ।"}
            - Lang: Hindi, Command: "मुझे सिरदर्द की दवा चाहिए", Page: "any" -> {"intent": "search_medicines", "payload": {"page": "order-medicine", "query": "सिरदर्द की दवा"}, "response": "ठीक है, सिरदर्द की दवा खोज रहा हूँ।"}`
        ;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        intent: { type: Type.STRING, description: "The user's intent." },
                        payload: {
                            type: Type.OBJECT,
                            description: "Data extracted from the command.",
                            properties: {
                                page: { type: Type.STRING, nullable: true, description: "The page to navigate to." },
                                query: { type: Type.STRING, nullable: true, description: "The search query." },
                                value: { type: Type.STRING, nullable: true, description: "The user's answer to a form question."},
                                action: { type: Type.STRING, nullable: true, description: "A page-specific action to perform." },
                                formId: { type: Type.STRING, nullable: true, description: "The ID of the conversational form to start." }
                            },
                        },
                        response: { type: Type.STRING, description: "A friendly message to say back to the user." }
                    },
                    required: ['intent', 'payload', 'response']
                }
            }
        });
        
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error processing voice command:", error);
        return { intent: 'error', payload: {}, response: "I'm having trouble understanding. Please try again." };
    }
};


export const searchHospitalInformation = async (query: string, hospitalData: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({ 
            model, 
            contents: `Based on the provided data, answer the following question: "${query}"`,
            config: {
                systemInstruction: `You are an expert assistant for the HealthMate app. Your role is to answer user questions based *only* on the provided hospital data context.
- If the answer is in the data, list the matching hospital names clearly using bullet points.
- If the answer cannot be found in the provided data, you MUST respond with "I couldn't find information about that in the provided document." and nothing else.
- Keep your answers concise.

HOSPITAL DATA CONTEXT:
---
${hospitalData.substring(0, 8000)}
---
`
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error searching hospital information:", error);
        return "Sorry, I encountered an error while searching.";
    }
};
