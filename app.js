const STORAGE = {
  apiKey: 'dafz_ai_api_key',
  provider: 'dafz_ai_provider',
  model: 'dafz_ai_model',
  botName: 'dafz_ai_bot_name',
  botPersona: 'dafz_ai_bot_persona'
};

const elements = {
  messages: document.getElementById('messages'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  settingsPanel: document.getElementById('settingsPanel'),
  providerSelect: document.getElementById('providerSelect'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  modelSelect: document.getElementById('modelSelect'),
  botNameInput: document.getElementById('botNameInput'),
  botPersona: document.getElementById('botPersona'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  deleteKeyBtn: document.getElementById('deleteKeyBtn'),
  connectionIndicator: document.getElementById('connectionIndicator')
};

const MODEL_OPTIONS = {
  openai: [
    { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' },
    { value: 'gpt-4', label: 'gpt-4' }
  ],
  anthropic: [
    { value: 'claude-3.5-mini', label: 'claude-3.5-mini' },
    { value: 'claude-3.5-pro', label: 'claude-3.5-pro' }
  ],
  huggingface: [
    { value: 'tiiuae/falcon-7b-instruct', label: 'Falcon 7B Instruct' },
    { value: 'gpt2', label: 'GPT-2' }
  ],
  google: [
    { value: 'models/text-bison-001', label: 'text-bison-001' },
    { value: 'models/chat-bison-001', label: 'chat-bison-001' }
  ]
};

const DEFAULT_MODEL = {
  openai: 'gpt-3.5-turbo',
  anthropic: 'claude-3.5-mini',
  huggingface: 'tiiuae/falcon-7b-instruct',
  google: 'models/text-bison-001'
};

let state = {
  apiKey: localStorage.getItem(STORAGE.apiKey) || '',
  provider: localStorage.getItem(STORAGE.provider) || 'auto',
  model: localStorage.getItem(STORAGE.model) || 'gpt-3.5-turbo',
  botName: localStorage.getItem(STORAGE.botName) || 'NeonAI',
  botPersona: localStorage.getItem(STORAGE.botPersona) || 'Helpful, friendly, dan sedikit gaul',
  history: [],
  loading: false
};

function detectProvider(apiKey, forcedProvider) {
  if (forcedProvider && forcedProvider !== 'auto') {
    return forcedProvider;
  }

  if (!apiKey) {
    return 'unknown';
  }

  if (apiKey.startsWith('sk-ant-')) {
    return 'anthropic';
  }

  if (apiKey.startsWith('sk-') || apiKey.startsWith('key_') || apiKey.startsWith('key-')) {
    return 'openai';
  }

  if (apiKey.startsWith('hf_')) {
    return 'huggingface';
  }

  if (apiKey.startsWith('AIza') || apiKey.startsWith('ya29.') || apiKey.startsWith('AQ.') || apiKey.startsWith('GOOG') || apiKey.startsWith('goog-')) {
    return 'google';
  }

  return 'unknown';
}

function getProviderLabel(provider) {
  if (provider === 'openai') return 'OpenAI';
  if (provider === 'anthropic') return 'Anthropic';
  if (provider === 'huggingface') return 'Hugging Face';
  if (provider === 'google') return 'Google / Gemini';
  return 'Tidak diketahui';
}

function populateModelOptions(provider) {
  const options = MODEL_OPTIONS[provider] || [];
  elements.modelSelect.innerHTML = options.map(option => `
    <option value="${option.value}">${option.label}</option>
  `).join('');
  elements.modelSelect.value = state.model && options.some(opt => opt.value === state.model)
    ? state.model
    : DEFAULT_MODEL[provider] || options[0]?.value || '';
}

function updateConnectionStatus() {
  const provider = detectProvider(state.apiKey, state.provider);
  const ready = state.apiKey && provider !== 'unknown';
  const label = ready ? `Online • ${getProviderLabel(provider)}` : 'Offline';
  elements.connectionIndicator.textContent = label;
  elements.connectionIndicator.style.background = ready ? 'rgba(78, 255, 145, 0.16)' : 'rgba(255, 80, 80, 0.14)';
  elements.connectionIndicator.style.color = ready ? '#b6ffdb' : '#ffb2b2';
}

function openSettings() {
  elements.settingsPanel.classList.remove('hidden');
  elements.modalBackdrop.classList.remove('hidden');
}

function closeSettings() {
  elements.settingsPanel.classList.add('hidden');
  elements.modalBackdrop.classList.add('hidden');
}

function saveSettings() {
  const apiKey = elements.apiKeyInput.value.trim();
  const selectedProvider = elements.providerSelect.value;
  const model = elements.modelSelect.value;
  const botName = elements.botNameInput.value.trim() || 'NeonAI';
  const botPersona = elements.botPersona.value.trim() || 'Helpful, friendly, dan sedikit gaul';

  const detectedProvider = detectProvider(apiKey, 'auto');
  const provider = selectedProvider === 'auto' ? detectedProvider : selectedProvider;

  if (provider === 'unknown') {
    alert('❌ Format API Key tidak dikenali. Gunakan OpenAI, Anthropic, Hugging Face, atau Google / Gemini.');
    return;
  }

  if (selectedProvider !== 'auto' && detectedProvider !== 'unknown' && detectedProvider !== provider) {
    const message = `Kunci API tampaknya untuk ${getProviderLabel(detectedProvider)}, tetapi Anda memilih ${getProviderLabel(provider)}.`;
    if (!confirm(`${message}\nGunakan ${getProviderLabel(detectedProvider)} sebagai provider?`)) {
      return;
    }
  }

  state.apiKey = apiKey;
  state.provider = provider;
  state.model = model;
  state.botName = botName;
  state.botPersona = botPersona;

  localStorage.setItem(STORAGE.apiKey, apiKey);
  localStorage.setItem(STORAGE.provider, provider);
  localStorage.setItem(STORAGE.model, state.model);
  localStorage.setItem(STORAGE.botName, botName);
  localStorage.setItem(STORAGE.botPersona, botPersona);

  elements.providerSelect.value = provider;
  populateModelOptions(provider);
  updateConnectionStatus();
  closeSettings();
  addMessage('bot', `✅ Pengaturan tersimpan. ${botName} siap membantu!`);
}

function deleteKey() {
  if (!state.apiKey) return;
  const confirmed = confirm('Hapus API key dari browser?');
  if (!confirmed) return;

  state.apiKey = '';
  localStorage.removeItem(STORAGE.apiKey);
  elements.apiKeyInput.value = '';
  updateConnectionStatus();
  addMessage('bot', '🔒 API key dihapus. Silakan masukkan kembali untuk melanjutkan.');
}

function appendMessage(role, text) {
  const wrapper = document.createElement('div');
  wrapper.className = `msg ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'bot' ? '🤖' : '👤';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;

  wrapper.append(avatar, bubble);
  elements.messages.appendChild(wrapper);
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function addMessage(role, text) {
  const welcomeCard = document.getElementById('welcomeCard');
  if (welcomeCard) {
    welcomeCard.remove();
  }
  appendMessage(role, text);
}

function clearChat() {
  state.history = [];
  elements.messages.innerHTML = `
    <article class="welcome-card" id="welcomeCard">
      <h1>Halo! 👋</h1>
      <p>Mulai obrolan baru dengan memasukkan API Key dan menekan tombol kirim.</p>
      <div class="examples">
        <button class="example-btn">💡 Jelaskan cara kerja AI</button>
        <button class="example-btn">📝 Buatkan puisi singkat</button>
        <button class="example-btn">🐍 Contoh kode Python</button>
      </div>
    </article>`;

  document.querySelectorAll('.example-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      elements.messageInput.value = btn.textContent.trim();
      elements.messageInput.focus();
    });
  });
}

function autoResize() {
  elements.messageInput.style.height = 'auto';
  elements.messageInput.style.height = `${Math.min(elements.messageInput.scrollHeight, 140)}px`;
}

function getSystemMessage() {
  const text = `Kamu adalah ${state.botName}, asisten AI yang ${state.botPersona}. Jawab dalam bahasa yang sama dengan user.`;
  return { role: 'system', content: text };
}

async function requestOpenAI(messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.apiKey}`
    },
    body: JSON.stringify({
      model: state.model,
      messages,
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error?.message || 'Gagal terhubung ke OpenAI');
  }
  return json.choices?.[0]?.message?.content || json.error?.message || 'Respons kosong dari OpenAI.';
}

async function requestAnthropic(messages) {
  const response = await fetch('https://api.anthropic.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': state.apiKey
    },
    body: JSON.stringify({
      model: state.model,
      messages,
      max_tokens_to_sample: 1000,
      temperature: 0.7
    })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error?.message || 'Gagal terhubung ke Anthropic');
  }
  return json.completion || json.choices?.[0]?.message?.content || json.output?.[0]?.content?.[0]?.text || 'Respons kosong dari Anthropic.';
}

async function requestGoogle(messages) {
  const promptText = messages.map((item) => {
    if (item.role === 'system') return `System: ${item.content}`;
    if (item.role === 'user') return `User: ${item.content}`;
    return `Assistant: ${item.content}`;
  }).join('\n');

  const model = state.model || 'models/text-bison-001';
  const url = state.apiKey.startsWith('AIza')
    ? `https://generativelanguage.googleapis.com/v1beta2/${encodeURIComponent(model)}:generateText?key=${encodeURIComponent(state.apiKey)}`
    : `https://generativelanguage.googleapis.com/v1beta2/${encodeURIComponent(model)}:generateText`;

  const headers = {
    'Content-Type': 'application/json'
  };
  if (!state.apiKey.startsWith('AIza')) {
    headers.Authorization = `Bearer ${state.apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: { text: promptText },
      temperature: 0.7,
      maxOutputTokens: 1000
    })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error?.message || json.error?.status || 'Gagal terhubung ke Google AI');
  }
  return json?.candidates?.[0]?.output || json?.output?.generated_text || json?.content || 'Respons kosong dari Google AI.';
}

async function requestHuggingFace(messages) {
  const prompt = messages.map((item) => {
    if (item.role === 'system') return `System: ${item.content}`;
    if (item.role === 'user') return `User: ${item.content}`;
    return `Assistant: ${item.content}`;
  }).join('\n');

  const response = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(state.model)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.apiKey}`
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 1000,
        return_full_text: false
      }
    })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || 'Gagal terhubung ke Hugging Face');
  }

  if (Array.isArray(json) && json[0]?.generated_text) {
    return json[0].generated_text;
  }
  if (json.generated_text) {
    return json.generated_text;
  }

  throw new Error('Respons kosong dari Hugging Face.');
}

