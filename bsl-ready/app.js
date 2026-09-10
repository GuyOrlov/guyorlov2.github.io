const steps = [...document.querySelectorAll('.question')];
const form = document.getElementById('bookingForm');
const checklist = document.getElementById('checklist');
const results = document.getElementById('results');
const startButton = document.getElementById('startButton');
const nextButton = document.getElementById('nextButton');
const backButton = document.getElementById('backButton');
const restartButton = document.getElementById('restartButton');
const progressLabel = document.getElementById('progressLabel');
const progressBar = document.getElementById('progressBar');
const formError = document.getElementById('formError');
const resultList = document.getElementById('resultList');
const scoreValue = document.getElementById('scoreValue');
const scoreRing = document.getElementById('scoreRing');
const scoreTitle = document.getElementById('scoreTitle');
const scoreMessage = document.getElementById('scoreMessage');
const recommendation = document.getElementById('recommendation');
const quoteButton = document.getElementById('quoteButton');
let currentStep = 0;
function track(eventName, detail = {}) {
  try {
    const demo = JSON.parse(localStorage.getItem('bslReadyDemoAnalytics') || '{}');
    demo[eventName] = (demo[eventName] || 0) + 1;
    localStorage.setItem('bslReadyDemoAnalytics', JSON.stringify(demo));
  } catch (_) {}
  if (window.dataLayer && Array.isArray(window.dataLayer)) window.dataLayer.push({ event: eventName, ...detail });
  document.dispatchEvent(new CustomEvent('bslready:analytics', { detail: { event: eventName, ...detail } }));
}
function showStep(index) {
  currentStep = index;
  steps.forEach((step, i) => step.classList.toggle('active', i === index));
  progressLabel.textContent = `Question ${index + 1} of ${steps.length}`;
  progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;
  backButton.hidden = index === 0;
  nextButton.textContent = index === steps.length - 1 ? 'See my result' : 'Continue';
  formError.textContent = '';
  track('checklist_step_view', { step: index + 1 });
}
function currentStepIsValid() {
  const current = steps[currentStep];
  const required = [...current.querySelectorAll('[required]')];
  for (const field of required) {
    if (field.type === 'radio') {
      const group = current.querySelectorAll(`input[name="${field.name}"]`);
      if (![...group].some(r => r.checked)) return false;
    } else if (!String(field.value).trim()) return false;
  }
  return true;
}
startButton.addEventListener('click', () => { checklist.hidden = false; checklist.scrollIntoView({ behavior: 'smooth' }); track('checklist_start'); showStep(0); });
nextButton.addEventListener('click', () => {
  if (!currentStepIsValid()) { formError.textContent = 'Please answer this question before continuing.'; return; }
  if (currentStep < steps.length - 1) showStep(currentStep + 1); else showResults();
});
backButton.addEventListener('click', () => { if (currentStep > 0) showStep(currentStep - 1); });
restartButton.addEventListener('click', () => { form.reset(); results.hidden = true; checklist.hidden = false; showStep(0); checklist.scrollIntoView({ behavior: 'smooth' }); track('checklist_restart'); });
function value(name) { const field = form.elements[name]; if (!field) return ''; if (field instanceof RadioNodeList) return field.value; return field.value; }
function durationMinutes() {
  const start = value('startTime'), end = value('endTime'); if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number), [eh, em] = end.split(':').map(Number);
  let minutes = (eh * 60 + em) - (sh * 60 + sm); if (minutes < 0) minutes += 1440; return minutes;
}
function prettyDate(raw) { if (!raw) return 'Not supplied'; const date = new Date(`${raw}T12:00:00`); return new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(date); }
function scoreBooking() {
  const checks = [
    { ok: !!value('bookingType'), label: 'Purpose of booking', good: value('bookingType'), bad: 'Confirm what the booking is for.' },
    { ok: !!value('date') && !!value('startTime') && !!value('endTime'), label: 'Date and times', good: `${prettyDate(value('date'))}, ${value('startTime')}–${value('endTime')}`, bad: 'Confirm the date, start time and finish time.' },
    { ok: !!value('format') && !!value('location'), label: 'Location / platform', good: `${value('format')} — ${value('location')}`, bad: 'Confirm where or how the session will take place.' },
    { ok: Number(value('deafUsers')) > 0, label: 'Number of Deaf BSL users', good: `${value('deafUsers')} person${Number(value('deafUsers')) === 1 ? '' : 's'}`, bad: 'Confirm how many people need communication support.' },
    { ok: value('preference') === 'Yes', label: 'Communication preference', good: 'Confirmed with the Deaf person', bad: value('preference') === 'Not sure' ? 'Ask the Deaf person what communication support they prefer.' : 'Communication preference has not yet been confirmed.' },
    { ok: !!value('contentType'), label: 'Type of content', good: value('contentType'), bad: 'Describe the subject or content.' },
    { ok: value('prep') === 'Yes' || value('prep') === 'Not applicable', label: 'Preparation material', good: value('prep') === 'Yes' ? 'Available to send' : 'Not applicable', bad: 'Gather any agenda, slides, scripts, names or specialist terms you can provide.' },
    { ok: value('recording') !== 'Not sure', label: 'Recording / livestream', good: value('recording') === 'Yes' ? 'Yes — tell the provider before booking' : 'No', bad: 'Confirm whether the interpreter will be filmed, livestreamed or photographed.' }
  ];
  const score = Math.round((checks.filter(c => c.ok).length / checks.length) * 100); return { score, checks };
}
function recommendationText() {
  const mins = durationMinutes(); const type = value('contentType'); const booking = value('bookingType'); const recording = value('recording');
  const complex = ['Technical or specialist','Medical or healthcare','Legal or formal','Performance, stage or public presentation'].includes(type);
  const highDemand = mins >= 90 || complex || booking === 'Conference, exhibition or public event' || recording === 'Yes';
  if (highDemand) return '<strong>Ask about interpreter teaming.</strong> Your answers suggest this may be a longer, specialist, public-facing or recorded assignment. More than one interpreter can sometimes be appropriate. cSeeker should review the full details before confirming the team.';
  return '<strong>Likely straightforward to review.</strong> One interpreter may be suitable for some shorter, simpler assignments, but the provider should confirm this after checking the duration, content and the Deaf person’s needs.';
}
function buildMailto() {
  const body = ['Hello cSeeker,','','I used BSL Ready and would like a quote for BSL interpreting support.','',`Booking type: ${value('bookingType')}`,`Date: ${prettyDate(value('date'))}`,`Time: ${value('startTime')}–${value('endTime')}`,`Format: ${value('format')}`,`Venue / platform: ${value('location')}`,`Number of Deaf BSL users: ${value('deafUsers')}`,`Communication preference confirmed: ${value('preference')}`,`Content: ${value('contentType')}`,`Preparation material: ${value('prep')}`,`Filmed / livestreamed / photographed: ${value('recording')}`,`Additional information: ${value('notes') || 'None supplied'}`,'','Please let me know the recommended support and quote.','','Thank you'].join('\n');
  const subject = `BSL interpreter quote request — ${prettyDate(value('date'))}`;
  return `mailto:bookings@cseeker.co.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function showResults() {
  const { score, checks } = scoreBooking();
  resultList.innerHTML = checks.map(check => `<li><span class="icon ${check.ok ? 'ok' : 'warn'}" aria-hidden="true">${check.ok ? '✓' : '!'}</span><div><strong>${check.label}</strong><p>${check.ok ? check.good : check.bad}</p></div></li>`).join('');
  scoreValue.textContent = `${score}%`; scoreRing.style.background = `conic-gradient(var(--brand) ${score * 3.6}deg,#e0dbf4 ${score * 3.6}deg)`;
  if (score >= 88) { scoreTitle.textContent = 'You are ready to ask for a quote'; scoreMessage.textContent = 'You have most of the information a provider will need to review your request.'; }
  else if (score >= 63) { scoreTitle.textContent = 'Almost ready'; scoreMessage.textContent = 'You have the main details. Check the highlighted items before the booking is confirmed.'; }
  else { scoreTitle.textContent = 'A few details are still missing'; scoreMessage.textContent = 'That is normal for a first booking. Use the checklist below to fill the gaps.'; }
  recommendation.innerHTML = recommendationText(); quoteButton.href = buildMailto(); checklist.hidden = true; results.hidden = false; results.scrollIntoView({ behavior: 'smooth' }); track('checklist_complete', { readiness_score: score });
}
quoteButton.addEventListener('click', () => track('quote_click'));
