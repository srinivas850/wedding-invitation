/**
 * Premium Virtual Wedding Invitation JS
 * Wedding of Nani ❤️ Lakshmi
 * Fully optimized for older mobile devices (4GB RAM) and slow connections.
 */

// --- GLOBAL SETTINGS CONFIGURATION ---
const CONFIG = {
    whatsappNumber: "919999999999", // Couple's phone number with country code, without '+' or spaces
    adminPin: "1234",                // RSVP Admin Console passcode
    
    // --- WEDDING BACKGROUND MUSIC CONFIGURATION ---
    // You can easily use your favorite song from Venkatesh movies!
    // 1. Download the MP3 of your choice (e.g. Kalisundam Raa or Malliswari wedding tracks)
    // 2. Put it in your "assets/" folder, and rename it to "wedding-music.mp3"
    // 3. Update the audioUrl below to: "assets/wedding-music.mp3" to play it offline/instantly!
    audioUrl: "https://archive.org/download/south-indian-wedding-nadaswaram-traditional-instrumental/south-indian-wedding-nadaswaram-traditional-instrumental.mp3",
    audioFallbackUrl: "https://archive.org/download/traditional-telugu-wedding-mangala-vadyam/traditional-telugu-wedding-mangala-vadyam.mp3"
};

document.addEventListener("DOMContentLoaded", () => {
    
    // --- STATE MANAGEMENT ---
    const state = {
        isOpened: false,
        isMusicPlaying: false,
        audioContext: null,
        audioElement: null,
        currentSlide: 0,
        petals: [],
        canvas: null,
        ctx: null,
        animationFrameId: null,
        rsvpList: JSON.parse(localStorage.getItem("rsvp_entries") || "[]"),
        logoTapCount: 0,
        logoTapTimeout: null,
        lastSubmittedEntry: null
    };

    // DOM References
    const DOM = {
        curtainOverlay: document.getElementById("curtain-overlay"),
        openBtn: document.getElementById("open-invitation-btn"),
        mainContent: document.getElementById("main-content"),
        musicController: document.getElementById("music-controller"),
        musicToggleBtn: document.getElementById("music-toggle-btn"),
        sliderTrack: document.getElementById("slider-track"),
        slides: document.querySelectorAll(".slide"),
        sliderPrevBtn: document.getElementById("slider-prev-btn"),
        sliderNextBtn: document.getElementById("slider-next-btn"),
        sliderDotsContainer: document.getElementById("slider-dots"),
        sliderDots: document.querySelectorAll(".slider-dots .dot"),
        rsvpForm: document.getElementById("rsvp-form"),
        rsvpSuccess: document.getElementById("rsvp-success"),
        rsvpResetBtn: document.getElementById("rsvp-reset-btn"),
        mapContainer: document.getElementById("map-loader-container"),
        mapPlaceholder: document.getElementById("map-placeholder"),
        adminTrigger: document.getElementById("admin-logo-trigger"),
        adminModal: document.getElementById("admin-modal"),
        adminModalClose: document.getElementById("admin-modal-close"),
        adminLoginStep: document.getElementById("admin-login-step"),
        adminDashboardStep: document.getElementById("admin-dashboard-step"),
        adminPinInput: document.getElementById("admin-pin"),
        adminLoginBtn: document.getElementById("admin-login-btn"),
        adminPinError: document.getElementById("admin-pin-error"),
        adminSearch: document.getElementById("admin-search"),
        adminExportBtn: document.getElementById("admin-export-btn"),
        adminClearBtn: document.getElementById("admin-clear-btn"),
        rsvpTableBody: document.getElementById("rsvp-table-body"),
        adminNoRecords: document.getElementById("admin-no-records"),
        canvasElement: document.getElementById("petals-canvas"),
        rsvpGuestsWrapper: document.getElementById("rsvp-guests-wrapper"),
        rsvpEventsWrapper: document.getElementById("rsvp-events-wrapper"),
        rsvpAttendanceRadios: document.querySelectorAll("input[name='attendance']")
    };

    // --- 1. WEB AUDIO API TEMPLE BELL EFFECT ---
    // Synthesized Locally for Instant Dynamic Sound Feedback

    function initAudioContext() {
        if (!state.audioContext) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (state.audioContext.state === "suspended") {
            state.audioContext.resume();
        }
    }

    // Play a crystal-clear, resonant temple bell sound synthesized locally on micro-interactions
    function playTempleBell() {
        initAudioContext();
        const ctx = state.audioContext;
        const now = ctx.currentTime;

        const bellRatios = [1.0, 1.5, 1.9, 2.2, 2.7, 3.4];
        const baseFreq = 523.25; // C5 Note (bright and pure)

        const masterBellGain = ctx.createGain();
        masterBellGain.gain.setValueAtTime(0, now);
        masterBellGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
        masterBellGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
        
        const bellFilter = ctx.createBiquadFilter();
        bellFilter.type = "highpass";
        bellFilter.frequency.setValueAtTime(200, now);

        masterBellGain.connect(bellFilter);
        bellFilter.connect(ctx.destination);

        bellRatios.forEach((ratio, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = index % 2 === 0 ? "triangle" : "sine";
            osc.frequency.setValueAtTime(baseFreq * ratio, now);

            const decay = 3.0 / (ratio * 0.7);
            gain.gain.setValueAtTime(0.12 / (index + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

            osc.connect(gain);
            gain.connect(masterBellGain);
            osc.start(now);
            osc.stop(now + 4);
        });
    }

    // --- 1B. HTML5 AUDIO PLAYER BACKGROUND MUSIC ---
    // Loads traditional South Indian wedding instrumental music from the internet
    // Easy custom Venkatesh movie BGM configurations.

    function initAudioElement() {
        if (!state.audioElement) {
            state.audioElement = new Audio();
            state.audioElement.src = CONFIG.audioUrl;
            state.audioElement.loop = true;
            state.audioElement.volume = 0.45; // Soft pleasant background volume
            
            // Audio error fallbacks
            state.audioElement.addEventListener("error", (e) => {
                console.warn("Primary wedding audio failed to load. Falling back to classical track.", e);
                if (state.audioElement.src !== CONFIG.audioFallbackUrl) {
                    state.audioElement.src = CONFIG.audioFallbackUrl;
                    if (state.isMusicPlaying) {
                        state.audioElement.play().catch(err => console.log("Audio block: ", err));
                    }
                }
            });
        }
    }

    // Toggle Music Playback
    function toggleMusic() {
        initAudioElement();
        if (!state.isMusicPlaying) {
            state.isMusicPlaying = true;
            DOM.musicToggleBtn.classList.add("music-playing");
            DOM.musicToggleBtn.setAttribute("aria-label", "Pause Music");
            
            state.audioElement.play().catch(err => {
                console.log("Audio blocked by browser. Will retry on next click.", err);
                state.isMusicPlaying = false;
                DOM.musicToggleBtn.classList.remove("music-playing");
            });
        } else {
            state.isMusicPlaying = false;
            DOM.musicToggleBtn.classList.remove("music-playing");
            DOM.musicToggleBtn.setAttribute("aria-label", "Play Music");
            if (state.audioElement) {
                state.audioElement.pause();
            }
        }
    }

    // Event listener for music button
    DOM.musicToggleBtn.addEventListener("click", toggleMusic);

    // --- 2. CURTAIN RAISER ENTRANCE ---
    DOM.openBtn.addEventListener("click", () => {
        if (state.isOpened) return;
        state.isOpened = true;

        // Initialize audio engine and play beautiful bell sound immediately
        initAudioContext();
        playTempleBell();

        // Start background music loop after a tiny delay
        setTimeout(() => {
            toggleMusic();
        }, 800);

        // Slide the curtain overlay up
        DOM.curtainOverlay.classList.add("curtain-opened");
        DOM.mainContent.classList.remove("hide");

        // Subtle entry transition for main elements
        setTimeout(() => {
            DOM.mainContent.classList.add("reveal");
            // Set up scroll triggers
            initScrollAnimations();
        }, 100);

        // Start falling petals canvas
        initPetalsCanvas();
        
        // Stop CPU drawing when browser tab is hidden to save RAM/Battery
        document.addEventListener("visibilitychange", handleVisibilityChange);
    });

    // --- 3. HIGH PERFORMANCE CANVAS PETALS ---
    // Memory-pooled, physics-based canvas particles
    // Max 12 active particles to ensure 60fps on 4GB RAM phones.

    function initPetalsCanvas() {
        state.canvas = DOM.canvasElement;
        state.ctx = state.canvas.getContext("2d");
        
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const colors = [
            { r: 197, g: 160, b: 89, a: 0.8 },  // Traditional Gold Petal
            { r: 255, g: 140, b: 0, a: 0.9 },   // Bright Marigold Orange
            { r: 255, g: 193, b: 7, a: 0.9 },   // Marigold Yellow
            { r: 220, g: 53, b: 69, a: 0.7 }    // Deep Kumkum Rose Pink
        ];

        // Seed 15 particles for slightly grander density while keeping RAM extremely low
        const maxPetals = 15;
        for (let i = 0; i < maxPetals; i++) {
            state.petals.push(createPetal(colors));
        }

        animatePetals();
    }

    function createPetal(colors, isReset = false) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const isZari = Math.random() < 0.35; // 35% probability of gold zari shimmer
        return {
            x: Math.random() * state.canvas.width,
            y: isReset ? -20 : Math.random() * state.canvas.height,
            size: isZari ? 2.5 + Math.random() * 2.5 : 6 + Math.random() * 8, // Zari are tiny sparks
            speedY: isZari ? 0.5 + Math.random() * 0.7 : 0.8 + Math.random() * 1.2,
            speedX: isZari ? -0.15 + Math.random() * 0.3 : -0.3 + Math.random() * 0.6,
            rotation: Math.random() * 360,
            rotationSpeed: isZari ? 0 : -1.5 + Math.random() * 3,
            swing: Math.random() * 2 * Math.PI,
            swingSpeed: isZari ? 0.005 + Math.random() * 0.01 : 0.01 + Math.random() * 0.02,
            swingAmplitude: isZari ? 6 + Math.random() * 8 : 15 + Math.random() * 20,
            color: color,
            isZari: isZari,
            twinklePhase: Math.random() * Math.PI * 2
        };
    }

    function resizeCanvas() {
        if (state.canvas) {
            state.canvas.width = window.innerWidth;
            state.canvas.height = window.innerHeight;
        }
    }

    function animatePetals() {
        if (!state.isOpened || document.hidden) {
            state.animationFrameId = requestAnimationFrame(animatePetals);
            return;
        }

        const ctx = state.ctx;
        const canvas = state.canvas;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const colors = [
            { r: 197, g: 160, b: 89, a: 0.8 },
            { r: 255, g: 140, b: 0, a: 0.9 },
            { r: 255, g: 193, b: 7, a: 0.9 },
            { r: 220, g: 53, b: 69, a: 0.7 }
        ];

        state.petals.forEach(petal => {
            // Update physics
            petal.y += petal.speedY;
            petal.swing += petal.swingSpeed;
            // Wave motion
            const curX = petal.x + Math.sin(petal.swing) * petal.swingAmplitude * 0.15 + petal.speedX;
            petal.rotation += petal.rotationSpeed;

            // Recycle off-screen particles
            if (petal.y > canvas.height + 20) {
                Object.assign(petal, createPetal(colors, true));
            }

            // Draw particle
            ctx.save();
            ctx.translate(curX, petal.y);
            ctx.rotate((petal.rotation * Math.PI) / 180);
            
            if (petal.isZari) {
                // Shimmering gold zari particle (twinkling star)
                const alpha = 0.5 + Math.sin(Date.now() * 0.005 + petal.twinklePhase) * 0.45;
                ctx.beginPath();
                ctx.arc(0, 0, petal.size, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(240, 211, 153, ${alpha})`;
                // Subtle shadow blur for a lovely glowing halo
                ctx.shadowColor = "rgba(240, 211, 153, 0.8)";
                ctx.shadowBlur = 6;
                ctx.fill();
            } else {
                // Traditional leaf/petal path
                ctx.beginPath();
                ctx.moveTo(0, -petal.size);
                ctx.bezierCurveTo(petal.size / 2, -petal.size / 2, petal.size / 2, petal.size / 2, 0, petal.size);
                ctx.bezierCurveTo(-petal.size / 2, petal.size / 2, -petal.size / 2, -petal.size / 2, 0, -petal.size);
                
                ctx.fillStyle = `rgba(${petal.color.r}, ${petal.color.g}, ${petal.color.b}, ${petal.color.a})`;
                ctx.fill();
            }
            ctx.restore();
        });

        state.animationFrameId = requestAnimationFrame(animatePetals);
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            // Stop rendering canvas and pause music to save battery
            if (state.animationFrameId) {
                cancelAnimationFrame(state.animationFrameId);
                state.animationFrameId = null;
            }
            if (state.audioElement && state.isMusicPlaying) {
                state.audioElement.pause();
            }
        } else {
            // Resume rendering canvas and audio loop
            if (state.isOpened && !state.animationFrameId) {
                animatePetals();
            }
            if (state.isOpened && state.isMusicPlaying && state.audioElement) {
                state.audioElement.play().catch(e => console.log("Audio auto-play blocked: ", e));
            }
        }
    }

    // --- 4. TOUCH-SWIPE IMAGE CAROUSEL GALLERY ---
    // Pure Touch Swipe gesture engine. Fully responsive, zero library dependencies.

    let touchStartX = 0;
    let touchEndX = 0;

    function updateSlider() {
        const offset = -state.currentSlide * 100;
        // Hardware accelerated slide transition
        DOM.sliderTrack.style.transform = `translate3d(${offset}%, 0, 0)`;
        
        // Update Dots
        DOM.sliderDots.forEach((dot, idx) => {
            if (idx === state.currentSlide) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });
    }

    function nextSlide() {
        state.currentSlide = (state.currentSlide + 1) % DOM.slides.length;
        updateSlider();
    }

    function prevSlide() {
        state.currentSlide = (state.currentSlide - 1 + DOM.slides.length) % DOM.slides.length;
        updateSlider();
    }

    // Button clicks
    DOM.sliderNextBtn.addEventListener("click", nextSlide);
    DOM.sliderPrevBtn.addEventListener("click", prevSlide);

    // Dot clicks
    DOM.sliderDotsContainer.addEventListener("click", (e) => {
        const indexStr = e.target.getAttribute("data-index");
        if (indexStr !== null) {
            state.currentSlide = parseInt(indexStr, 10);
            updateSlider();
        }
    });

    // Touch Swipe gesture capture
    DOM.sliderTrack.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    DOM.sliderTrack.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipeGesture();
    }, { passive: true });

    function handleSwipeGesture() {
        const swipeDistance = touchEndX - touchStartX;
        const minSwipeThreshold = 50; // Minimum pixels to trigger swipe

        if (swipeDistance < -minSwipeThreshold) {
            nextSlide(); // Swiped Left -> Next
        } else if (swipeDistance > minSwipeThreshold) {
            prevSlide(); // Swiped Right -> Prev
        }
    }

    // --- 5. SCROLL INTERSECTION OBSERVER ANIMATIONS ---
    // Elegant fade-ins as elements enter viewport. Also handles Map lazyloading!

    function initScrollAnimations() {
        const observerOptions = {
            root: null,
            threshold: 0.15 // Trigger when 15% of element is visible
        };

        const observer = new IntersectionObserver((entries, self) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    self.unobserve(entry.target); // Unobserve once animated
                }
            });
        }, observerOptions);

        // Elements to animate
        const animatedSections = document.querySelectorAll(".scroll-fade");
        animatedSections.forEach(section => {
            observer.observe(section);
        });

        // --- MAP LAZYLOAD OBSERVER ---
        // Lazy-loads the 2.5MB Google Map iframe *only when the Map container scrolls into view*
        const mapObserver = new IntersectionObserver((entries, self) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    lazyLoadMap();
                    self.unobserve(entry.target);
                }
            });
        }, { root: null, threshold: 0.05 });

        mapObserver.observe(DOM.mapContainer);
    }

    function lazyLoadMap() {
        const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3800.0881958252277!2d83.3150539115712!3d17.72886738314112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a39433e5c9efdfd%3A0x64be6566810b42f!2sVIP%20Rd%2C%20Visakhapatnam%2C%20Andhra%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin";
        
        const iframe = document.createElement("iframe");
        iframe.src = mapUrl;
        iframe.className = "venue-map-iframe";
        iframe.allowFullscreen = "";
        iframe.loading = "lazy";
        iframe.title = "Golden Leaf Convention Center Google Maps Location";

        iframe.onload = () => {
            iframe.classList.add("loaded");
            DOM.mapPlaceholder.style.opacity = "0";
            setTimeout(() => DOM.mapPlaceholder.classList.add("hide"), 600);
        };

        DOM.mapContainer.appendChild(iframe);
    }

    // Smooth scroll for timeline anchors
    document.querySelectorAll(".scroll-link").forEach(anchor => {
        anchor.addEventListener("click", function(e) {
            e.preventDefault();
            const targetId = this.getAttribute("href");
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    // Collapsible RSVP fields based on attendance radio state (Joyfully Attending vs Regretfully Declining)
    function updateRsvpFields() {
        const checkedRadio = DOM.rsvpForm.querySelector("input[name='attendance']:checked");
        const attendanceVal = checkedRadio ? checkedRadio.value : "Yes";
        
        if (attendanceVal === "No") {
            DOM.rsvpGuestsWrapper.classList.add("collapsed");
            DOM.rsvpEventsWrapper.classList.add("collapsed");
            DOM.rsvpGuestsWrapper.querySelector("select").required = false;
        } else {
            DOM.rsvpGuestsWrapper.classList.remove("collapsed");
            DOM.rsvpEventsWrapper.classList.remove("collapsed");
            DOM.rsvpGuestsWrapper.querySelector("select").required = true;
        }
    }

    DOM.rsvpAttendanceRadios.forEach(radio => {
        radio.addEventListener("change", updateRsvpFields);
    });

    // Run once initially to set correct state
    updateRsvpFields();

    // --- 6. RSVP FORM EXTRA ACTIONS & LIVE LISTENERS ---

    // Live phone formatting (digits only, max 10 characters)
    const phoneInput = document.getElementById("rsvp-phone");
    const phoneError = document.getElementById("phone-error");
    if (phoneInput) {
        phoneInput.addEventListener("input", (e) => {
            let cleanValue = e.target.value.replace(/\D/g, "");
            if (cleanValue.length > 10) {
                cleanValue = cleanValue.substring(0, 10);
            }
            e.target.value = cleanValue;
            
            // Real-time clearance of phone errors if length is valid
            if (cleanValue.length === 10 || cleanValue.length === 0) {
                phoneInput.classList.remove("invalid");
                if (phoneError) phoneError.style.display = "none";
            }
        });
    }

    // Live blessings character counter
    const blessingsTextarea = document.getElementById("rsvp-blessings");
    const blessingsCharCounter = document.getElementById("blessings-char-counter");
    if (blessingsTextarea && blessingsCharCounter) {
        blessingsTextarea.addEventListener("input", (e) => {
            const charCount = e.target.value.length;
            blessingsCharCounter.textContent = `${charCount} / 250`;
        });
    }

    // Dynamic WhatsApp Summary Message Compiler
    function sendRsvpOnWhatsApp(entry) {
        const lang = localStorage.getItem("invitation_lang") || "en";
        let text = "";
        
        if (lang === "te") {
            text = `నమస్తే నాని & లక్ష్మి,\n`;
            text += `మీ వివాహ ఆహ్వానానికి మా రాక వివరాలను ధృవీకరిస్తున్నాము! 🌿\n\n`;
            text += `• *పేరు:* ${entry.name}\n`;
            text += `• *మొబైల్:* ${entry.phone === "N/A" || !entry.phone ? "లేదు" : entry.phone}\n`;
            text += `• *హాజరు:* ${entry.attendance === "Yes" ? "తప్పకుండా వస్తున్నాము (Joyfully Attending) 🎉" : "రాలేకపోతున్నాము (Regretfully Declining) 🙏"}\n`;
            if (entry.attendance === "Yes") {
                text += `• *అతిథుల సంఖ్య:* ${entry.guests === "1" ? "1 వ్యక్తి" : entry.guests + " వ్యక్తులు"}\n`;
                
                const eventMappings = {
                    "Nalugu": "నలుగు & మంగళస్నానం",
                    "Gorintaku": "గోరింటాకు వేడుక",
                    "Wedding": "శుభ ముహూర్తం",
                    "Reception": "కళ్యాణ విందు"
                };
                const teluguEvents = entry.events.split(", ").map(ev => eventMappings[ev] || ev).join(", ");
                text += `• *హాజరవుతున్న వేడుకలు:* ${teluguEvents}\n`;
            }
            text += `• *సందేశం:* ${entry.blessings === "No message left." ? "శుభాకాంక్షలు!" : entry.blessings}\n\n`;
            text += `ధన్యవాదములు!`;
        } else {
            text = `Hello Nani & Lakshmi,\n`;
            text += `I have confirmed my RSVP for your beautiful wedding! 🌿\n\n`;
            text += `• *Name:* ${entry.name}\n`;
            text += `• *Phone:* ${entry.phone === "N/A" || !entry.phone ? "N/A" : entry.phone}\n`;
            text += `• *Attendance:* ${entry.attendance === "Yes" ? "Joyfully Attending 🎉" : "Regretfully Declining 🙏"}\n`;
            if (entry.attendance === "Yes") {
                text += `• *Number of Guests:* ${entry.guests === "1" ? "1 Person" : entry.guests + " People"}\n`;
                
                const eventMappings = {
                    "Nalugu": "Nalugu & Mangalasnanam",
                    "Gorintaku": "Gorintaku Veduka",
                    "Wedding": "Subha Muhurtham",
                    "Reception": "Kalyana Vindu"
                };
                const englishEvents = entry.events.split(", ").map(ev => eventMappings[ev] || ev).join(", ");
                text += `• *Events Attending:* ${englishEvents}\n`;
            }
            text += `• *Blessings:* ${entry.blessings}\n\n`;
            text += `Warm regards.`;
        }
        
        const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, "_blank");
    }

    // Wire up WhatsApp Button click event
    const whatsappBtn = document.getElementById("rsvp-whatsapp-btn");
    if (whatsappBtn) {
        whatsappBtn.addEventListener("click", () => {
            if (state.lastSubmittedEntry) {
                sendRsvpOnWhatsApp(state.lastSubmittedEntry);
            }
        });
    }

    // Helper: trigger CSS vibration on invalid inputs
    function triggerErrorShake(element) {
        if (element) {
            element.classList.add("shake");
            setTimeout(() => {
                element.classList.remove("shake");
            }, 500);
        }
    }

    // --- 6. RSVP FORM CONTROLLER (LOCALSTORAGE DATABASE) ---
    DOM.rsvpForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Robust Validations
        const nameInput = document.getElementById("rsvp-name");
        const nameError = document.getElementById("name-error");
        const eventsContainer = document.getElementById("events-checkbox-container");
        const eventsError = document.getElementById("events-error");
        
        let isFormValid = true;

        // 1. Name check
        if (!nameInput.value.trim()) {
            nameInput.classList.add("invalid");
            nameError.style.display = "flex";
            triggerErrorShake(nameInput);
            isFormValid = false;
        } else {
            nameInput.classList.remove("invalid");
            nameError.style.display = "none";
        }

        // 2. Phone check (optional, but if entered must be 10 digits)
        const phoneVal = phoneInput.value.trim();
        if (phoneVal && phoneVal.length !== 10) {
            phoneInput.classList.add("invalid");
            if (phoneError) phoneError.style.display = "flex";
            triggerErrorShake(phoneInput);
            isFormValid = false;
        } else {
            phoneInput.classList.remove("invalid");
            if (phoneError) phoneError.style.display = "none";
        }

        // 3. Checked events validation (if joyfully attending)
        const checkedRadio = DOM.rsvpForm.querySelector("input[name='attendance']:checked");
        const attendance = checkedRadio ? checkedRadio.value : "Yes";

        const attendingEvents = [];
        DOM.rsvpForm.querySelectorAll("input[name='attending_events']:checked").forEach(cb => {
            attendingEvents.push(cb.value);
        });

        if (attendance === "Yes") {
            if (attendingEvents.length === 0) {
                if (eventsContainer) eventsContainer.classList.add("invalid");
                if (eventsError) eventsError.style.display = "flex";
                triggerErrorShake(eventsContainer || DOM.rsvpEventsWrapper);
                isFormValid = false;
            } else {
                if (eventsContainer) eventsContainer.classList.remove("invalid");
                if (eventsError) eventsError.style.display = "none";
            }
        } else {
            if (eventsError) eventsError.style.display = "none";
        }

        if (!isFormValid) return;

        // Extract Form Data
        const formData = new FormData(DOM.rsvpForm);
        const name = formData.get("name").trim();
        const phone = formData.get("phone").trim() || "N/A";
        const guests = formData.get("guests");
        const blessings = formData.get("blessings").trim() || "No message left.";

        // Change button state to loading (tactile premium feedback)
        const submitBtn = DOM.rsvpForm.querySelector("button[type='submit']");
        const btnText = submitBtn.querySelector(".btn-text");
        const originalText = btnText ? btnText.innerHTML : "Submit RSVP";
        
        submitBtn.disabled = true;
        if (btnText) {
            btnText.innerHTML = localStorage.getItem("invitation_lang") === "te" ? "నమోదవుతోంది..." : "Registering...";
        }

        setTimeout(() => {
            // Log entry into LocalStorage (Check for duplicates and overwrite to ensure clean database)
            const entry = {
                id: Date.now(),
                name: name,
                phone: phone,
                guests: attendance === "No" ? "0" : guests, // set guests to 0 if declining
                attendance: attendance,
                events: attendance === "No" ? "None" : (attendingEvents.length ? attendingEvents.join(", ") : "None"), // clear events if declining
                blessings: blessings,
                timestamp: new Date().toLocaleString()
            };

            const existingIndex = state.rsvpList.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
            if (existingIndex !== -1) {
                state.rsvpList[existingIndex] = entry;
            } else {
                state.rsvpList.push(entry);
            }
            
            localStorage.setItem("rsvp_entries", JSON.stringify(state.rsvpList));
            sessionStorage.setItem("last_rsvp_name", name); // Save name to prefill form on editing
            state.lastSubmittedEntry = entry; // Cache locally to drive WhatsApp compiler

            // Re-enable button
            submitBtn.disabled = false;
            if (btnText) {
                btnText.innerHTML = originalText;
            }

            // Fade form out and show success screen
            DOM.rsvpForm.classList.add("hide");
            DOM.rsvpSuccess.classList.remove("hide");
            
            // Gentle bell chime on successful form submission
            playTempleBell();
        }, 1200);
    });

    // Edit Submission Button (Prefills the form with their previously saved values)
    DOM.rsvpResetBtn.addEventListener("click", () => {
        const lastRsvpName = sessionStorage.getItem("last_rsvp_name");
        if (lastRsvpName) {
            const lastEntry = state.rsvpList.find(item => item.name.toLowerCase() === lastRsvpName.toLowerCase());
            if (lastEntry) {
                document.getElementById("rsvp-name").value = lastEntry.name;
                document.getElementById("rsvp-phone").value = lastEntry.phone === "N/A" ? "" : lastEntry.phone;
                document.getElementById("rsvp-guests").value = lastEntry.guests === "0" ? "1" : lastEntry.guests;
                
                // Prefill attendance
                const radio = DOM.rsvpForm.querySelector(`input[name="attendance"][value="${lastEntry.attendance}"]`);
                if (radio) {
                    radio.checked = true;
                }
                
                // Prefill checkboxes
                const events = lastEntry.events.split(", ");
                DOM.rsvpForm.querySelectorAll("input[name='attending_events']").forEach(cb => {
                    cb.checked = events.includes(cb.value);
                });
                
                document.getElementById("rsvp-blessings").value = lastEntry.blessings === "No message left." ? "" : lastEntry.blessings;
                
                // Update character counter too
                if (blessingsCharCounter && blessingsTextarea) {
                    blessingsCharCounter.textContent = `${document.getElementById("rsvp-blessings").value.length} / 250`;
                }

                // Trigger visibility state check
                updateRsvpFields();
            }
        }
        DOM.rsvpSuccess.classList.add("hide");
        DOM.rsvpForm.classList.remove("hide");
    });

    // --- 7. SECRET RSVP ADMIN GATEWAY MODAL ---
    // Triple tap the "N ❤️ L" footer logo within 1s to summon the admin console

    DOM.adminTrigger.addEventListener("click", () => {
        state.logoTapCount++;

        if (state.logoTapTimeout) clearTimeout(state.logoTapTimeout);

        state.logoTapTimeout = setTimeout(() => {
            state.logoTapCount = 0; // Clear tap count after 1s
        }, 1000);

        if (state.logoTapCount === 3) {
            state.logoTapCount = 0;
            openAdminConsole();
        }
    });

    function openAdminConsole() {
        DOM.adminModal.classList.remove("hide");
        DOM.adminLoginStep.classList.remove("hide");
        DOM.adminDashboardStep.classList.add("hide");
        DOM.adminPinInput.value = "";
        DOM.adminPinError.style.display = "none";
        DOM.adminPinInput.focus();
    }

    DOM.adminModalClose.addEventListener("click", () => {
        DOM.adminModal.classList.add("hide");
    });

    // Password PIN Validator (Passcode from CONFIG)
    DOM.adminLoginBtn.addEventListener("click", validateAdminPin);
    DOM.adminPinInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") validateAdminPin();
    });

    function validateAdminPin() {
        const pin = DOM.adminPinInput.value.trim();
        if (pin === CONFIG.adminPin) {
            DOM.adminLoginStep.classList.add("hide");
            DOM.adminDashboardStep.classList.remove("hide");
            renderRsvpDashboard();
        } else {
            DOM.adminPinError.style.display = "block";
            DOM.adminPinInput.value = "";
            DOM.adminPinInput.focus();
        }
    }

    // Render local storage records in custom admin table grid
    function renderRsvpDashboard() {
        const searchVal = DOM.adminSearch.value.toLowerCase().trim();
        
        // Refresh RSVP list from LocalStorage
        state.rsvpList = JSON.parse(localStorage.getItem("rsvp_entries") || "[]");
        
        // Filter entries based on search input
        const filteredList = state.rsvpList.filter(item => 
            item.name.toLowerCase().includes(searchVal) || 
            item.phone.includes(searchVal)
        );

        // Draw rows
        DOM.rsvpTableBody.innerHTML = "";
        
        if (filteredList.length === 0) {
            DOM.adminNoRecords.classList.remove("hide");
            return;
        }
        
        DOM.adminNoRecords.classList.add("hide");

        filteredList.forEach(entry => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${escapeHtml(entry.name)}</strong></td>
                <td>${escapeHtml(entry.phone)}</td>
                <td class="text-center">${escapeHtml(entry.guests)}</td>
                <td><span class="badge ${entry.attendance === "Yes" ? "att-yes" : "att-no"}">${entry.attendance === "Yes" ? "Attending" : "Declined"}</span></td>
                <td><small>${escapeHtml(entry.events)}</small></td>
                <td><p class="bless-para" title="${escapeHtml(entry.blessings)}">${escapeHtml(entry.blessings)}</p></td>
            `;
            DOM.rsvpTableBody.appendChild(tr);
        });
    }

    // live search filtering
    DOM.adminSearch.addEventListener("input", renderRsvpDashboard);

    // CSV Database Exporter
    DOM.adminExportBtn.addEventListener("click", () => {
        if (state.rsvpList.length === 0) {
            alert("No RSVP data available to export.");
            return;
        }

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Timestamp,Name,Phone,Number of Guests,Attending,Events Attending,Blessings & Message\n";

        // CSV Rows
        state.rsvpList.forEach(item => {
            const row = [
                item.id,
                `"${item.timestamp.replace(/"/g, '""')}"`,
                `"${item.name.replace(/"/g, '""')}"`,
                `"${item.phone.replace(/"/g, '""')}"`,
                item.guests,
                `"${item.attendance.replace(/"/g, '""')}"`,
                `"${item.events.replace(/"/g, '""')}"`,
                `"${item.blessings.replace(/"/g, '""')}"`
            ].join(",");
            csvContent += row + "\n";
        });

        // Trigger safe file download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Nani_Lakshmi_Wedding_RSVPs.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Clear local storage records (Dual confirmation alert)
    DOM.adminClearBtn.addEventListener("click", () => {
        if (state.rsvpList.length === 0) return;
        
        if (confirm("Are you absolutely sure you want to clear all recorded RSVP guest entries?")) {
            if (confirm("This action cannot be undone! Are you 100% sure?")) {
                state.rsvpList = [];
                localStorage.setItem("rsvp_entries", JSON.stringify(state.rsvpList));
                renderRsvpDashboard();
            }
        }
    });

    // Helper: Escape strings for safe rendering (Prevent CSS / XSS injections)
    function escapeHtml(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- Auspicious Muhurtham Countdown Timer ---
    function initCountdownTimer() {
        // Target date: August 30, 2026 at 9:15 AM (Muhurtham)
        const targetDate = new Date("August 30, 2026 09:15:00").getTime();

        const cdDays = document.getElementById("cd-days");
        const cdHours = document.getElementById("cd-hours");
        const cdMins = document.getElementById("cd-minutes");
        const cdSecs = document.getElementById("cd-seconds");

        if (!cdDays || !cdHours || !cdMins || !cdSecs) return;

        function updateCountdown() {
            const now = new Date().getTime();
            const timeDifference = targetDate - now;

            if (timeDifference <= 0) {
                cdDays.textContent = "00";
                cdHours.textContent = "00";
                cdMins.textContent = "00";
                cdSecs.textContent = "00";
                clearInterval(countdownInterval);
                return;
            }

            const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

            cdDays.textContent = String(days).padStart(2, "0");
            cdHours.textContent = String(hours).padStart(2, "0");
            cdMins.textContent = String(minutes).padStart(2, "0");
            cdSecs.textContent = String(seconds).padStart(2, "0");
        }

        updateCountdown();
        const countdownInterval = setInterval(updateCountdown, 1000);
    }

    // Initialize Countdown Timer immediately
    initCountdownTimer();

    // --- LANGUAGE SWITCHER SYSTEM (BILINGUAL ENGLISH & TELUGU) ---
    function setLanguage(lang) {
        localStorage.setItem("invitation_lang", lang);
        
        // Update body language classes for traditional font rendering overrides
        if (lang === "te") {
            document.body.classList.add("lang-te");
            document.body.classList.remove("lang-en");
        } else {
            document.body.classList.add("lang-en");
            document.body.classList.remove("lang-te");
        }
        
        // Update all data-en / data-te elements
        document.querySelectorAll("[data-en]").forEach(el => {
            const translation = el.getAttribute("data-" + lang);
            if (translation) {
                if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                    el.placeholder = translation;
                } else {
                    el.innerHTML = translation;
                }
            }
        });

        // Update active class on toggle button labels
        const enLbl = document.getElementById("lang-en-lbl");
        const teLbl = document.getElementById("lang-te-lbl");
        if (enLbl && teLbl) {
            if (lang === "en") {
                enLbl.classList.add("active");
                teLbl.classList.remove("active");
            } else {
                teLbl.classList.add("active");
                enLbl.classList.remove("active");
            }
        }
    }

    function toggleLanguage() {
        const currentLang = localStorage.getItem("invitation_lang") === "te" ? "en" : "te";
        setLanguage(currentLang);
    }

    const langBtn = document.getElementById("lang-toggle-btn");
    if (langBtn) {
        langBtn.addEventListener("click", toggleLanguage);
    }

    // Initialize language from local storage (default 'en')
    const initialLang = localStorage.getItem("invitation_lang") || "en";
    setLanguage(initialLang);

});
