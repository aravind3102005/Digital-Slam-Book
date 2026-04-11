import { students } from './students.js';

// Application State
let currentState = {
    selectedStudent: null,
    currentPage: 0,
    messages: []
};

// DOM Elements
const splashScreen = document.getElementById('splash-screen');
const mainApp = document.getElementById('main-app');
const studentList = document.getElementById('student-list');
const bookContainer = document.getElementById('book-container');
const book = document.getElementById('book');
const selectedStudentName = document.getElementById('selected-student-name');
const optionsOverlay = document.getElementById('options-overlay');
const writeNoteScreen = document.getElementById('write-note-screen');
const loginScreen = document.getElementById('login-screen');
const viewerScreen = document.getElementById('viewer-screen');
const pagesContainer = document.getElementById('pages-container');
const pageIndicator = document.getElementById('page-indicator');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');

// --- Initialization ---

window.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    renderStudentList();
    
    // Splash screen timeout
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
    }, 2000);

    setupEventListeners();
}

// --- Renderers ---

function renderStudentList() {
    studentList.innerHTML = '';
    students.forEach(student => {
        const btn = document.createElement('button');
        btn.className = 'student-btn';
        btn.innerHTML = `${student.name}`;
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
        pageIndicator.innerText = `No Pages`;
        return;
    }

    messages.forEach((msg, index) => {
        const page = document.createElement('div');
        page.className = `message-page ${index === 0 ? 'active' : ''}`;
        
        let content = `<div class="page-content">"${msg.text}"</div>`;
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
    
    // Switch to book view
    switchSection('book-container');
    
    // Trigger book animation after a short delay
    setTimeout(() => {
        book.classList.add('open');
        setTimeout(() => {
            optionsOverlay.classList.remove('hidden');
        }, 1000);
    }, 500);
}

function switchSection(targetId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.add('hidden'));
    document.getElementById(targetId).classList.remove('hidden');
    
    // Reset book if going back to list
    if (targetId === 'name-selection') {
        book.classList.remove('open');
        optionsOverlay.classList.add('hidden');
    }
}

function updateCarouselButtons() {
    const total = currentState.messages.length;
    const current = currentState.currentPage + 1;
    
    pageIndicator.innerText = `Page ${current} of ${total}`;
    
    prevPageBtn.disabled = currentState.currentPage === 0;
    nextPageBtn.disabled = currentState.currentPage === total - 1;
}

// --- Event Listeners ---

function setupEventListeners() {
    // Navigation
    document.getElementById('back-to-list').onclick = () => switchSection('name-selection');
    
    document.querySelectorAll('.close-action').forEach(btn => {
        btn.onclick = () => switchSection('book-container');
    });

    // Options
    document.getElementById('btn-write-note').onclick = () => switchSection('write-note-screen');
    document.getElementById('btn-personal-view').onclick = () => switchSection('login-screen');

    // Note Form
    const noteForm = document.getElementById('note-form');
    noteForm.onsubmit = (e) => {
        e.preventDefault();
        const text = document.getElementById('message').value;
        const imageFile = document.getElementById('image-upload').files[0];
        
        // Mocking saving note
        const newMsg = {
            text: text,
            image: imageFile ? URL.createObjectURL(imageFile) : null,
            time: Date.now()
        };
        
        // Push to local storage/mock for now
        currentState.selectedStudent.messages.push(newMsg);
        
        alert('Message saved successfully! ✨');
        noteForm.reset();
        document.getElementById('image-preview').classList.add('hidden');
        switchSection('book-container');
    };

    // Image Upload Preview
    document.getElementById('image-upload').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
                const preview = document.getElementById('image-preview');
                preview.innerHTML = `<img src="${re.target.result}">`;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    };

    // Login Form
    const loginForm = document.getElementById('login-form');
    loginForm.onsubmit = (e) => {
        e.preventDefault();
        const dob = document.getElementById('dob').value;
        const pass = document.getElementById('password').value;
        
        const student = currentState.selectedStudent;
        if (student.dob === dob && student.password === pass) {
            currentState.messages = student.messages;
            currentState.currentPage = 0;
            renderSlamBookPages();
            switchSection('viewer-screen');
            loginForm.reset();
        } else {
            alert('Invalid credentials. Only ' + student.name + ' can access this view.');
        }
    };

    // Carousel Navigation
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
