import "./style.css";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <a class="brand" href="/" aria-label="Lingua home">
        <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
        <span>lingua</span>
      </a>
      <div class="topbar-meta"><span class="live-dot"></span><span>private by default</span></div>
    </header>

    <section class="translation-card" aria-labelledby="translation-heading">
      <div class="card-topline">
        <div>
          <span class="kicker">Translation feed</span>
          <h2 id="translation-heading"><span id="feed-language">English</span> <span class="arrow">←</span> <span id="feed-source">Romanian / Hungarian</span></h2>
        </div>
        <button class="icon-button" id="clear-button" type="button" title="Clear captions" aria-label="Clear captions">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5.5h6V7m-9 0 .8 12h6.4L14 7m-5 3v6m6-6v6"/></svg>
        </button>
      </div>
      <div class="caption-stage" id="caption-stage" aria-live="polite">
        <div class="empty-state" id="empty-state">
          <button class="empty-icon" id="empty-start-button" type="button" aria-label="Start listening"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-7 8a7 7 0 0 0 14 0M12 18v3m-3 0h6"/></svg></button>
          <p>Start listening to see<br />the conversation unfold.</p>
        </div>
        <div class="caption-content" id="caption-content">
          <span class="caption-text" id="caption-text"></span><span class="caption-caret" id="caption-caret" aria-hidden="true"></span>
        </div>
      </div>
      <div class="source-row" id="source-row" hidden>
        <span class="source-label">original</span>
        <span class="source-text" id="source-text"></span>
      </div>
      <div class="card-footer">
        <div class="session-state"><span class="state-dot" id="state-dot"></span><span id="state-text">Ready when you are</span></div>
        <span class="not-saved"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5zM8 5v5h8V5M8 19v-5h8v5"/></svg> not saved</span>
      </div>
    </section>

    <section class="controls" aria-label="Translation controls">
      <div class="control-row">
        <label class="select-control">
          <span class="control-label">I hear</span>
          <span class="select-wrap"><select id="source-language" aria-label="Source language"><option value="auto">Auto detect</option><option value="ro">Romanian</option><option value="hu">Hungarian</option></select><span class="select-chevron">⌄</span></span>
        </label>
        <span class="direction-arrow" aria-hidden="true">→</span>
        <label class="select-control">
          <span class="control-label">Show me</span>
          <span class="select-wrap"><select id="target-language" aria-label="Target language"><option value="en">English</option><option value="nl">Dutch</option></select><span class="select-chevron">⌄</span></span>
        </label>
      </div>
      <label class="toggle-row"><span class="toggle-copy"><span class="control-label">Show source transcript</span><span class="toggle-note">Small original-language captions below the translation</span></span><input id="source-toggle" type="checkbox" checked /><span class="toggle-ui" aria-hidden="true"></span></label>
    </section>

    <div class="actions" id="actions">
      <button class="primary-button" id="start-button" type="button"><span class="button-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-7 8a7 7 0 0 0 14 0M12 18v3m-3 0h6"/></svg></span><span id="start-label">Start listening</span></button>
      <button class="pause-button" id="pause-button" type="button" disabled aria-pressed="false"><span class="pause-symbol" aria-hidden="true">Ⅱ</span><span id="pause-label">Pause</span></button>
      <button class="stop-button" id="stop-button" type="button" disabled><span class="stop-square"></span>Stop</button>
    </div>
    <div class="error-banner" id="error-banner" role="alert" hidden></div>

    <footer class="footer-note"><span>Uses OpenAI Realtime Translate</span><span class="footer-separator">·</span><span>Text only · no speaker audio</span></footer>
  </main>
