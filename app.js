import { students } from './students.js';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("🧩 Supabase initialized");

// Supabase Storage bucket name
const STORAGE_BUCKET = 'memories';

// Active real-time channel (stored so it can be cleaned up on view change)
let realtimeChannel = null;

// Application State
let currentState = {
    selectedStudent: null,
    currentPage: 0,
    messages: []
};

// DOM Elements
const splashScreen     = document.getElementById('splash-screen');
const mainApp          = document.getElementById('main-app');
const studentList      = document.getElementById('student-list');
const book             = document.getElementById('book');
const selectedStudentName = document.getElementById('selected-student-name');
const optionsOverlay   = document.getElementById('options-overlay');
const pagesContainer   = document.getElementById('pages-container');
const pageIndicator    = document.getElementById('page-indicator');
const prevPageBtn      = document.getElementById('prev-page');
const nextPageBtn      = document.getElementById('next-page');

// --- Initialization ---

window.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    document.body.classList.add('no-scroll');
    renderStudentList();

    const video = document.getElementById('intro-video');

    const startApp = () => {
        splashScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        document.body.classList.remove('no-scroll');
    };

    if (video) {
        video.play().catch(() => {
            console.log("Autoplay prevented — falling back to timeout");
        });
        video.onended = startApp;
        setTimeout(startApp, 5000);
    } else {
        startApp();
    }

    setupEventListeners();
}

// --- Renderers ---

function renderStudentList(filter = '') {
    studentList.innerHTML = '';
    const filtered = students.filter(s => 
        s.name.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(student => {
        const btn = document.createElement('button');
        btn.className = 'student-btn';
        btn.innerText = student.name;
        btn.onclick = () => selectStudent(student);
        studentList.appendChild(btn);
    });
}

function renderSlamBookPages() {
    pagesContainer.innerHTML = '';
    const messages = currentState.messages;

    if (messages.length === 0) {
        pagesContainer.innerHTML = `
            <div class="message-page active">
                <div class="page-content">No messages yet. Be the first to write!</div>
            </div>
        `;
        pageIndicator.innerText = 'No Pages';
        return;
    }

    messages.forEach((msg, index) => {
        const page = document.createElement('div');
        page.className = `message-page ${index === 0 ? 'active' : ''}`;

        let textClass = 'page-content';
        let textLen = msg.text ? msg.text.length : 0;
        
        if (msg.image) {
            // Less room because image takes up half the page
            if (textLen > 500) textClass += ' ultra-long-text';
            else if (textLen > 250) textClass += ' extra-long-text';
            else if (textLen > 100) textClass += ' long-text';
        } else {
            // Full page for text
            if (textLen > 800) textClass += ' ultra-long-text';
            else if (textLen > 500) textClass += ' extra-long-text';
            else if (textLen > 250) textClass += ' long-text';
        }

        let content = `<div class="${textClass}">${msg.text}</div>`;
        if (msg.image) {
            content += `<img src="${msg.image}" class="page-image" alt="Memory">`;
        }

        page.innerHTML = content;
        pagesContainer.appendChild(page);
    });

    updateCarouselButtons();
}

// --- Actions ---

function selectStudent(student) {
    currentState.selectedStudent = student;
    selectedStudentName.innerText = student.name;
    document.getElementById('note-for-name').innerText = student.name;
    document.getElementById('viewer-title').innerText = `${student.name}'s Slam Book`;

    switchSection('book-container');

    setTimeout(() => {
        book.classList.add('open');
        optionsOverlay.classList.remove('hidden');
    }, 100);
}

function switchSection(targetId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.add('hidden'));
    document.getElementById(targetId).classList.remove('hidden');

    if (targetId === 'name-selection') {
        book.classList.remove('open');
        optionsOverlay.classList.add('hidden');

        // Clean up real-time subscription when leaving viewer
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
            console.log("🔌 Real-time channel unsubscribed");
        }
    }
}

function updateCarouselButtons() {
    const total   = currentState.messages.length;
    const current = currentState.currentPage + 1;

    pageIndicator.innerText = `Page ${current} of ${total}`;
    prevPageBtn.disabled = currentState.currentPage === 0;
    nextPageBtn.disabled = currentState.currentPage === total - 1;
}

// --- Helpers ---

async function compressImage(file, maxWidth = 700) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width  = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width  = maxWidth;
                }

                canvas.width  = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 60% JPEG quality — fast uploads, good quality
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.6);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Subscribe to real-time INSERT events for a given student
function subscribeRealtime(student) {
    // Remove any existing channel first
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
    }

    realtimeChannel = supabase
        .channel('messages-channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `student_id=eq.${student.id}`
            },
            (payload) => {
                console.log("🔥 Real-time message received:", payload.new);
                currentState.messages.push(payload.new);
                renderSlamBookPages();
            }
        )
        .subscribe();

    console.log(`📡 Real-time subscribed for student: ${student.name} (id: ${student.id})`);
}

