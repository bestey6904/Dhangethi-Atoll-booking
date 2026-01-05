
import { GoogleGenAI, Type } from "@google/genai";
import { Booking, Room } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartSummary = async (bookings: Booking[], rooms: Room[]) => {
  if (!process.env.API_KEY) return "AI Summary unavailable (API Key not set).";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a hotel management assistant. Given the current room occupancy and bookings, provide a concise 2-sentence summary of the hotel status.
      Rooms: ${JSON.stringify(rooms.map(r => ({ name: r.name, status: r.status })))}
      Bookings: ${JSON.stringify(bookings)}`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "No summary available.";
  } catch (error) {
    console.error("Gemini summary error:", error);
    return "Failed to fetch smart summary.";
  }
};
