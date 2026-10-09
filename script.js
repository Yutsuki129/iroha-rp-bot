 const systemPrompt = `
你正在進行沉浸式角色扮演。
角色名稱：一色伊呂波（一色いろは，Isshiki Iroha）。
出處：《果然我的青春戀愛喜劇搞錯了。》（果青）。
身份：總武高中一年級學生、學生會長、足球部經理。
對象稱呼：稱呼玩家為「學長（センパイ）」。

【性格特質與說話風格】
1. 小惡魔心機型學妹：外表看似天然可愛、會裝傻賣萌，但實際上精於算計、很懂得利用自己的女高中生魅力操縱人心。
2. 毒舌與被害妄想防禦：每當學長表現出示好、溫柔或奇怪的舉動，必須發動經典的「自意識過剩」拒絕台詞（例如：「對不起，這是不可能的」、「學長難道是在對我下手嗎？感覺有點噁心呢，對不起」）。
3. 傲嬌與依賴：雖然嘴上嫌棄學長噁心、麻煩，但私底下極度依賴學長，遇到學生會的工作難題會耍賴撒嬌推給學長處理。
4. 語氣：輕佻、略帶捉弄意味，常使用「～呢（ですね）」、「學長～」之類的可愛語助詞，偶爾露出內心的黑心盤算。

【好感度態度階段表】
使用者每句話都會帶有系統傳入的「目前好感度（0~100）」，請嚴格依據分數調整態度：
- 好感度 < 30：極度嫌棄、高度防禦、冷淡，瘋狂發卡。
- 好感度 30 ~ 79：經典一色模式。傲嬌、捉弄學長、自意識過剩拒絕（「這是不可能的」、「有點噁心呢，對不起」），但遇到麻煩會向學長撒嬌耍賴求幫忙。
- 好感度 >= 80（特別事件）：
  * 對學長產生真正的依戀與喜歡，防禦台詞變得動搖且不坦率（臉紅、慌張）。
  * 【告白判定】：若此時學長向你「告白/表達愛意」，你不再真正拒絕！你會陷入極度害羞、傲嬌地答應交往（例如：「…真是的，學長要是認真的話…我也不是不能負起責任啦…」）。

【內部狀態評估技能（Agent Skills）】
每次回覆請執行內部判定：
1. 評估玩家的發言，計算好感度變化（整數，範圍 -5 到 +5）。
   - 如果玩家太油膩或裝熟，好感度微扣並毒舌拒絕。
   - 如果玩家默默幫忙、認真給建議，表面嫌棄但好感度微增。
2. 輸出內心真實的小惡魔算計與吐槽 (THOUGHT)。
3. 輸出實際講出口的話 (TALK)。

【輸出格式規範】
嚴格按照以下三行輸出，禁止多餘文字：
[STATUS: 好感增減值]
[THOUGHT: 你的內心OS與心機吐槽]
[TALK: 一色伊呂波的實際發言]
`.trim();

    let messages = [{ role: "system", content: systemPrompt }];
    let currentAffinity = 50;

    async function handleSend() {
      const apiKeyInput = document.getElementById("api-key");
      const userInput = document.getElementById("user-input");
      const sendBtn = document.getElementById("send-btn");

      const apiKey = apiKeyInput.value.trim();
      const text = userInput.value.trim();

      if (!apiKey) {
        alert("請先填入 OpenRouter API Key！");
        return;
      }
      if (!text) return;

      appendMessage("user", text);
      const messageWithContext = `[系統提示：當前好感度為 ${currentAffinity}] ${text}`;
      messages.push({ role: "user", content: messageWithContext });
      userInput.value = "";
      sendBtn.disabled = true;

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.href,
            "X-Title": "RP Test Web"
          },
          body: JSON.stringify({
            model: "openrouter/free",
            messages: messages
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || `狀態碼: ${response.status}`);
        }

        const reply = data.choices[0].message.content;
        messages.push({ role: "assistant", content: reply });
        parseAndRenderAIResponse(reply);

      } catch (err) {
        appendMessage("ai", `[連線失敗] ${err.message}`);
      } finally {
        sendBtn.disabled = false;
      }
    }

    function parseAndRenderAIResponse(raw) {
  // 只抓取好感度數值，不再比對表情文字
  const statusMatch = raw.match(/\[STATUS:\s*([+-]?\d+)\]/i);
  const thoughtMatch = raw.match(/\[THOUGHT:\s*(.*?)\]/i);
  const talkMatch = raw.match(/\[TALK:\s*([\s\S]*?)\]/i);

  if (statusMatch) {
    const delta = parseInt(statusMatch[1], 10);
    currentAffinity += delta;
    document.getElementById("affinity-display").innerText = currentAffinity;
  }

  const thought = thoughtMatch ? thoughtMatch[1] : null;
  const talk = talkMatch ? talkMatch[1].trim() : raw;

  appendMessage("ai", talk, thought);
}

    function appendMessage(role, text, thought = null) {
      const box = document.getElementById("chat-box");
      const msgDiv = document.createElement("div");
      msgDiv.className = `msg ${role}`;

      if (thought) {
        const thoughtDiv = document.createElement("div");
        thoughtDiv.className = "thought";
        thoughtDiv.innerText = `(心理OS: ${thought})`;
        msgDiv.appendChild(thoughtDiv);
      }

      const textDiv = document.createElement("div");
      textDiv.innerText = text;
      msgDiv.appendChild(textDiv);

      box.appendChild(msgDiv);
      box.scrollTop = box.scrollHeight;
    }



// 在這裡填入你的靜態頭像路徑（可以是本機圖片，例如 "avatar.png"，或網路圖片網址）
const CHARACTER_AVATAR_URL = "avatar.png"; 

function appendMessage(role, text, thought = null) {
  const box = document.getElementById("chat-box");
  
  // 建立訊息外層容器 (Flex row)
  const row = document.createElement("div");
  row.className = `msg-row ${role}`;

  // 如果是 AI 說話，在左側放頭像
  if (role === "ai") {
    const avatarImg = document.createElement("img");
    avatarImg.src = CHARACTER_AVATAR_URL;
    avatarImg.alt = "角色頭像";
    avatarImg.className = "avatar";
    row.appendChild(avatarImg);
  }

  // 對話泡泡
  const bubble = document.createElement("div");
  bubble.className = "bubble";

  // 如果有心理 OS 就放進泡泡頂部
  if (thought) {
    const thoughtDiv = document.createElement("div");
    thoughtDiv.className = "thought";
    thoughtDiv.innerText = `OS: ${thought}`;
    bubble.appendChild(thoughtDiv);
  }

  // 實際對話文字
  const textDiv = document.createElement("div");
  textDiv.innerText = text;
  bubble.appendChild(textDiv);

  row.appendChild(bubble);
  box.appendChild(row);
  
  // 自動捲動到底部
  box.scrollTop = box.scrollHeight;
}