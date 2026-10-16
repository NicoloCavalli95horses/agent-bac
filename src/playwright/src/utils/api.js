// api.js
// Network-related functionalities
// These APIs are executed in the Node context and are invisible to Playwright

//==============================
// Import
//==============================
import { log } from './utils.js';


//==============================
// Consts
//==============================
const BASE_URL = `http://${process.env.API_HOST}:${process.env.API_PORT}/api`;


//==============================
// Functions
//==============================

export async function apiToggleProxyState(enable) {
  const url = `${BASE_URL}/proxy`;
  const options = _getApiOptions({ method: "PUT", body: { enable: enable } });
  log("[API] Requested new proxy state: " + enable)

  return await _executeApi({ url, options });
}


export async function apiInitRun(initial_url = "") {
  const url = `${BASE_URL}/init`;
  const options = _getApiOptions({ method: "POST", body: { url: initial_url } });
  log("[API] Requested new run init")

  return await _executeApi({ url, options });
}


export async function apiSaveJSONStats() {
  const url = `${BASE_URL}/json-stats`;
  const options = _getApiOptions();
  log("[API] Requested new JSON stats")

  return await _executeApi({ url, options });
}


export async function apiGetTamperedHTTPevents() {
  const url = `${BASE_URL}/all-http-events`;
  const options = _getApiOptions();
  log("[API] Requested affected HTTP events")

  return await _executeApi({ url, options });
}


export async function apiSaveAgentOutput(body) {
  const url = `${BASE_URL}/agent-output`;
  const options = _getApiOptions({ method: "POST", body });
  log("[API] Saved agent output")

  return await _executeApi({ url, options });
}


export async function apiSaveAgentAttempts(run, attempts) {
  const url = `${BASE_URL}/agent-attempts`;
  const options = _getApiOptions({ method: "POST", body: { run, attempts } });
  log("[API] Saved agent attempts")

  return await _executeApi({ url, options });
}


async function _executeApi({ url, options }) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (response.ok && (response.status >= 200 && response.status < 300)) {
      return data;
    }

    const message = data?.detail || data?.message || `HTTP ${response.status}`;
    throw new Error(message);
  } catch (err) {
    log("[API] Request failed:", err);
    throw err;
  }
}



function _getApiOptions({
  method = "GET",
  headers = {},
  body,
  token,
} = {}) {
  return {
    method,
    body: JSON.stringify(body),
    headers: {
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
      "Content-Type": "application/json",
    },
  };
}