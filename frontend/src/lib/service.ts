import axios from "axios";

import { TOKEN, BASE_URL } from "./constants";

export const getDomain = async () => {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (TOKEN) {
      headers.Authorization = `Bearer ${TOKEN}`;
    }

    const res = await axios.get(`${BASE_URL}/workspace/71f6b9a5-9600-414f-a54b-50f111ff0508/chat/config-domains`, { headers });
    return res.data.data;
  } catch (err) {
    console.error("domain config error:", err);
    throw err;
  }
};

export interface ChatPayload {
  user_query: string;
  response_type: string[];
  thread_id?: string;
  workspace_id?: string;
  domain_id?: string;
}

export const chat = async ({ payload, controller }: { payload: ChatPayload, controller: AbortController }) => {
  try {
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (TOKEN) {
      headers.Authorization = `Bearer ${TOKEN}`;
    }
    
    // Use fetch for streaming support
    const res = await fetch(`${BASE_URL}/op_chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_query: payload.user_query,
        workspace_id: "71f6b9a5-9600-414f-a54b-50f111ff0508",
        domain_id: payload.domain_id || "70e6f5d6-b659-4b1e-be71-9b789923f97b",
        response_type: payload.response_type,
        thread_id: payload.thread_id
      }),
      signal: controller.signal,
    });
    
    if (!res.ok) {
      // Handle 401 like axios config does
      if (res.status === 401) {
        localStorage.removeItem("userInfo");
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res;
  } catch (err) {
    console.error("chat error:", err);
    throw err;
  }
};