`;

const els = {
  captionText: document.querySelector("#caption-text"),
  captionContent: document.querySelector("#caption-content"),
  captionStage: document.querySelector("#caption-stage"),
  captionCaret: document.querySelector("#caption-caret"),
  emptyState: document.querySelector("#empty-state"),
  sourceRow: document.querySelector("#source-row"),
  sourceText: document.querySelector("#source-text"),
  sourceLanguage: document.querySelector("#source-language"),
  targetLanguage: document.querySelector("#target-language"),
  sourceToggle: document.querySelector("#source-toggle"),
  clearButton: document.querySelector("#clear-button"),
  startButton: document.querySelector("#start-button"),
  startLabel: document.querySelector("#start-label"),
  actions: document.querySelector("#actions"),
  pauseButton: document.querySelector("#pause-button"),
  pauseLabel: document.querySelector("#pause-label"),
  stopButton: document.querySelector("#stop-button"),
  stateDot: document.querySelector("#state-dot"),
  stateText: document.querySelector("#state-text"),
  feedLanguage: document.querySelector("#feed-language"),
  feedSource: document.querySelector("#feed-source"),
  errorBanner: document.querySelector("#error-banner"),
  emptyStartButton: document.querySelector("#empty-start-button"),
};

const state = {
  peerConnection: null,
  dataChannel: null,
  sourceStream: null,
  running: false,
  connecting: false,
  paused: false,
  outputText: "",
  inputText: "",
  outputSegments: [],
  inputSegments: [],
};

const languageNames = { en: "English", nl: "Dutch", auto: "Romanian / Hungarian", ro: "Romanian", hu: "Hungarian" };
const MAX_OUTPUT_CHARS = 8000;
const MAX_INPUT_CHARS = 6000;

function setStatus(kind, text) {
  els.stateDot.className = `state-dot ${kind}`;
  els.stateText.textContent = text;
}

function showError(message) {
  els.errorBanner.textContent = message;
  els.errorBanner.hidden = false;
}

function hideError() {
  els.errorBanner.hidden = true;
  els.errorBanner.textContent = "";
}

function updateFeedLabels() {
  els.feedLanguage.textContent = languageNames[els.targetLanguage.value];
  els.feedSource.textContent = languageNames[els.sourceLanguage.value];
}

function isCaptionFeedAtBottom() {
  const distanceFromBottom = els.captionStage.scrollHeight - els.captionStage.scrollTop - els.captionStage.clientHeight;
  return distanceFromBottom <= 24;
}

function renderCaptions({ stickToBottom = false } = {}) {
  const hasContent = Boolean(state.outputText || state.inputText || state.running);
  els.emptyState.hidden = hasContent;
  els.captionStage.classList.toggle("has-content", hasContent);
  els.captionText.textContent = state.outputText;
  els.captionCaret.hidden = !state.running;
  els.sourceText.textContent = state.inputText;
  els.sourceRow.hidden = !els.sourceToggle.checked || !state.inputText;
  if (stickToBottom) els.captionStage.scrollTop = els.captionStage.scrollHeight;
}

function updateSessionControls() {
  const sessionActive = state.running || state.connecting;
  els.actions.classList.toggle("is-listening", sessionActive);
  document.body.classList.toggle("session-active", sessionActive);
  els.startButton.disabled = sessionActive;
  els.stopButton.disabled = !sessionActive;
  els.pauseButton.disabled = !state.running;
  els.pauseButton.setAttribute("aria-pressed", String(state.paused));
  els.pauseButton.classList.toggle("is-paused", state.paused);
  els.pauseLabel.textContent = state.paused ? "Resume" : "Pause";
  els.startLabel.textContent = state.connecting ? "Connecting…" : state.running ? "Listening" : "Start listening";
}

function resetCaptions() {
  state.outputText = "";
  state.inputText = "";
  state.outputSegments = [];
  state.inputSegments = [];
  renderCaptions();
  els.captionStage.scrollTop = 0;
}

function appendTranscript(kind, delta) {
  if (!delta) return;
  const stickToBottom = isCaptionFeedAtBottom();
  if (kind === "output") {
    state.outputText += delta;
    if (state.outputText.length > MAX_OUTPUT_CHARS) state.outputText = `…${state.outputText.slice(-(MAX_OUTPUT_CHARS - 1))}`;
  } else {
    state.inputText += delta;
    if (state.inputText.length > MAX_INPUT_CHARS) state.inputText = `…${state.inputText.slice(-(MAX_INPUT_CHARS - 1))}`;
  }
  renderCaptions({ stickToBottom });
}

function handleRealtimeEvent(rawEvent) {
  let event;
  try {
    event = JSON.parse(rawEvent);
  } catch {
    return;
  }

  if (event.type === "session.output_transcript.delta") appendTranscript("output", event.delta);
  if (event.type === "session.input_transcript.delta") appendTranscript("input", event.delta);
  if (event.type === "session.created") setStatus("active", "Listening live");
  if (event.type === "error") {
    const detail = event.error?.message || "The translation session returned an error.";
    showError(detail);
    setStatus("error", "Connection needs attention");
  }
}

function getFriendlyError(error) {
  if (error?.name === "NotAllowedError") return "Microphone access was blocked. Allow microphone access in your browser, then try again.";
  if (error?.name === "NotFoundError") return "No microphone was found. Connect a microphone and try again.";
  if (error?.message) return error.message;
  return "Could not start the translation session. Try again in a moment.";
}

async function createSession() {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetLanguage: els.targetLanguage.value,
      sourceLanguage: els.sourceLanguage.value,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The translation service is unavailable.");
  if (!body.value) throw new Error("The translation service did not return a client secret.");
  return body.value;
}

async function startListening() {
  if (state.running || state.connecting) return;
  hideError();
  resetCaptions();
  updateFeedLabels();
  state.connecting = true;
  state.paused = false;
  updateSessionControls();
  setStatus("connecting", "Connecting to translation");

  try {
    const clientSecret = await createSession();
    state.sourceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.peerConnection = new RTCPeerConnection();
    state.peerConnection.addTrack(state.sourceStream.getAudioTracks()[0], state.sourceStream);

    state.peerConnection.ontrack = ({ track }) => {
      // Text-only prototype: receive but never attach translated audio to a playback sink.
      track.enabled = false;
    };
    state.peerConnection.onconnectionstatechange = () => {
      const connectionState = state.peerConnection?.connectionState;
      if (connectionState === "connected") setStatus("active", "Listening live");
      if (connectionState === "failed") {
        showError("The realtime connection failed. Check your connection and try again.");
        setStatus("error", "Connection failed");
      }
    };

    state.dataChannel = state.peerConnection.createDataChannel("oai-events");
    state.dataChannel.onmessage = ({ data }) => handleRealtimeEvent(data);
    state.dataChannel.onopen = () => setStatus("active", "Listening live");
    state.dataChannel.onerror = () => {
      showError("The realtime event channel encountered a problem.");
      setStatus("error", "Connection needs attention");
    };

    const offer = await state.peerConnection.createOffer();
    await state.peerConnection.setLocalDescription(offer);

    const sdpResponse = await fetch("https://api.openai.com/v1/realtime/translations/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });
    if (!sdpResponse.ok) throw new Error((await sdpResponse.text()) || "OpenAI could not start the realtime call.");
    await state.peerConnection.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() });

    state.connecting = false;
    state.running = true;
    updateSessionControls();
    renderCaptions();
  } catch (error) {
    await stopListening({ silent: true });
    setStatus("error", "Not connected");
    showError(getFriendlyError(error));
  }
}

function setPaused(paused) {
  if (!state.running || !state.sourceStream) return;
  state.paused = paused;
  state.sourceStream.getAudioTracks().forEach((track) => { track.enabled = !state.paused; });
  updateSessionControls();
  setStatus(state.paused ? "paused" : "active", state.paused ? "Paused · connection held" : "Listening live");
}

async function stopListening({ silent = false } = {}) {
  state.running = false;
  state.connecting = false;
  state.paused = false;
  if (state.dataChannel && state.dataChannel.readyState === "open") state.dataChannel.close();
  if (state.peerConnection) state.peerConnection.close();
  if (state.sourceStream) state.sourceStream.getTracks().forEach((track) => track.stop());
  state.dataChannel = null;
  state.peerConnection = null;
  state.sourceStream = null;
  updateSessionControls();
  setStatus("ready", "Ready when you are");
  renderCaptions();
  if (!silent) hideError();
}

els.startButton.addEventListener("click", startListening);
els.emptyStartButton.addEventListener("click", startListening);
els.pauseButton.addEventListener("click", () => setPaused(!state.paused));
els.stopButton.addEventListener("click", () => stopListening());
els.clearButton.addEventListener("click", resetCaptions);
els.sourceToggle.addEventListener("change", renderCaptions);
els.sourceLanguage.addEventListener("change", updateFeedLabels);
els.targetLanguage.addEventListener("change", () => {
  updateFeedLabels();
  if (state.running) {
    showError("Stop and restart to change the target language.");
  }
});

window.addEventListener("beforeunload", () => stopListening({ silent: true }));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

updateFeedLabels();
renderCaptions();
