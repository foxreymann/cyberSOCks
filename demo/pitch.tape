# cyberSOCks pitch — VHS tape (~120s)
# Render: PATH="$HOME/go/bin:$PATH" vhs demo/pitch.tape

Output demo/cybersocks-pitch.gif
Output demo/cybersocks-pitch.mp4

Require bash
Require node
Require ttyd
Require ffmpeg

Set Shell bash
Set FontSize 18
Set Width 1280
Set Height 720
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 22ms
Set Framerate 24
Set PlaybackSpeed 1.0
Set CursorBlink false

# Chromium for headless capture
Env VHS_BROWSER "/usr/bin/chromium-browser"

Hide
Type "cd /home/user/code/foxreymann/cch && chmod +x demo/slides.sh && export PS1='$ ' && clear"
Enter
Sleep 500ms
Show

# ─── Slide 1: SOC ───
Type "./demo/slides.sh soc"
Enter
Sleep 8s

# ─── Slide 2: data exposure ───
Type "./demo/slides.sh risk"
Enter
Sleep 9s

# ─── Slide 3: TEE + uncensored ───
Type "./demo/slides.sh models"
Enter
Sleep 10s

# ─── Slide 4: NEAR AI ───
Type "./demo/slides.sh near"
Enter
Sleep 10s

# ─── Slide 5: cyberSOCks product ───
Type "./demo/slides.sh product"
Enter
Sleep 9s

# ─── Slide 6: How to use ───
Type "./demo/slides.sh howto"
Enter
Sleep 10s

# ─── Slide 7: DEMO TIME ───
Type "./demo/slides.sh demo"
Enter
Sleep 4s

# ─── Slide 8: live CLI run ───
Hide
Type "clear"
Enter
Show
Type "node cybersocks.js audit --tee --quiet"
Enter
# TEE audit ~15–25s; leave headroom + reading time for the briefing
Sleep 40s

# ─── Slide 9: GitHub + thanks ───
Hide
Type "clear"
Enter
Show
Type "./demo/slides.sh thanks"
Enter
Sleep 10s

Hide
Type "clear"
Enter
Show
Sleep 2s
