Shown after the founder has explicitly stopped recording and before anything is sent to the planner. The transcript is editable; ambiguous place names, numbers and acronyms are flagged beneath it. Only the text the founder confirms is submitted to the planner; "Discard transcript" abandons it; there is no auto-send.

Transcription is not sending: to produce the transcript the audio has already been processed by the transcription provider. The component therefore never claims that audio was not sent or not kept. It renders a `disclosure` line naming the provider and the verified retention behaviour; when the consumer omits it, a visible placeholder renders so that unverified wording cannot ship silently. The same disclosure must appear before recording starts (see the SB3 Ask board).

Consumer provides: `transcript`, `flagged` (`[{word, reason}]`), `onSend(text)`, `onDiscard`, `disclosure` (verified wording; provisional until the provider is chosen).
