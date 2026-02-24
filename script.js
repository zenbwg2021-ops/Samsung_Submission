(function () {
  'use strict';

  const profileForm = document.getElementById('profile-form');
  const planSection = document.getElementById('plan-section');
  const planOutput = document.getElementById('plan-output');
  const planSummary = document.getElementById('plan-summary');
  const planDetails = document.getElementById('plan-details');
  const btnGenerate = document.getElementById('btn-generate');

  let userProfile = {
    weight: null,
    bodyFat: null,
    height: null,
    age: null
  };

  /**
   * Estimated health data from your Python AI (body & face scan).
   * When you integrate your Python backend, call: window.setAIHealthEstimate({ bodyFat, posture, ageRange, other })
   * and the plan generator will use these for a better workout plan.
   */
  let aiHealthEstimate = {
    facialScore: null,
    bodyFat: null,
    posture: null,
    ageRange: null,
    other: null
  };

  window.setAIHealthEstimate = function (data) {
    if (!data || typeof data !== 'object') return;
    if (data.facialScore != null) aiHealthEstimate.facialScore = data.facialScore;
    if (data.bodyFat != null) aiHealthEstimate.bodyFat = data.bodyFat;
    if (data.posture != null) aiHealthEstimate.posture = data.posture;
    if (data.ageRange != null) aiHealthEstimate.ageRange = data.ageRange;
    if (data.other != null) aiHealthEstimate.other = data.other;
    renderAIEstimate();
  };

  function renderAIEstimate() {
    var facialEl = document.getElementById('ai-facial-score');
    if (facialEl) facialEl.textContent = aiHealthEstimate.facialScore != null ? String(aiHealthEstimate.facialScore) : '—';
    document.getElementById('ai-bodyfat').textContent = aiHealthEstimate.bodyFat != null ? aiHealthEstimate.bodyFat + '%' : '—';
    document.getElementById('ai-posture').textContent = aiHealthEstimate.posture != null ? String(aiHealthEstimate.posture) : '—';
    document.getElementById('ai-age').textContent = aiHealthEstimate.ageRange != null ? String(aiHealthEstimate.ageRange) : '—';
    document.getElementById('ai-other').textContent = aiHealthEstimate.other != null ? String(aiHealthEstimate.other) : '—';
  }

  // Load saved profile from sessionStorage
  function loadProfile() {
    try {
      const saved = sessionStorage.getItem('fittrack-profile');
      if (saved) {
        const data = JSON.parse(saved);
        userProfile = data;
        document.getElementById('weight').value = data.weight ?? '';
        document.getElementById('bodyfat').value = data.bodyFat ?? '';
        document.getElementById('height').value = data.height ?? '';
        document.getElementById('age').value = data.age ?? '';
      }
    } catch (_) {}
  }

  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    userProfile = {
      weight: parseFloat(document.getElementById('weight').value) || null,
      bodyFat: parseFloat(document.getElementById('bodyfat').value) || null,
      height: parseFloat(document.getElementById('height').value) || null,
      age: parseInt(document.getElementById('age').value, 10) || null
    };
    sessionStorage.setItem('fittrack-profile', JSON.stringify(userProfile));
    planOutput.classList.add('hidden');
    // Optional: scroll to next section
    document.getElementById('camera-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function getBmi() {
    if (!userProfile.weight || !userProfile.height) return null;
    const h = userProfile.height / 100;
    return Math.round((userProfile.weight / (h * h)) * 10) / 10;
  }

  /** Body fat used for plan: prefer AI estimate when available, else manual input. */
  function getEffectiveBodyFat() {
    if (aiHealthEstimate.bodyFat != null) return aiHealthEstimate.bodyFat;
    return userProfile.bodyFat;
  }

  function getPreference() {
    const radio = document.querySelector('input[name="preference"]:checked');
    return radio ? radio.value : 'park';
  }

  function generateParkPlan() {
    const bmi = getBmi();
    const age = userProfile.age;
    const bodyFat = getEffectiveBodyFat();
    const usedAI = aiHealthEstimate.facialScore != null || aiHealthEstimate.bodyFat != null || aiHealthEstimate.posture != null;

    let intensity = 'moderate';
    if (bmi != null) {
      if (bmi < 18.5) intensity = 'light';
      else if (bmi >= 25) intensity = 'moderate-high';
    }
    if (bodyFat != null && bodyFat >= 25 && intensity === 'moderate') intensity = 'moderate-high';
    if (bodyFat != null && bodyFat < 15 && intensity === 'moderate-high') intensity = 'moderate';
    if (age && age > 50) intensity = intensity === 'moderate-high' ? 'moderate' : intensity;

    const plans = {
      light: {
        warmUp: '5 min light walk + dynamic stretches',
        main: [
          'Running track: 2–3 laps at easy pace (≈ 800 m)',
          'Rotational equipment: 2 sets per station, 30–45 sec work / 30 sec rest',
          'Stations: arm cycle, leg cycle, rower if available'
        ],
        coolDown: '5 min walk + static stretches'
      },
      moderate: {
        warmUp: '5–7 min jog or brisk walk + dynamic stretches',
        main: [
          'Running track: 4–5 laps, mix of jog and stride intervals',
          'Rotational equipment: 3 sets per station, 45–60 sec work / 20 sec rest',
          'Stations: full circuit (arm, leg, core, rower)'
        ],
        coolDown: '5 min walk + static stretches'
      },
      'moderate-high': {
        warmUp: '7 min jog + dynamic stretches and leg swings',
        main: [
          'Running track: 6–8 laps with 2–3 faster intervals',
          'Rotational equipment: 4 sets per station, 60 sec work / 15 sec rest',
          'Full circuit twice with minimal rest between stations'
        ],
        coolDown: '5–7 min walk + stretching'
      }
    };

    const plan = plans[intensity] || plans.moderate;
    const summary = usedAI
      ? `Using your profile and AI health estimates, we recommend a ${intensity} intensity session using the running track and rotational park equipment.`
      : `Based on your profile, we recommend a ${intensity} intensity session using the running track and rotational park equipment.`;
    return {
      type: 'Park facilities',
      summary,
      warmUp: plan.warmUp,
      main: plan.main,
      coolDown: plan.coolDown
    };
  }

  function generateCalisthenicsPlan() {
    const bmi = getBmi();
    const age = userProfile.age;
    const bodyFat = getEffectiveBodyFat();
    const usedAI = aiHealthEstimate.facialScore != null || aiHealthEstimate.bodyFat != null || aiHealthEstimate.posture != null;

    let level = 'intermediate';
    if (bmi != null && bmi < 18.5) level = 'beginner';
    else if (bmi != null && bmi >= 28) level = 'beginner';
    if (bodyFat != null && bodyFat >= 30) level = 'beginner';
    if (age && age > 50) level = 'beginner';

    const plans = {
      beginner: {
        warmUp: '5 min march in place, arm circles, leg swings',
        main: [
          'Push-ups (knee or wall): 2 sets of 8–10',
          'Bodyweight squats: 2 sets of 10–12',
          'Plank: 2 × 20–30 sec',
          'Glute bridges: 2 sets of 10',
          'Optional: resistance bands for rows and bicep curls'
        ],
        coolDown: '5 min stretch (chest, quads, hamstrings)'
      },
      intermediate: {
        warmUp: '5–7 min dynamic stretch + light cardio',
        main: [
          'Push-ups: 3 sets of 10–15',
          'Squats / jump squats: 3 sets of 12–15',
          'Plank: 3 × 30–45 sec',
          'Lunges: 2 sets of 10 per leg',
          'Optional: dumbbells or bands for rows, shoulder press, curls'
        ],
        coolDown: '5 min stretch'
      },
      advanced: {
        warmUp: '7 min dynamic warm-up + mobility',
        main: [
          'Push-ups / decline or diamond: 4 sets of 12–20',
          'Pistol squat progressions or jump squats: 3 sets of 10',
          'Plank + side plank: 3 × 45–60 sec',
          'Pull-ups or inverted rows: 3 sets to near failure',
          'Equipment: add weights or bands for overload'
        ],
        coolDown: '5–7 min full-body stretch'
      }
    };

    const plan = plans[level] || plans.intermediate;
    const summary = usedAI
      ? `Using your profile and AI health estimates, we've built a ${level} calisthenics plan you can do at home or in the gym, with optional equipment.`
      : `We've built a ${level} calisthenics plan you can do at home or in the gym, with optional equipment.`;
    return {
      type: 'Calisthenics / equipment',
      summary,
      warmUp: plan.warmUp,
      main: plan.main,
      coolDown: plan.coolDown
    };
  }

  function renderPlan(plan) {
    planSummary.textContent = plan.summary;
    planDetails.innerHTML =
      '<h4>Warm-up</h4><p>' + plan.warmUp + '</p>' +
      '<h4>Main workout</h4><ul><li>' + plan.main.join('</li><li>') + '</li></ul>' +
      '<h4>Cool-down</h4><p>' + plan.coolDown + '</p>';
    planOutput.classList.remove('hidden');
    planSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  btnGenerate.addEventListener('click', function () {
    const pref = getPreference();
    const plan = pref === 'park' ? generateParkPlan() : generateCalisthenicsPlan();
    renderPlan(plan);
  });

  // Camera and facial score (requires backend running: python app.py)
  var cameraStream = null;
  var videoEl = document.getElementById('camera-video');
  var canvasEl = document.getElementById('camera-canvas');
  var btnStart = document.getElementById('btn-camera-start');
  var btnStop = document.getElementById('btn-camera-stop');
  var btnGetScore = document.getElementById('btn-get-score');

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(function (t) { t.stop(); });
      cameraStream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
      videoEl.classList.add('hidden');
    }
    if (btnStart) btnStart.disabled = false;
    if (btnStop) btnStop.disabled = true;
    if (btnGetScore) btnGetScore.disabled = true;
  }

  btnStart.addEventListener('click', function () {
    if (cameraStream) return;
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then(function (stream) {
        cameraStream = stream;
        videoEl.srcObject = stream;
        videoEl.classList.remove('hidden');
        btnStart.disabled = true;
        btnStop.disabled = false;
        btnGetScore.disabled = false;
      })
      .catch(function (err) {
        console.error('Camera error:', err);
        alert('Could not access camera. Check permissions.');
      });
  });

  btnStop.addEventListener('click', stopCamera);

  btnGetScore.addEventListener('click', function () {
    if (!cameraStream || !videoEl || videoEl.readyState < 2) {
      alert('Start the camera and wait for the video to show.');
      return;
    }
    var ctx = canvasEl.getContext('2d');
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0);
    btnGetScore.disabled = true;
    canvasEl.toBlob(function (blob) {
      if (!blob) {
        btnGetScore.disabled = false;
        return;
      }
      var formData = new FormData();
      formData.append('image', blob, 'frame.jpg');
      fetch('/api/facial-score', {
        method: 'POST',
        body: formData
      })
        .then(function (res) {
          if (!res.ok) return res.json().then(function (j) { throw new Error(j.error || res.statusText); });
          return res.json();
        })
        .then(function (data) {
          var score = data.score != null ? data.score : 0;
          aiHealthEstimate.facialScore = score;
          setAIHealthEstimate({ facialScore: score });
          renderAIEstimate();
        })
        .catch(function (err) {
          var msg = 'Facial score failed: ' + err.message + '. ';
          if (window.location.protocol === 'file:') {
            msg += 'Open the site via the backend instead: run "python app.py" in the project folder, then go to http://localhost:5000';
          } else {
            msg += 'Make sure the backend is running: in the project folder run "python app.py"';
          }
          alert(msg);
        })
        .finally(function () {
          btnGetScore.disabled = false;
        });
    }, 'image/jpeg', 0.9);
  });

  // --- Energy dashboard logic ---
  function formatMoney(v) {
    return '$' + v.toFixed(2);
  }

  function updateEnergyDisplay(wh) {
    var valEl = document.getElementById('energy-value');
    var moneyEl = document.getElementById('energy-money');
    var fillEl = document.getElementById('energy-bar-fill');
    var barEl = document.getElementById('energy-bar');
    if (!valEl || !moneyEl || !fillEl || !barEl) return;
    var w = Math.max(0, Number(wh) || 0);
    valEl.textContent = w + ' Wh';
    // Conversion: 1000 Wh = $10 -> $0.01 per Wh
    var dollars = w * 0.01;
    moneyEl.textContent = formatMoney(dollars);

    var max = Number(barEl.getAttribute('data-max')) || 10000;
    var pct = Math.min(100, Math.round((w / max) * 100));
    fillEl.style.width = pct + '%';
  }

  function initEnergyDashboard() {
    var input = document.getElementById('energy-input');
    var btn = document.getElementById('energy-update');
    // load saved value
    try {
      var saved = sessionStorage.getItem('fittrack-energy-wh');
      if (saved != null && input) input.value = Number(saved);
    } catch (_) {}

    // initial render
    updateEnergyDisplay(input ? Number(input.value || 0) : 0);

    if (btn && input) {
      btn.addEventListener('click', function () {
        var v = Number(input.value) || 0;
        try { sessionStorage.setItem('fittrack-energy-wh', String(v)); } catch (_) {}
        updateEnergyDisplay(v);
      });
    }
  }

  initEnergyDashboard();

  loadProfile();
})();
