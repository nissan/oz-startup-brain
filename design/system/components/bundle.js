/* @ds-bundle: {"format":4,"namespace":"OzStartupBrain","components":[{"name":"Button"},{"name":"EvidenceLabel"},{"name":"StarterTask"},{"name":"ContextChip"},{"name":"ClarificationPrompt"},{"name":"NextStepCard"},{"name":"SourcePanel"},{"name":"ComparisonTable"},{"name":"PrerequisiteMap"},{"name":"Checklist"},{"name":"CoverageBanner"},{"name":"WaitingState"},{"name":"LimitPanel"},{"name":"TranscriptReview"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  var PATHS = {
    tick: 'M4 12.5l5 5L20 7',
    clock: 'M12 7v5l3.5 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    disagree: 'M4 8h12m0 0l-3-3m3 3l-3 3M20 16H8m0 0l3-3m-3 3l3 3',
    arrow: 'M5 12h14m0 0l-5-5m5 5l-5 5',
    outside: 'M12 3a9 9 0 0 1 0 18M12 3a9 9 0 0 0 0 18',
    pencil: 'M4 20l4-1 11-11-3-3L5 16l-1 4zM13 6l3 3'
  };
  function Icon(name) {
    var extra = name === 'outside' ? { strokeDasharray: '3 3' } : {};
    return h('svg', Object.assign({ className: 'osb-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, extra),
      h('path', { d: PATHS[name] }));
  }

  var STATES = {
    'checked': { word: 'Source checked', icon: 'tick' },
    'needs-check': { word: 'Needs a current check', icon: 'clock' },
    'disagree': { word: 'Sources disagree', icon: 'disagree' },
    'suggested': { word: 'Suggested next step', icon: 'arrow' },
    'outside': { word: 'Outside current coverage', icon: 'outside' }
  };

  function Button(p) {
    var v = p.variant || 'secondary';
    return h('button', { type: p.type || 'button', className: 'osb osb-btn osb-btn--' + v, disabled: p.disabled, onClick: p.onClick }, p.children);
  }

  function EvidenceLabel(p) {
    var s = STATES[p.state] || STATES['outside'];
    return h('span', { className: 'osb osb-label osb-label--' + (STATES[p.state] ? p.state : 'outside') },
      Icon(s.icon), s.word,
      p.state === 'checked' ? h('span', { className: 'osb-label__date' }, ' ' + (p.date || 'date unknown')) : null);
  }

  function StarterTask(p) {
    return h('div', { className: 'osb osb-starters', role: 'group', 'aria-label': 'Start with a task' },
      (p.tasks || []).map(function (t, i) {
        return h('button', { key: i, type: 'button', className: 'osb-starter', 'aria-pressed': t.active ? 'true' : 'false', onClick: function () { p.onSelect && p.onSelect(t.id); } },
          h('span', { className: 'osb-starter__title' }, t.title),
          t.hint ? h('span', { className: 'osb-starter__hint' }, t.hint) : null);
      }));
  }

  function ContextChip(p) {
    var unknown = p.unknown || p.value == null;
    return h('button', { type: 'button', className: 'osb osb-chip' + (unknown ? ' osb-chip--unknown' : ''), onClick: p.onEdit, 'aria-label': p.label + ': ' + (unknown ? 'Unknown' : p.value) + '. Edit' },
      h('span', { className: 'osb-chip__key' }, p.label),
      h('span', { className: 'osb-chip__value' }, unknown ? 'Unknown' : p.value),
      Icon('pencil'));
  }

  function ClarificationPrompt(p) {
    return h('div', { className: 'osb osb-card osb-clarify', role: 'group', 'aria-labelledby': 'osb-clarify-q' },
      h('div', { className: 'osb-caption' }, 'We need one detail'),
      h('p', { className: 'osb-clarify__q', id: 'osb-clarify-q' }, p.question),
      p.why ? h('p', { className: 'osb-caption', style: { margin: '0 0 12px' } }, p.why) : null,
      h('div', { className: 'osb-clarify__opts' },
        (p.options || []).map(function (o, i) { return h(Button, { key: i, onClick: function () { p.onConfirm && p.onConfirm(o); } }, o); }),
        h(Button, { variant: 'primary', onClick: p.onUnknown }, 'Keep as unknown')));
  }

  function NextStepCard(p) {
    var ev = p.evidence || {};
    return h('article', { className: 'osb osb-card' },
      h('h3', { className: 'osb-card__title' }, p.title),
      h('div', { className: 'osb-card__row' }, h('span', { className: 'osb-card__key' }, 'Why'), h('span', null, p.why)),
      p.check && p.check.length ? h('div', { className: 'osb-card__row' }, h('span', { className: 'osb-card__key' }, 'What to check'), h('ul', null, p.check.map(function (c, i) { return h('li', { key: i }, c); }))) : null,
      h('div', { className: 'osb-card__row' }, h('span', { className: 'osb-card__key' }, 'Evidence'),
        h('span', null, h(EvidenceLabel, { state: ev.state || 'outside', date: ev.date }), ev.publisher ? h('span', { className: 'osb-caption' }, ' ' + ev.publisher) : null)),
      p.door ? h('div', { className: 'osb-card__row' }, h('span', { className: 'osb-card__key' }, 'Next door'), h('span', null, p.door)) : null,
      h('div', { className: 'osb-card__actions' },
        h(Button, { variant: 'primary', onClick: p.onInspect }, 'Show supporting passage'),
        p.onAsk ? h(Button, { onClick: p.onAsk }, 'What should I ask?') : null));
  }

  function SourcePanel(p) {
    return h('section', { className: 'osb osb-card osb-source', 'aria-label': 'Source ' + (p.title || '') },
      h('div', null, h(EvidenceLabel, { state: p.state || 'checked', date: p.verifiedAt || undefined })),
      h('h3', { className: 'osb-card__title', style: { fontSize: '20px', lineHeight: '26px', fontFamily: 'var(--font-sans)', fontWeight: 700, marginTop: '8px' } }, p.title),
      h('dl', null,
        h('dt', null, 'Publisher'), h('dd', null, p.publisher || 'unknown'),
        h('dt', null, 'Source version'), h('dd', null, p.sourceVersionDate || 'unknown'),
        h('dt', null, 'Verified'), h('dd', null, p.verifiedAt || 'unknown'),
        p.effectiveFrom ? h('dt', null, 'Takes effect') : null, p.effectiveFrom ? h('dd', null, p.effectiveFrom) : null,
        h('dt', null, 'Link'), h('dd', null, h('a', { className: 'osb-link', href: p.url, target: '_blank', rel: 'noopener' }, p.url))),
      p.excerpt ? h('blockquote', { className: 'osb-source__excerpt' }, p.excerptBefore || '', p.excerptMark ? h('mark', null, p.excerptMark) : null, p.excerpt) : h('p', { className: 'osb-caption', style: { marginTop: '12px' } }, 'Excerpt not shown: this source is not cleared for redistribution. Open the publisher link to read it.'));
  }

  function ComparisonTable(p) {
    var options = p.options || [];
    return h('div', { className: 'osb osb-table-wrap' }, h('table', { className: 'osb-table' },
      h('caption', null, p.caption || 'Compare options', p.asOf ? h('span', { className: 'osb-caption' }, ' · as of ' + p.asOf) : null),
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, h('span', { className: 'osb-sr' }, 'Criterion')), options.map(function (o, i) { return h('th', { key: i, scope: 'col' }, o.name); }))),
      h('tbody', null, (p.criteria || []).map(function (c, ci) {
        return h('tr', { key: ci }, h('th', { scope: 'row' }, c),
          options.map(function (o, oi) {
            var cell = (o.cells || [])[ci] || {};
            if (cell.unknown || cell.value == null) return h('td', { key: oi, className: 'osb-cell--unknown' }, 'Unknown');
            return h('td', { key: oi }, cell.value,
              cell.evidence ? h('span', { className: 'osb-cell__ev' }, h(EvidenceLabel, cell.evidence), ' ', h('button', { type: 'button', className: 'osb-link', onClick: function () { p.onInspect && p.onInspect(oi, ci); } }, 'Open evidence')) : null);
          }));
      }))));
  }

  function PrerequisiteMap(p) {
    var nodes = (p.nodes || []).slice(0, 5);
    var W = 320, pitch = 56, H = nodes.length * pitch + 16;
    var items = nodes.map(function (n, i) {
      var y = 28 + i * pitch;
      return h('g', { key: n.id },
        i > 0 ? h('path', { className: 'osb-map__rail' + (n.kind === 'editorial' ? ' osb-map__rail--editorial' : ''), d: 'M28 ' + (y - pitch + 14) + ' V ' + (y - 14) }) : null,
        h('circle', { className: 'osb-map__node' + (n.current ? ' osb-map__node--current' : ''), cx: 28, cy: y, r: 14 }),
        h('text', { className: 'osb-map__text', x: 28, y: y + 5, textAnchor: 'middle' }, String(i + 1)),
        h('text', { className: 'osb-map__text', x: 56, y: y + 5 }, n.label));
    });
    return h('div', { className: 'osb osb-map' },
      h('svg', { className: 'osb-map__svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Prerequisite sequence; the list beside it is equivalent' }, items),
      h('ol', { className: 'osb-map__list', 'aria-label': 'Prerequisite sequence as a list' }, nodes.map(function (n) {
        return h('li', { key: n.id }, h('span', { style: { fontWeight: n.current ? 700 : 400 } }, n.label), ' ',
          h(EvidenceLabel, { state: n.kind === 'editorial' ? 'suggested' : (n.state || 'checked'), date: n.date }),
          n.status ? h('span', { className: 'osb-caption' }, ' · your status: ' + n.status) : null);
      })));
  }

  function Checklist(p) {
    return h('section', { className: 'osb osb-card osb-check', 'aria-label': 'Next-step checklist' },
      h('h3', { className: 'osb-card__title' }, p.title || 'My next-step checklist'),
      h('ul', { className: 'osb-check__items' }, (p.items || []).map(function (it, i) {
        return h('li', { key: i },
          h('input', { type: 'checkbox', id: 'osb-ck-' + i, defaultChecked: !!it.done, onChange: function (e) { p.onToggle && p.onToggle(i, e.target.checked); } }),
          h('label', { htmlFor: 'osb-ck-' + i }, it.text, it.evidence ? h('span', { className: 'osb-cell__ev' }, h(EvidenceLabel, it.evidence)) : null));
      })),
      h('p', { className: 'osb-caption osb-check__meta' }, 'Ticking an item records your progress; it does not change what the sources say.'),
      h('div', { className: 'osb-mono osb-caption' }, 'context: ' + (p.context || '') + ' · corpus ' + (p.corpusVersion || '?') + ' · as of ' + (p.asOf || '?')),
      h('p', { className: 'osb-caption', style: { margin: '8px 0 0' } }, 'This checklist is information and routing, not an application or approval.'),
      h('div', { className: 'osb-card__actions' }, h(Button, { variant: 'primary', onClick: p.onExport }, 'Export checklist'), h(Button, { onClick: p.onEditContext }, 'Edit an assumption')));
  }

  function CoverageBanner(p) {
    var js = (p.jurisdictions || []).join(', ') || 'none yet';
    return h('div', { className: 'osb osb-banner', role: 'status' },
      h('span', null, 'The planner provides information and routing, not advice or approval.'),
      h('span', null, 'Covers: ', h('strong', null, js)),
      h('span', { className: 'osb-mono' }, 'corpus ' + (p.corpusVersion || '?') + ' · as of ' + (p.asOf || '?')),
      p.credentialMode === 'development' ? h('span', null, h('strong', null, 'Development mode'), ' — fixture data, not live sources') : null);
  }

  function WaitingState(p) {
    var steps = ['Finding sources', 'Checking dates', 'Building your route'];
    var idx = { finding: 0, checking: 1, building: 2 }[p.stage] || 0;
    return h('div', { className: 'osb osb-wait', role: 'status', 'aria-live': 'polite' },
      h('ol', { className: 'osb-wait__steps' }, steps.map(function (s, i) { return h('li', { key: i, 'aria-current': i === idx ? 'step' : undefined }, (i < idx ? '✓ ' : '') + s); })));
  }

  function LimitPanel(p) {
    var copy = {
      historical: { title: 'Current status is unverified', body: 'The only material about this round is from an earlier snapshot. The planner will not present it as current.', state: 'needs-check', action: 'Open the official source' },
      disagree: { title: 'Two sources disagree', body: 'Both are shown with their dates. The planner does not pick one or average them.', state: 'disagree', action: 'Show both sources' },
      outside: { title: 'Outside current coverage', body: 'This jurisdiction is not in the reviewed corpus yet. The maintained source directory is the honest alternative to a generic national list.', state: 'outside', action: 'Open the source directory' },
      outage: { title: 'Live answers are unavailable', body: 'Source retrieval is not responding. Your draft is kept; a labelled static source directory is available meanwhile.', state: 'outside', action: 'Retry' },
      budget: { title: 'Today’s inference budget is used up', body: 'The planner has stopped paid work for today rather than keep charging. Your draft is kept.', state: 'needs-check', action: 'Open the source directory' }
    }[p.kind] || {};
    return h('section', { className: 'osb osb-card osb-limit osb-limit--' + p.kind, role: 'alert' },
      h('div', null, h(EvidenceLabel, { state: copy.state })),
      h('h3', { className: 'osb-card__title', style: { marginTop: '8px' } }, p.title || copy.title),
      h('p', { style: { margin: 0, fontSize: '17px', lineHeight: '26px' } }, p.body || copy.body),
      p.draft ? h('div', { className: 'osb-limit__draft' }, h('span', { className: 'osb-caption' }, 'Your draft, kept: '), p.draft) : null,
      h('div', { className: 'osb-card__actions' }, h(Button, { variant: 'primary', onClick: p.onAction }, p.actionLabel || copy.action), p.onSecondary ? h(Button, { onClick: p.onSecondary }, p.secondaryLabel || 'Change my context') : null));
  }

  function TranscriptReview(p) {
    var ref = React.useRef(null);
    return h('section', { className: 'osb osb-card osb-transcript', 'aria-label': 'Check your transcript' },
      h('h3', { className: 'osb-card__title', style: { fontSize: '20px', lineHeight: '26px', fontFamily: 'var(--font-sans)', fontWeight: 700 } }, 'Check your transcript'),
      h('label', { className: 'osb-caption', htmlFor: 'osb-transcript' }, 'Edit anything that was heard wrongly. Only the corrected text is sent; the recording is not kept.'),
      h('textarea', { id: 'osb-transcript', className: 'osb-transcript__text', defaultValue: p.transcript, ref: ref }),
      p.flagged && p.flagged.length ? h('ul', { className: 'osb-transcript__flags' }, p.flagged.map(function (f, i) { return h('li', { key: i }, h('mark', null, f.word), ' — ' + f.reason); })) : null,
      h('div', { className: 'osb-card__actions' },
        h(Button, { variant: 'primary', onClick: function () { p.onSend && p.onSend(ref.current ? ref.current.value : p.transcript); } }, 'Send corrected question'),
        h(Button, { onClick: p.onDiscard }, 'Discard transcript')));
  }

  window.OzStartupBrain = {
    Button: Button, EvidenceLabel: EvidenceLabel, StarterTask: StarterTask, ContextChip: ContextChip,
    ClarificationPrompt: ClarificationPrompt, NextStepCard: NextStepCard, SourcePanel: SourcePanel,
    ComparisonTable: ComparisonTable, PrerequisiteMap: PrerequisiteMap, Checklist: Checklist,
    CoverageBanner: CoverageBanner, WaitingState: WaitingState, LimitPanel: LimitPanel, TranscriptReview: TranscriptReview
  };
})();
