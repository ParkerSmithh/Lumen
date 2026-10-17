# Smart Camera physical acceptance — NOT RUN

October 17, 2026. No physical webcam or real touchscreen session was performed. Synthetic canvas streams, fake permission states and mock tracking responses do not establish browser/device compatibility. This checklist supplements, and does not replace, existing ENERGY RUSH, QoL, neon and body-illumination acceptance checklists.

Record OS, exact browser version, camera model, input method, lighting, commit SHA and observer. Use localhost or trusted HTTPS; do not deploy merely to perform acceptance. Record written observations and scalar timings only; no webcam footage or biometric data is needed.

| ID | Procedure and expected outcome | Status |
|---|---|---|
| SC01 | First visit without saved preference: no automatic capture or permission prompt; manual Connect starts the browser permission flow | NOT RUN |
| SC02 | Connect, choose specific webcam, enable Remember and Auto; reload: correct webcam automatically plays when permission can be confirmed granted | NOT RUN |
| SC03 | Close and reopen browser with persisted permission/preferences: same return behavior; document browser policies that require a click | NOT RUN |
| SC04 | Deny permission: no repeated prompts or retries; clear manual recovery and alternate controls remain available | NOT RUN |
| SC05 | Revoke browser/OS camera permission while active: stream stops, tracking/game pauses; no reconnect loop; allow permission and manually reconnect | NOT RUN |
| SC06 | Select another connected webcam: old capture stops before replacement, correct image appears and successful choice survives reload | NOT RUN |
| SC07 | Unplug saved webcam, reload: no silent switch to another camera; Change Camera recovers after explicit choice | NOT RUN |
| SC08 | Unplug active camera: bounded recovery/manual fallback, no busy retry loop; reconnect hardware and explicitly recover | NOT RUN |
| SC09 | Camera already in use by another app: actionable error, no leaked stream or repeated permission flow | NOT RUN |
| SC10 | Disconnect while active or permission pending: no immediate restart during mode/gallery navigation; late approved capture is released; explicit Reconnect works | NOT RUN |
| SC11 | Auto off: no capture on reload; Remember off: preference removed and Auto off; Forget removes only camera preference and does not stop a live stream | NOT RUN |
| SC12 | Disable browser storage/private-mode restrictions: app remains usable and settings explain page-session-only behavior | NOT RUN |
| SC13 | Android Chrome and iOS/iPadOS Safari: front/rear switch, portrait/landscape, safe-area and browser viewport changes, permission/autoplay fallback | NOT RUN |
| SC14 | Chrome/Edge/Firefox desktop and macOS Safari: record permission-query support and actual return behavior; unsupported query gives one manual action | NOT RUN |
| SC15 | During startup switch modes/devices rapidly and disconnect/reconnect: latest intended camera only, no multiple capture indicators or worker accumulation | NOT RUN |
| SC16 | Switch GLOW/BODYSHIFT/ENERGY RUSH/FLOW/SLASH/LAUNCH/HOW TO PLAY/ECHOES: retain one camera; appropriate tracking, calibration and explicit round resume stay intact | NOT RUN |
| SC17 | Tracking fails with camera live: readiness says tracking unavailable, no automatic camera restart; retry tracking/alternate input works | NOT RUN |
| SC18 | Background while permission/startup pending: automatic startup must not complete into hidden-page capture; return offers manual recovery | NOT RUN |
| SC19 | Keyboard and real touch: settings focus stays inside modal, Escape/Close returns focus, controls scroll into reach on short landscape screens | NOT RUN |
| SC20 | Thirty-minute session with 50 stop/start/switch cycles: no capture/resource accumulation; record startup/recovery, tracking cadence, thermal/battery observations | NOT RUN |

Timing fields: navigation→live video; live video→tracker initialized; initialized→valid body/hand detection; unexpected loss→live video and recovered tracking. Report permission-decision time separately. A capture indicator alone is not tracking readiness. Mark PASS only with real observations; unavailable hardware remains NOT RUN with reason.
