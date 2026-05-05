import os

fp = 'c:/Users/one/Desktop/RetailMedia_System/store_portal.html'
with open(fp, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, l in enumerate(lines):
    if 'async function broadcastPriority() {' in l and 'const adText = document.getElementById' in lines[i+1]:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if 'speechSynthesis.speak(utterance);' in lines[i]:
            end_idx = i + 1 # Include the closing brace on the next line
            break

print("Start:", start_idx, "End:", end_idx)

new_speak_text = """
                async function speakText(text, type, forcePreview) {
                    if (!text) return;
                    
                    const manualSelection = document.getElementById('voice-engine');
                    const isGemini = manualSelection && manualSelection.value.startsWith('gemini_');
                    const isCloudApi = manualSelection && (manualSelection.value === "ja-JP-Neural2-B" || manualSelection.value === "ja-JP-Neural2-C" || manualSelection.value === "ja-JP-Neural2-D");
                    const preview = document.getElementById('video-preview');
                    const originalHtml = preview ? preview.innerHTML : '';

                    if (isGemini) {
                        console.log("[Voice] Using Gemini TTS (Proxy)");
                        if(preview) preview.innerHTML = '<div style="color:#e67e22; padding:20px;">🤖 Generating Gemini Voice...</div>';
                        
                        try {
                            const stylePrompt = document.getElementById('ai-style-prompt') ? document.getElementById('ai-style-prompt').value : "cheerfully";
                            const voiceName = manualSelection.value.replace('gemini_', '');

                            const response = await fetch('/api/voice/synthesize', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text, voiceName, stylePrompt })
                            });

                            const data = await response.json();
                            if (!response.ok || !data.success) {
                                throw new Error(data.message || "Failed to generate voice via backend proxy");
                            }

                            if (data.audioBase64) {
                                const binaryString = window.atob(data.audioBase64);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let i = 0; i < binaryString.length; i++) {
                                    bytes[i] = binaryString.charCodeAt(i);
                                }

                                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                                const playAudioBuffer = (buffer) => {
                                    const source = audioCtx.createBufferSource();
                                    source.buffer = buffer;
                                    source.connect(audioCtx.destination);
                                    source.onended = () => { const m = document.querySelector('.mascot-anim'); if (m) m.style.animation = 'none'; };
                                    const m = document.querySelector('.mascot-anim');
                                    if (m) m.style.animation = 'bounce 0.3s infinite alternate';
                                    source.start(0);
                                };

                                try {
                                    const bufferCopy = bytes.buffer.slice(0);
                                    const audioBuffer = await audioCtx.decodeAudioData(bufferCopy);
                                    playAudioBuffer(audioBuffer);
                                } catch (decodeErr) {
                                    const int16Array = new Int16Array(bytes.buffer);
                                    const audioBuffer = audioCtx.createBuffer(1, int16Array.length, 24000);
                                    const channelData = audioBuffer.getChannelData(0);
                                    for (let i = 0; i < int16Array.length; i++) {
                                        channelData[i] = int16Array[i] / 32768.0;
                                    }
                                    playAudioBuffer(audioBuffer);
                                }
                            } else {
                                throw new Error("No audio content returned from Gemini");
                            }
                        } catch (e) {
                            console.error("Gemini TTS Error:", e);
                            Swal.fire({
                                icon: 'error', title: 'Gemini Voice Generation Failed', html: `<div style="text-align:left; font-size:11px; color:red; max-height:150px; overflow:auto;">${e.message}</div>`
                            });
                        } finally {
                            if(preview) preview.innerHTML = originalHtml;
                        }
                        return;
                    }

                    if (isCloudApi) {
                        console.log("[Voice] Using Google Cloud Neural2 (Proxy)");
                        if(preview) preview.innerHTML = '<div style="color:#e67e22; padding:20px;">🤖 Generating Server Voice...</div>';

                        const api1 = window.location.origin + "/api/ai/tts";
                        const fallbackApi = "http://localhost:5000/api/ai/tts";
                        let fetchOptions = {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                text: text,
                                speed: parseFloat(document.getElementById('voice-speed').value || 1.0),
                                pitch: parseFloat(document.getElementById('voice-pitch') ? document.getElementById('voice-pitch').value : 0.0),
                                voiceEngine: manualSelection ? manualSelection.value : '',
                                stylePrompt: document.getElementById('ai-style-prompt') ? document.getElementById('ai-style-prompt').value : "元気な感じ"
                            })
                        };

                        try {
                            const response = await fetch(api1, fetchOptions);
                            if (!response.ok) {
                                const err = await response.json().catch(() => ({}));
                                throw new Error(err.error || "Server Proxy Error: " + response.status);
                            }
                            const data = await response.json();
                            if (data.audioContent) {
                                const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
                                audio.onplay = () => { const m = document.querySelector('.mascot-anim'); if (m) m.style.animation = 'bounce 0.3s infinite alternate'; };
                                audio.onended = () => { const m = document.querySelector('.mascot-anim'); if (m) m.style.animation = 'none'; };
                                audio.play();
                            }
                        } catch (e) {
                            console.error("TTS Proxy Error:", e);
                            try {
                                const response2 = await fetch(fallbackApi, fetchOptions);
                                if (!response2.ok) {
                                    const err2 = await response2.json().catch(() => ({}));
                                    throw new Error(err2.error || "Fallback failed with status: " + response2.status);
                                }
                                const data2 = await response2.json();
                                if (data2.audioContent) {
                                    const audio = new Audio("data:audio/mp3;base64," + data2.audioContent);
                                    audio.onplay = () => { const m = document.querySelector('.mascot-anim'); if (m) m.style.animation = 'bounce 0.3s infinite alternate'; };
                                    audio.onended = () => { const m = document.querySelector('.mascot-anim'); if (m) m.style.animation = 'none'; };
                                    audio.play();
                                }
                            } catch (e2) {
                                console.error(e2);
                                if (manualSelection && manualSelection.value !== "") {
                                    manualSelection.selectedIndex = 0;
                                    speakText(text, type, forcePreview);
                                }
                            }
                        } finally {
                            if(preview) preview.innerHTML = originalHtml;
                        }
                        return;
                    }

                    // Fallback to Web Speech API
                    if (typeof speechSynthesis === 'undefined') return;
                    
                    const utterance = new SpeechSynthesisUtterance(text);
                    const voiceSelect = document.getElementById('voice-engine');
                    if(voiceSelect && voiceSelect.selectedOptions[0]) {
                        const name = voiceSelect.selectedOptions[0].getAttribute('data-name');
                        const voices = speechSynthesis.getVoices();
                        const found = voices.find(v => v.name === name);
                        if (found) utterance.voice = found;
                    }
                    utterance.rate = parseFloat(document.getElementById('voice-speed').value) || 1.0;
                    utterance.pitch = (parseFloat(document.getElementById('voice-pitch') ? document.getElementById('voice-pitch').value : 0.0) / 10.0) + 1.0;
                    speechSynthesis.speak(utterance);
                }
"""

if start_idx != -1 and end_idx != -1:
    lines[start_idx:end_idx+1] = [new_speak_text + '\n']
    
    # Also fix loadPosData innerHTML error
    for i in range(len(lines)):
        if "document.getElementById('tx-history-list').innerHTML =" in lines[i]:
            lines[i] = lines[i].replace("document.getElementById('tx-history-list').innerHTML =", "const el = document.getElementById('tx-history-list'); if(el) el.innerHTML =")
        if "document.getElementById('company-sales-list').innerHTML =" in lines[i]:
            lines[i] = lines[i].replace("document.getElementById('company-sales-list').innerHTML =", "const cEl = document.getElementById('company-sales-list'); if(cEl) cEl.innerHTML =")
        if "document.getElementById('pos-total-sales').innerText =" in lines[i]:
            lines[i] = lines[i].replace("document.getElementById('pos-total-sales').innerText =", "const stEl = document.getElementById('pos-total-sales'); if(stEl) stEl.innerText =")
        if "document.getElementById('pos-total-customers').innerText =" in lines[i]:
            lines[i] = lines[i].replace("document.getElementById('pos-total-customers').innerText =", "const cuEl = document.getElementById('pos-total-customers'); if(cuEl) cuEl.innerText =")
            
    with open(fp, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Fixed store_portal.html")
else:
    print("Could not find bounds of broken broadcastPriority")

