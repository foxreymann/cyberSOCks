# cyberSOCks pitch — VHS tape
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
Set TypingSpeed 12ms
Set Framerate 24
Set PlaybackSpeed 1.0
Set CursorBlink false

# Chromium for headless capture
Env VHS_BROWSER "/usr/bin/chromium-browser"

Hide
Type "cd /home/user/code/foxreymann/cch && chmod +x demo/slides.sh && export PS1='$ ' && clear"
Enter
Sleep 400ms
Show

# ─── Slide 1: SOC ───
Type "./demo/slides.sh soc"
Enter
Sleep 4s

# ─── Slide 2: data exposure ───
Type "./demo/slides.sh risk"
Enter
Sleep 4.5s

# ─── Slide 3: TEE + uncensored ───
Type "./demo/slides.sh models"
Enter
Sleep 5s

# ─── Slide 4: NEAR AI ───
Type "./demo/slides.sh near"
Enter
Sleep 5s

# ─── Slide 5: cyberSOCks product ───
Type "./demo/slides.sh product"
Enter
Sleep 5s

# ─── Slide 6: DEMO TIME ───
Type "./demo/slides.sh demo"
Enter
Sleep 5s

# ─── Slide 7: live CLI run ───
Hide
Type "clear"
Enter
Show
Type "node cybersocks.js audit --tee --quiet"
Enter
Sleep 12s

# ─── Slide 8: GitHub + thanks ───
Type "./demo/slides.sh thanks"
Enter
Sleep 5s

Hide
Type "clear"
Enter
Show
Sleep 1s
