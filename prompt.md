AI, don't edit this file

#

- video should be slower, take around 120 seconds
- add HOW TO USE slide
  - install on every server ( and laptop )
  - schedule with cron
  - get briefing on Telegram

#

this is for servers, not laptops only

#

- explain TEE - data in encrypted on host and decrypted only in the LLM host GPU
- change

  printf '\n  %scyberSOCks TEE mode%s uses NEAR AI DeepSeek V4 Flash\n' "$C" "$R"

give list of 4 best models in TEE on NEAR AI
- Qwen 3.6 35B A3B FP8
- Kimi 2.6
- GLM 5.2
- DeepSeek v4 Flash

- "node.js with zero deps - no npm supply chain attack risk" - remove lapto ready

- add 5 second slide: DEMO TIME



#

use VHS tool to make a video with text

slides:

- what is SOC
- why companies can use LLM socks ( data exposure )
- what is:
  - TEE private models
  - uncensored models
- what is NEAR AI
- CyberSOCks
  - cron daily briefing on Telegram with actionable steps
- run the tool in the cli
- link to github + thank you




#

NEAR AI is crashing

all send to telegram is:

🟡 cyberSOCks · daily SOC briefing
━━━━━━━━━━━━━━━━━━━━
🖥 Host  hp14c
🕒 Time  2026-08-01T12:00:00Z
🔐 Mode  TEE · confidential
🧠 Analyst  NEAR AI Cloud
   Qwen 3.6 35B A3B FP8
   Qwen/Qwen3.6-35B-A3B-FP8
📊 Sensors  🟡1  🔵1
━━━━━━━━━━━━━━━━━━━━
🟡 Posture · AMBER

🟡 AMBER


📌 Top findings
• Open ports need review
• 8 packages pending


📌 Actions
▪ Patch packages
▪ Review listeners

then it hangs
