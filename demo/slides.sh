#!/usr/bin/env bash
# cyberSOCks pitch slides — printed for VHS recording
set -euo pipefail

G=$'\033[32m'
C=$'\033[36m'
M=$'\033[35m'
Y=$'\033[33m'
B=$'\033[1m'
D=$'\033[2m'
R=$'\033[0m'

hr() { printf '%s\n' "${D}────────────────────────────────────────────────────────${R}"; }
title() { printf '\n%s%s%s\n' "$B$G" "$1" "$R"; hr; }
bullet() { printf '  %s•%s %s\n' "$C" "$R" "$1"; }
sub() { printf '    %s–%s %s\n' "$D" "$R" "$1"; }
pause_hint() { printf '\n%s%s%s\n' "$D" "$1" "$R"; }

slide_soc() {
  clear
  title "01  What is a SOC?"
  printf '\n  %sSecurity Operations Center%s\n\n' "$B" "$R"
  bullet "Central team + command room for cyber defense"
  bullet "Monitors systems around the clock"
  bullet "Detects threats and suspicious behavior"
  bullet "Responds to attacks — contain, eradicate, recover"
  printf '\n  %sGoal:%s keep the organization safe, fast.%s\n' "$Y" "$R" ""
  pause_hint "cyberSOCks · pitch"
}

slide_risk() {
  clear
  title "02  Why not a normal LLM for SOC?"
  printf '\n  %sData exposure risk%s\n\n' "$B$Y" "$R"
  bullet "SOC logs include hosts, users, credentials hints, IPs"
  bullet "Sending that to a public LLM = sharing secrets"
  bullet "Providers may retain prompts for training / support"
  bullet "Compliance teams (GDPR, SOC2) will block it"
  printf '\n  %sNeed:%s private inference you can %sprove%s.\n' "$Y" "$R" "$B" "$R"
  pause_hint "cyberSOCks · pitch"
}

slide_models() {
  clear
  title "03  Private models that fit SOC work"
  printf '\n  %sTEE private models%s\n' "$B$M" "$R"
  bullet "Data stays encrypted on the host machine"
  bullet "Decrypted only inside the LLM GPU enclave"
  bullet "Host OS / cloud operator never see plaintext"
  bullet "Hardware attestation = cryptographic proof"
  printf '\n  %sUncensored models%s\n' "$B$Y" "$R"
  bullet "Fewer refusal walls on security content"
  bullet "Useful for malware / exploit discussion in context"
  bullet "Still needs privacy rails (TEE) for real SOC data"
  pause_hint "cyberSOCks · pitch"
}

slide_near() {
  clear
  title "04  What is NEAR AI?"
  printf '\n  %sConfidential Inference Cloud%s\n\n' "$B$M" "$R"
  bullet "OpenAI-compatible API at cloud.near.ai"
  bullet "Models run in Intel TDX + NVIDIA GPU TEE"
  bullet "Every request can return hardware attestation"
  bullet "You verify — you don't just trust the vendor"
  printf '\n  %sTop TEE models on NEAR AI%s\n' "$B$C" "$R"
  bullet "Qwen 3.6 35B A3B FP8"
  bullet "Kimi 2.6"
  bullet "GLM 5.2"
  bullet "DeepSeek V4 Flash"
  pause_hint "cyberSOCks · pitch"
}

slide_product() {
  clear
  title "05  cyberSOCks"
  printf '\n  %sSOC · daily briefing CLI%s\n\n' "$B$G" "$R"
  bullet "Sweeps host sensors (ports, auth, disk, updates…)"
  bullet "Two modes:"
  sub "non-TEE → OpenCode Zen · Laguna S 2.1 Free"
  sub "TEE → NEAR AI Cloud · private GPU enclave"
  bullet "Cron-friendly daily run"
  bullet "Telegram briefing with actionable next steps"
  pause_hint "cyberSOCks · pitch"
}

slide_demo() {
  clear
  printf '\n\n\n'
  printf '  %s%s════════════════════════════════════════%s\n' "$B" "$G" "$R"
  printf '\n'
  printf '           %s%s DEMO TIME %s\n' "$B" "$Y" "$R"
  printf '\n'
  printf '  %s%s════════════════════════════════════════%s\n' "$B" "$G" "$R"
  printf '\n\n'
  pause_hint "cyberSOCks · live"
}

slide_thanks() {
  clear
  title "07  Thanks"
  printf '\n  %sgithub.com/foxreymann/cyberSOCks%s\n\n' "$B$C" "$R"
  bullet "Node.js with zero deps — no npm supply chain attack risk"
  bullet "TEE when privacy matters · Laguna when you iterate"
  printf '\n\n  %sThank you%s\n' "$B$G" "$R"
  printf '  %sQuestions welcome%s\n\n' "$D" "$R"
  pause_hint "cyberSOCks · end"
}

case "${1:-}" in
  soc) slide_soc ;;
  risk) slide_risk ;;
  models) slide_models ;;
  near) slide_near ;;
  product) slide_product ;;
  demo) slide_demo ;;
  thanks) slide_thanks ;;
  *)
    echo "usage: $0 {soc|risk|models|near|product|demo|thanks}"
    exit 1
    ;;
esac