// --- Event Listeners ---

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('student-search');
    if (searchInput) {
        searchInput.oninput = (e) => renderStudentList(e.target.value);
    }

    // ── Navigation ──────────────────────────────────────────
    document.getElementById('back-to-list').onclick = () => switchSection('name-selection');

    document.querySelectorAll('.close-action').forEach(btn => {
        btn.onclick = () => switchSection('book-container');
    });

    // ── Options ─────────────────────────────────────────────
    document.getElementById('btn-write-note').onclick    = () => switchSection('write-note-screen');
    document.getElementById('btn-personal-view').onclick = () => switchSection('login-screen');

    // ── Note Form ────────────────────────────────────────────
    const noteForm  = document.getElementById('note-form');
    noteForm.onsubmit = async (e) => {
        e.preventDefault();

        const submitBtn     = noteForm.querySelector('button[type="submit"]');
        const originalText  = submitBtn.innerText;
        const text          = document.getElementById('message').value.trim();
        const imageFile     = document.getElementById('image-upload').files[0];
        const studentId     = currentState.selectedStudent.id;
        const uploadSection = document.getElementById('upload-progress');
        const progressBar   = document.getElementById('progress-bar');
        const progressText  = document.getElementById('progress-text');

        // Improvement #5 — empty input guard
        if (!text && !imageFile) {
            alert("Write something or add an image first!");
            return;
        }

        if (imageFile && imageFile.size > 10_000_000) {
            alert("Image too large! Please choose one under 10MB.");
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-inline"></span> Processing...';
            uploadSection.classList.remove('hidden');
            progressBar.style.width = '10%';
            progressText.innerText  = 'Optimizing Image...';

            let imageUrl = null;

            if (imageFile) {
                // Step 1 — compress
                const compressedBlob = await compressImage(imageFile);

                progressBar.style.width = '30%';
                progressText.innerText  = 'Uploading Image...';

                // Step 2 — upload to Supabase Storage
                // Using folder-per-student structure for better organization
                const fileName = `${studentId}/${Date.now()}_${imageFile.name}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('memories') // ⚠️ MUST match bucket name exactly
                    .upload(fileName, compressedBlob, {
                        contentType: 'image/jpeg',
                        upsert: false
                    });

                if (uploadError) {
                    console.error("❌ Upload error:", uploadError);
                    alert("Upload failed: " + uploadError.message);
                    return;
                }

                // Step 3 — get public URL
                const { data: urlData } = supabase.storage
                    .from('memories')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
                console.log("✅ Image uploaded to Supabase Storage:", imageUrl);
                progressBar.style.width = '70%';
            }

            progressBar.style.width = '90%';
            progressText.innerText  = 'Saving Memory...';
            submitBtn.innerHTML     = '<span class="spinner-inline"></span> Finalizing...';

            // Step 4 — save to DB
            // Improvement #1 — use student_id not name; no manual timestamp
            const { error: insertError } = await supabase
                .from('messages')
                .insert([{
                    student_id: studentId,
                    text: text,
                    image: imageUrl
                }]);

            if (insertError) throw insertError;

            console.log("✅ Message saved to Supabase");
            progressBar.style.width = '100%';
            progressText.innerText  = 'Done! ✨';

            alert('Memory saved successfully! ✨🌟');
            noteForm.reset();
            document.getElementById('image-preview').classList.add('hidden');
            uploadSection.classList.add('hidden');
            switchSection('book-container');

        } catch (error) {
            console.error("Error saving message:", error);
            alert('Error: ' + error.message);
            uploadSection.classList.add('hidden');
        } finally {
            submitBtn.disabled  = false;
            submitBtn.innerText = originalText;
        }
    };

    // ── Image Preview ────────────────────────────────────────
    document.getElementById('image-upload').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${URL.createObjectURL(file)}">`;
            preview.classList.remove('hidden');
        }
    };

    // ── Login Form ───────────────────────────────────────────
    const loginForm = document.getElementById('login-form');
    loginForm.onsubmit = async (e) => {
        e.preventDefault();

        const dob  = document.getElementById('dob').value;
        const pass = document.getElementById('password').value;
        const student = currentState.selectedStudent;

        if (student.dob !== dob || student.password !== pass) {
            alert('Invalid credentials. Only ' + student.name + ' can access this view.');
            return;
        }

        const loginBtn      = loginForm.querySelector('button[type="submit"]');
        const originalText  = loginBtn.innerText;

        try {
            loginBtn.disabled  = true;
            loginBtn.innerText = 'Loading memories...';

            // Improvement #2 — query by student_id, order by created_at
            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .eq('student_id', student.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            console.log(`✅ Loaded ${messages.length} messages`);

            currentState.messages    = messages;
            currentState.currentPage = 0;
            renderSlamBookPages();
            switchSection('viewer-screen');
            loginForm.reset();

            // Improvement #6 — real-time updates
            subscribeRealtime(student);

        } catch (error) {
            console.error("Error fetching messages:", error);
            alert('Error: ' + error.message);
        } finally {
            loginBtn.disabled  = false;
            loginBtn.innerText = originalText;
        }
    };

    // ── Carousel Navigation ──────────────────────────────────
    prevPageBtn.onclick = () => {
        if (currentState.currentPage > 0) {
            const pages = document.querySelectorAll('.message-page');
            pages[currentState.currentPage].classList.remove('active');
            currentState.currentPage--;
            pages[currentState.currentPage].classList.add('active');
            pages[currentState.currentPage].classList.remove('prev');
            updateCarouselButtons();
        }
    };

    nextPageBtn.onclick = () => {
        if (currentState.currentPage < currentState.messages.length - 1) {
            const pages = document.querySelectorAll('.message-page');
            pages[currentState.currentPage].classList.remove('active');
            pages[currentState.currentPage].classList.add('prev');
            currentState.currentPage++;
            pages[currentState.currentPage].classList.add('active');
            updateCarouselButtons();
        }
    };

    document.getElementById('close-viewer').onclick = () => switchSection('book-container');
}
