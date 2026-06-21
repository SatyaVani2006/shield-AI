/**
 * SHIELD AI — Chat UI, typing effect, history
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!ShieldApp.requireAuth()) return;

  const messagesEl = document.getElementById('messages');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const micBtn = document.getElementById('mic-btn');
  const speakBtn = document.getElementById('speak-btn');
  const langSelect = document.getElementById('response-language');
  const voiceGender = document.getElementById('voice-gender');
  const sessionList = document.getElementById('session-list');
  const newChatBtn = document.getElementById('new-chat-btn');
  const statSessions = document.getElementById('stat-sessions');
  const statLang = document.getElementById('stat-lang');

  let currentChatId = null;
  let lastAssistantReply = '';
  let lastUserMessageText = '';
  let isSending = false;

  const user = ShieldApp.getUser();
  if (user?.preferredLanguage) {
    langSelect.value = user.preferredLanguage;
    if (statLang) {
      statLang.textContent = user.preferredLanguage.toUpperCase();
    }
  }

  const formatInline = (text) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    formatted = formatted.replace(/`(.*?)`/g, '<code class="chat-code">$1</code>');
    return formatted;
  };

  const formatMarkdown = (text) => {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Extract code blocks first
    const codeBlocks = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    escaped = escaped.replace(codeBlockRegex, (match, lang, code) => {
      const index = codeBlocks.length;
      codeBlocks.push({ lang, code: code.trim() });
      return `\n\n__CODE_BLOCK_PLACEHOLDER_${index}__\n\n`;
    });

    const blocks = escaped.split(/\n\n+/);
    const formattedBlocks = blocks.map(block => {
      block = block.trim();
      if (!block) return '';

      if (/^__CODE_BLOCK_PLACEHOLDER_\d+__$/.test(block)) {
        return block;
      }

      if (block.startsWith('### ')) {
        return `<h3 class="chat-h3">${block.slice(4)}</h3>`;
      }
      if (block.startsWith('## ')) {
        return `<h2 class="chat-h2">${block.slice(3)}</h2>`;
      }
      if (block.startsWith('# ')) {
        return `<h1 class="chat-h1">${block.slice(2)}</h1>`;
      }

      const lines = block.split('\n');
      let currentType = null;
      let currentGroup = [];
      const parts = [];

      const flushGroup = () => {
        if (currentGroup.length === 0) return;
        if (currentType === 'ul') {
          parts.push(`<ul class="chat-list">${currentGroup.join('')}</ul>`);
        } else {
          parts.push(`<p>${currentGroup.join('<br>')}</p>`);
        }
        currentGroup = [];
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) continue;

        const isListItem = /^\s*[-*•]\s+/.test(line);

        if (isListItem) {
          if (currentType !== 'ul') {
            flushGroup();
            currentType = 'ul';
          }
          const content = line.replace(/^\s*[-*•]\s+/, '');
          currentGroup.push(`<li>${formatInline(content)}</li>`);
        } else {
          if (currentType !== 'p') {
            flushGroup();
            currentType = 'p';
          }
          currentGroup.push(formatInline(line));
        }
      }
      flushGroup();

      return parts.join('');
    });

    let resultHtml = formattedBlocks.join('');

    // Restore code blocks
    codeBlocks.forEach((item, index) => {
      const codeHtml = `<div class="code-block-container">
        <div class="code-block-header">
          <span class="code-block-lang">${item.lang || 'code'}</span>
          <button type="button" class="copy-code-btn" data-code="${encodeURIComponent(item.code)}">
            <span class="copy-icon">📋</span> Copy
          </button>
        </div>
        <pre class="chat-code-pre"><code class="chat-code-block">${item.code}</code></pre>
      </div>`;
      resultHtml = resultHtml.replace(`__CODE_BLOCK_PLACEHOLDER_${index}__`, codeHtml);
    });

    return resultHtml;
  };

  const formatTime = (d = new Date()) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const scrollToBottom = () => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const appendMessage = (role, content, meta = '') => {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    
    const avatarHtml = role === 'assistant'
      ? `<div class="message-avatar" aria-hidden="true">🛡️</div>`
      : `<div class="message-avatar" aria-hidden="true">👤</div>`;
      
    const speakBtnHtml = role === 'assistant'
      ? `<button type="button" class="msg-speak-btn" title="Speak reply" aria-label="Speak response">🔊</button>`
      : '';
      
    div.innerHTML = `
      ${avatarHtml}
      <div class="message-body">
        <div class="content"></div>
        <span class="time">${formatTime()}</span>
        ${meta ? `<span class="meta-tag">${meta}</span>` : ''}
        ${speakBtnHtml}
      </div>
    `;
    const contentEl = div.querySelector('.content');

    if (role === 'assistant') {
      const btn = div.querySelector('.msg-speak-btn');
      btn.addEventListener('click', () => {
        const hasSupport = ShieldVoice.hasVoiceSupport(langSelect.value);
        let textToSpeak = div.dataset.rawText || contentEl.innerText;
        let speakLang = langSelect.value;

        if (!hasSupport && langSelect.value !== 'en') {
          textToSpeak = div.dataset.englishText || textToSpeak;
          speakLang = 'en';
          console.warn(`[SHIELD AI] No native voice support for language "${langSelect.value}". Falling back to English voice.`);
        }

        if (btn.classList.contains('speaking')) {
          ShieldVoice.stopSpeaking();
          btn.classList.remove('speaking');
          btn.textContent = '🔊';
          return;
        }

        document.querySelectorAll('.msg-speak-btn.speaking').forEach((otherBtn) => {
          otherBtn.classList.remove('speaking');
          otherBtn.textContent = '🔊';
        });

        ShieldVoice.speak(textToSpeak, speakLang, voiceGender.value, {
          onStart: () => {
            btn.classList.add('speaking');
            btn.textContent = '⏹️';
          },
          onEnd: () => {
            btn.classList.remove('speaking');
            btn.textContent = '🔊';
          }
        });
      });
    }

    messagesEl.appendChild(div);
    scrollToBottom();
    return contentEl;
  };

  const typeWriter = (el, text, speed = 45) =>
    new Promise((resolve) => {
      // Split by spaces/words so we render word-by-word, reducing DOM/Markdown parser loads
      const words = text.split(/(\s+)/);
      let i = 0;
      let currentText = '';
      const tick = () => {
        if (i < words.length) {
          currentText += words[i];
          el.innerHTML = formatMarkdown(currentText);
          i += 1;
          scrollToBottom();
          setTimeout(tick, speed);
        } else {
          el.innerHTML = formatMarkdown(text); // Final full parse
          resolve();
        }
      };
      tick();
    });

  const showTyping = () => {
    const el = document.createElement('div');
    el.className = 'message assistant typing-indicator-container';
    el.id = 'typing';
    el.innerHTML = `
      <div class="message-avatar" aria-hidden="true">🛡️</div>
      <div class="message-body">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesEl.appendChild(el);
    scrollToBottom();
  };

  const hideTyping = () => {
    document.getElementById('typing')?.remove();
  };

  const renderSessions = (chats) => {
    sessionList.querySelectorAll('.session-item').forEach((n) => n.remove());
    chats.forEach((chat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `session-item${chat._id === currentChatId ? ' active' : ''}`;
      btn.textContent = chat.title || 'Conversation';
      btn.dataset.id = chat._id;
      btn.addEventListener('click', () => loadChat(chat._id));
      sessionList.appendChild(btn);
    });
    if (statSessions) {
      statSessions.textContent = String(chats.length);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await ShieldApp.api('/api/chat/history');
      renderSessions(data.chats || []);
    } catch {
      /* ignore */
    }
  };

  const loadChat = async (id) => {
    try {
      const data = await ShieldApp.api(`/api/chat/${id}`);
      currentChatId = data.chat._id;
      messagesEl.innerHTML = '';
      data.chat.messages.forEach((m) => {
        const el = appendMessage(m.role, '', '');
        el.innerHTML = formatMarkdown(m.content);
        if (m.role === 'assistant') {
          el.parentElement.dataset.rawText = m.content;
          el.parentElement.dataset.englishText = m.originalContent || m.content;
          lastAssistantReply = m.content;
        }
      });
      await loadHistory();
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    const text = inputEl.value.trim();
    if (!text || isSending) return;

    lastUserMessageText = text; // Cache last prompt for potential retries
    isSending = true;
    sendBtn.disabled = true;
    inputEl.readOnly = true; // Use readOnly to preserve focus and keyboard states
    micBtn.disabled = true;
    
    // Remove welcome screen if it's active
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.remove();
    }

    appendMessage('user', '').innerHTML = formatMarkdown(text);
    inputEl.value = '';
    inputEl.style.height = 'auto'; // Reset auto-expanded height
    showTyping();

    try {
      const data = await ShieldApp.api('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({

  message: text,

  chatId: currentChatId,

  customerId:
    localStorage.getItem(
      'customerId'
    ),

  sessionId:
    ShieldApp.getSessionId(),

  targetLanguage:
    langSelect.value,

}),
      });

      currentChatId = data.chatId;
      hideTyping();

      const contentEl = appendMessage('assistant', '', '');
      contentEl.parentElement.dataset.rawText = data.reply;
      contentEl.parentElement.dataset.englishText = data.originalReply || data.reply;
      await typeWriter(contentEl, data.reply);
      lastAssistantReply = data.reply;

      const autoSpeak = localStorage.getItem('shield_auto_speak') === '1';
      if (autoSpeak) {
        const hasSupport = ShieldVoice.hasVoiceSupport(langSelect.value);
        const textToSpeak = hasSupport ? data.reply : (data.originalReply || data.reply);
        const speakLang = hasSupport ? langSelect.value : 'en';
        ShieldVoice.speak(textToSpeak, speakLang, voiceGender.value);
      }

      await loadHistory();
    } catch (err) {
      hideTyping();
      const errBubble = appendMessage('assistant', '', '');
      errBubble.innerHTML = `
        <div style="color:var(--danger);font-weight:600;">⚠️ Request Failed</div>
        <div style="font-size:0.9rem;margin-top:4px;color:var(--text-muted);">${err.message}</div>
        <button type="button" class="retry-msg-btn">🔄 Retry Query</button>
      `;
    } finally {
      // 3-second cooldown to prevent Groq API key token exhaustion
      setTimeout(() => {
        isSending = false;
        sendBtn.disabled = false;
        inputEl.readOnly = false; // Restore input editing access
        micBtn.disabled = false;
        inputEl.focus();
      }, 3000);
    }
  };

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  const renderWelcomeScreen = () => {
    messagesEl.innerHTML = `
      <div class="welcome-screen" id="welcome-screen">
        <div class="welcome-logo" aria-hidden="true">🛡️</div>
        <h2>How can I help you today?</h2>
        <p class="welcome-subtitle">Ask SHIELD AI about security, threat analysis, phishing detection, password strength, and network vulnerabilities.</p>
        
        <div class="welcome-grid">
          <button type="button" class="welcome-card" data-question="What is phishing and how do I avoid it?">
            <span class="card-icon">🎣</span>
            <div class="card-text">
              <h4>What is phishing?</h4>
              <p>Learn about social engineering and phishing emails</p>
            </div>
          </button>
          <button type="button" class="welcome-card" data-question="How do I create a strong password?">
            <span class="card-icon">🔑</span>
            <div class="card-text">
              <h4>Strong password tips</h4>
              <p>Best practices for strong passwords & MFA security</p>
            </div>
          </button>
          <button type="button" class="welcome-card" data-question="What should I do if I suspect malware on my device?">
            <span class="card-icon">🦠</span>
            <div class="card-text">
              <h4>Suspect malware?</h4>
              <p>Step-by-step actions for malware containment</p>
            </div>
          </button>
          <button type="button" class="welcome-card" data-question="How do I secure my home Wi-Fi network?">
            <span class="card-icon">📶</span>
            <div class="card-text">
              <h4>Secure home Wi-Fi</h4>
              <p>Configure WPA3, ssids, guest networks</p>
            </div>
          </button>
        </div>
      </div>
    `;

    messagesEl.querySelectorAll('.welcome-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        inputEl.value = btn.dataset.question || btn.textContent.replace(/^[^\s]+\s/, '');
        sendMessage();
      });
    });
  };

  newChatBtn.addEventListener('click', () => {
    currentChatId = null;
    ShieldApp.newSession();
    messagesEl.innerHTML = '';
    lastAssistantReply = '';
    renderWelcomeScreen();
  });

  micBtn.addEventListener('click', () => {
    if (!ShieldVoice.isSupported()) {
      alert('Voice recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    micBtn.classList.toggle('active');
    ShieldVoice.toggleListening(langSelect.value, {
      onResult: (text, isFinal) => {
        inputEl.value = text;
        if (isFinal) {
          micBtn.classList.remove('active');
          ShieldVoice.stopListening();
          sendMessage();
        }
      },
      onError: () => micBtn.classList.remove('active'),
    });
  });

  speakBtn.addEventListener('click', () => {
    if (lastAssistantReply) {
      ShieldVoice.speak(lastAssistantReply, langSelect.value, voiceGender.value);
    }
  });

  langSelect.addEventListener('change', () => {
    if (statLang) {
      statLang.textContent = langSelect.value.toUpperCase();
    }
  });

  // Auto-expanding textarea input height adjustments
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = `${inputEl.scrollHeight}px`;
  });

  // Message click delegation listener (handles copying and retries)
  messagesEl.addEventListener('click', (e) => {
    // Copy code button click
    const copyBtn = e.target.closest('.copy-code-btn');
    if (copyBtn) {
      const rawCode = decodeURIComponent(copyBtn.dataset.code);
      navigator.clipboard.writeText(rawCode).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span class="copy-icon">✅</span> Copied!`;
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
      return;
    }

    // Retry query button click
    const retryBtn = e.target.closest('.retry-msg-btn');
    if (retryBtn) {
      if (lastUserMessageText) {
        inputEl.value = lastUserMessageText;
        sendMessage();
      }
      return;
    }
  });

  loadHistory();
  newChatBtn.click();
});