async function sendMessage() {
  if (state.loading) return;

  const text = elements.messageInput.value.trim();
  if (!text) return;

  if (!state.apiKey) {
    openSettings();
    return;
  }

  const provider = detectProvider(state.apiKey, state.provider);
  if (provider === 'unknown') {
    addMessage('bot', '❌ Provider tidak dikenali. Pilih provider yang sesuai di pengaturan.');
    return;
  }

  elements.messageInput.value = '';
  autoResize();
  addMessage('user', text);
  state.history.push({ role: 'user', content: text });
  if (state.history.length > 20) {
    state.history = state.history.slice(-20);
  }

  state.loading = true;
  elements.sendBtn.disabled = true;
  const typing = document.createElement('div');
  typing.className = 'msg typing';
  typing.id = 'typingMessage';
  typing.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-bubble">Sedang mengetik...</div>`;
  elements.messages.appendChild(typing);
  elements.messages.scrollTop = elements.messages.scrollHeight;

  try {
    const payload = [getSystemMessage(), ...state.history];
    const reply = provider === 'openai'
      ? await requestOpenAI(payload)
      : provider === 'anthropic'
      ? await requestAnthropic(payload)
      : provider === 'google'
      ? await requestGoogle(payload)
      : provider === 'huggingface'
      ? await requestHuggingFace(payload)
      : 'Provider tidak didukung.';

    const typingNode = document.getElementById('typingMessage');
    if (typingNode) typingNode.remove();
    addMessage('bot', reply);
    state.history.push({ role: 'assistant', content: reply });
  } catch (error) {
    const typingNode = document.getElementById('typingMessage');
    if (typingNode) typingNode.remove();
    addMessage('bot', `❌ ${error.message}`);
  } finally {
    state.loading = false;
    elements.sendBtn.disabled = false;
  }
}

function bindEvents() {
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.closeSettingsBtn.addEventListener('click', closeSettings);
  elements.modalBackdrop.addEventListener('click', closeSettings);
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  elements.deleteKeyBtn.addEventListener('click', deleteKey);
  elements.sendBtn.addEventListener('click', sendMessage);
  elements.messageInput.addEventListener('input', autoResize);
  elements.messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
  document.getElementById('clearBtn').addEventListener('click', clearChat);
}

function restoreSettings() {
  elements.apiKeyInput.value = state.apiKey;
  elements.providerSelect.value = state.provider;
  elements.botNameInput.value = state.botName;
  elements.botPersona.value = state.botPersona;
  populateModelOptions(state.provider === 'auto' ? 'openai' : state.provider);
}

function init() {
  restoreSettings();
  updateConnectionStatus();
  bindEvents();
  clearChat();
}

init();
