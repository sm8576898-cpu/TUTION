let students = [
    { id: 1, name: "ASMI RONG", class: "C-X", phone: "9876543210", address: "হাওড়া", monthlyData: {} },
    { id: 2, name: "PRITI RONG", class: "C-X", phone: "9876543211", address: "শিবপুর", monthlyData: {} },
    { id: 3, name: "RITTIKA PATRA", class: "CLASS-IV", phone: "9876543212", address: "কাদাম তলা", monthlyData: {} },
    { id: 4, name: "SIJA MAKAL", class: "C-V", phone: "9876543213", address: "সাঁতরাগাছি", monthlyData: {} },
    { id: 5, name: "POULOMI BAG", class: "C-V", phone: "9876543214", address: "বালিহাটি", monthlyData: {} },
    { id: 6, name: "RUMI POLLEY", class: "S-II", phone: "9876543215", address: "বেলুড়", monthlyData: {} },
    { id: 7, name: "ARJUN PATRA", class: "C-III", phone: "9876543216", address: "লিলুয়া", monthlyData: {} },
    { id: 8, name: "RIK PATRA", class: "C-1", phone: "9876543217", address: "উত্তরপাড়া", monthlyData: {} },
    { id: 9, name: "SONALI MAKAL", class: "C-VII", phone: "9876543218", address: "কোন্নগর", monthlyData: {} }
];

let questionPapers = [];
let isAdminUnlocked = false;
let currentMonth = "";
const WORKING_DAYS = 26;

const banglaMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const monthMap = {"জানুয়ারি":"01", "ফেব্রুয়ারি":"02", "মার্চ":"03", "এপ্রিল":"04", "মে":"05", "জুন":"06", "জুলাই":"07", "আগস্ট":"08", "সেপ্টেম্বর":"09", "অক্টোবর":"10", "নভেম্বর":"11", "ডিসেম্বর":"12"};

const firebaseConfig = {
    apiKey: "AIzaSyB8eKU6gZTQ1BMjfmtVwDtbl76f3SsSjmI",
    authDomain: "tution-ce289.firebaseapp.com",
    databaseURL: "https://tution-ce289-default-rtdb.firebaseio.com",
    projectId: "tution-ce289",
    storageBucket: "tution-ce289.firebasestorage.app",
    messagingSenderId: "3234005964",
    appId: "1:3234005964:web:88375ee0c783098f7ed369"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

window.onload = () => {
    initLifetimeDateSelectors();
    
    auth.onAuthStateChanged((user) => {
        if (user) {
            isAdminUnlocked = true;
            if(document.getElementById('loginBox')) document.getElementById('loginBox').classList.add('hidden');
            if(document.getElementById('adminControls')) document.getElementById('adminControls').classList.remove('hidden');
            if(document.getElementById('publicMonthDisplay')) document.getElementById('publicMonthDisplay').classList.add('hidden');
            if(document.getElementById('adminDateSelector')) document.getElementById('adminDateSelector').classList.remove('hidden');
            renderAll();
        } else {
            isAdminUnlocked = false;
            if(document.getElementById('loginBox')) document.getElementById('loginBox').classList.remove('hidden');
            if(document.getElementById('adminControls')) document.getElementById('adminControls').classList.add('hidden');
            if(document.getElementById('publicMonthDisplay')) document.getElementById('publicMonthDisplay').classList.remove('hidden');
            if(document.getElementById('adminDateSelector')) document.getElementById('adminDateSelector').classList.add('hidden');
            renderAll();
        }
    });

    const savedStudents = localStorage.getItem('tuition_students');
    if (savedStudents) {
        try { students = JSON.parse(savedStudents); } catch(e){}
    }
    const savedQuestions = localStorage.getItem('tuition_questions');
    if (savedQuestions) {
        try { questionPapers = JSON.parse(savedQuestions); } catch(e){}
    }

    updateDisplayTexts();
    renderAll();
    loadDataFromCloud();
    incrementViews();
};

function toBanglaNumber(num) {
    if(!num && num !== 0) return '';
    const banglaDigits = {'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
    return num.toString().split('').map(d => banglaDigits[d] || d).join('');
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('adminPasswordInput');
    const eyeIcon = document.getElementById('togglePassEye');
    if (!passInput || !eyeIcon) return;
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.innerText = '🙈';
    } else {
        passInput.type = 'password';
        eyeIcon.innerText = '👁️';
    }
}

function getPaymentStatusBadge(feePaid, feeDate) {
    if (!feePaid) return `<span class="tag-late" style="background:#fee2e2; color:#dc2626;">বকেয়া (Due)</span>`;
    if (!feeDate) return `<span class="tag-regular">পেইড (তারিখ নেই)</span>`;
    let day = new Date(feeDate).getDate();
    if (day <= 7) return `<span class="tag-early">🌟 Early Payer (${toBanglaNumber(day)} তারিখ)</span>`;
    if (day >= 13) return `<span class="tag-late">⚠️ Late Fee (${toBanglaNumber(day)} তারিখ)</span>`;
    return `<span class="tag-regular">✔️ Regular (${toBanglaNumber(day)} তারিখ)</span>`;
}

function initLifetimeDateSelectors() {
    const monthSel = document.getElementById('monthSelect');
    const yearInput = document.getElementById('yearSelect');
    const adminMonthSel = document.getElementById('adminPanelMonthSelect');
    const adminYearInput = document.getElementById('adminPanelYearSelect');
    const repMonthSel = document.getElementById('reportMonthSelect');
    const repYearInput = document.getElementById('reportYearSelect');

    if (!monthSel || !yearInput) return;
    monthSel.innerHTML = '';
    if(adminMonthSel) adminMonthSel.innerHTML = '';
    if(repMonthSel) repMonthSel.innerHTML = '';
    
    banglaMonths.forEach(m => {
        monthSel.innerHTML += `<option value="${m}">${m}</option>`;
        if(adminMonthSel) adminMonthSel.innerHTML += `<option value="${m}">${m}</option>`;
        if(repMonthSel) repMonthSel.innerHTML += `<option value="${m}">${m}</option>`;
    });

    const now = new Date();
    const currentYear = now.getFullYear();

    monthSel.value = banglaMonths[now.getMonth()];
    yearInput.value = currentYear;
    if(adminMonthSel) adminMonthSel.value = banglaMonths[now.getMonth()];
    if(adminYearInput) adminYearInput.value = currentYear;
    if(repMonthSel) repMonthSel.value = banglaMonths[now.getMonth()];
    if(repYearInput) repYearInput.value = currentYear;

    updateCurrentMonthString();
}

function updateCurrentMonthString() {
    const m = document.getElementById('monthSelect')?.value || "জুলাই";
    let y = document.getElementById('yearSelect')?.value || new Date().getFullYear();
    currentMonth = `${m} ${toBanglaNumber(y)}`;
}

function changeMonthYear() {
    updateCurrentMonthString();
    if(document.getElementById('adminPanelMonthSelect')) document.getElementById('adminPanelMonthSelect').value = document.getElementById('monthSelect').value;
    if(document.getElementById('adminPanelYearSelect')) document.getElementById('adminPanelYearSelect').value = document.getElementById('yearSelect').value;
    updateDisplayTexts();
    renderAll();
}

function syncAdminPanelDate() {
    if(document.getElementById('monthSelect')) document.getElementById('monthSelect').value = document.getElementById('adminPanelMonthSelect').value;
    if(document.getElementById('yearSelect')) document.getElementById('yearSelect').value = document.getElementById('adminPanelYearSelect').value;
    changeMonthYear();
}

function updateDisplayTexts() {
    if(document.getElementById('displayCurrentMonth')) document.getElementById('displayCurrentMonth').innerText = currentMonth;
    if(document.getElementById('displayHeaderMonth')) document.getElementById('displayHeaderMonth').innerText = currentMonth;
    document.querySelectorAll('.current-month-text').forEach(el => el.innerText = currentMonth);
}

function getMonthData(student, month) {
    if (!student.monthlyData) student.monthlyData = {};
    if (!student.monthlyData[month]) {
        student.monthlyData[month] = {
            attendedDates: [],
            examMarks: 0,
            feePaid: false,
            feeAmount: 0,
            feeDate: "",
            hwDone: false
        };
    }
    if(!student.monthlyData[month].attendedDates) student.monthlyData[month].attendedDates = [];
    return student.monthlyData[month];
}

function loadDataFromCloud() {
    updateCurrentMonthString();
    db.ref('tuition_students').on('value', (snapshot) => {
        const cloudData = snapshot.val();
        if (cloudData) {
            students = cloudData;
            localStorage.setItem('tuition_students', JSON.stringify(students));
            renderAll();
        }
    });

    db.ref('tuition_questions').on('value', (snapshot) => {
        const qData = snapshot.val();
        if (qData) {
            questionPapers = qData;
            localStorage.setItem('tuition_questions', JSON.stringify(questionPapers));
            renderQuestionHub();
        }
    });

    db.ref('branding').on('value', (snapshot) => {
        const brand = snapshot.val();
        if (brand) {
            if (brand.instName && document.getElementById('instituteNameDisplay')) document.getElementById('instituteNameDisplay').innerText = brand.instName;
            if (brand.teacherName && document.getElementById('teacherNameDisplay')) document.getElementById('teacherNameDisplay').innerText = brand.teacherName;
        }
    });
}

function saveData() {
    localStorage.setItem('tuition_students', JSON.stringify(students));
    try { db.ref('tuition_students').set(students); } catch(e) {}
    renderAll();
}

function saveQuestionsData() {
    localStorage.setItem('tuition_questions', JSON.stringify(questionPapers));
    try { db.ref('tuition_questions').set(questionPapers); } catch(e) {}
    renderQuestionHub();
}

function incrementViews() {
    let views = localStorage.getItem('tuition_views_clean') || 0;
    views = parseInt(views) + 1;
    localStorage.setItem('tuition_views_clean', views);
    if(document.getElementById('liveViews')) document.getElementById('liveViews').innerText = views;
}

function switchTab(slideId) {
    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if(document.getElementById(slideId)) document.getElementById(slideId).classList.add('active');
    let navId = slideId.replace('slide-', 'nav-');
    if(document.getElementById(navId)) document.getElementById(navId).classList.add('active');
}

function renderAll() {
    renderLeaderboardsAndSummary();
    renderStudentsGrid();
    renderPublicAttendanceTable();
    renderAdminAttendanceTable();
    renderAdminFeesTable(); // ফিস এখন শুধুমাত্র অ্যাডমিনে রেন্ডার হবে
    renderAdminStudentList();
    renderQuestionHub();
    generateIncomeReport();
    
    const countSpan = document.getElementById('totalStudentsCount');
    if (countSpan) countSpan.innerText = students.length;
}

function renderLeaderboardsAndSummary() {
    let totalFee = 0;
    students.forEach(s => {
        let mData = getMonthData(s, currentMonth);
        if(mData.feePaid) totalFee += parseInt(mData.feeAmount) || 0;
    });
    if(document.getElementById('totalFeeCollected')) document.getElementById('totalFeeCollected').innerText = totalFee.toLocaleString('en-IN');

    const sortedByAtt = [...students].sort((a, b) => b.monthlyData[currentMonth]?.attendedDates?.length - a.monthlyData[currentMonth]?.attendedDates?.length);
    const topAttList = document.getElementById('topAttendanceList');
    if(topAttList) {
        topAttList.innerHTML = '';
        sortedByAtt.slice(0, 2).forEach(s => {
            let att = getMonthData(s, currentMonth).attendedDates.length;
            let percentage = ((att / WORKING_DAYS) * 100).toFixed(1);
            topAttList.innerHTML += `<li><span>${s.name} (${s.class})</span> <span>${toBanglaNumber(percentage)}%</span></li>`;
        });
    }

    const sortedByExam = [...students].sort((a, b) => getMonthData(b, currentMonth).examMarks - getMonthData(a, currentMonth).examMarks);
    const topExamList = document.getElementById('topExamList');
    if(topExamList) {
        topExamList.innerHTML = '';
        sortedByExam.slice(0, 2).forEach(s => {
            let marks = getMonthData(s, currentMonth).examMarks;
            topExamList.innerHTML += `<li><span>${s.name} (${s.class})</span> <span>${toBanglaNumber(marks)} নম্বর</span></li>`;
        });
    }
}

function getFormattedDatesString(datesArray) {
    if (!datesArray || datesArray.length === 0) return "কোনো হাজিরা নেই";
    const mStr = document.getElementById('monthSelect')?.value || "জুলাই";
    const yStr = document.getElementById('yearSelect')?.value || new Date().getFullYear();
    const mm = monthMap[mStr] || "01";
    return datesArray.map(d => {
        let dd = d < 10 ? '0' + d : d;
        return `${toBanglaNumber(dd)}-${toBanglaNumber(mm)}-${toBanglaNumber(yStr)}`;
    }).join('<br>');
}

function renderStudentsGrid() {
    const grid = document.getElementById('studentsGrid');
    if(!grid) return;
    grid.innerHTML = '';
    students.forEach(s => {
        let mData = getMonthData(s, currentMonth);
        let daysArray = mData.attendedDates || [];
        let attCount = daysArray.length;
        let percentage = ((attCount / WORKING_DAYS) * 100).toFixed(0);
        let payBadge = getPaymentStatusBadge(mData.feePaid, mData.feeDate);

        let backContent = isAdminUnlocked 
            ? `<p>📞 ফোন: ${s.phone}</p><p>🏠 ঠিকানা: ${s.address}</p>
               <a href="https://wa.me/91${s.phone}" target="_blank" class="btn-wa" style="margin-top:10px;">WhatsApp</a>`
            : `<p>🔒 ব্যক্তিগত তথ্য সুরক্ষিত</p>`;

        grid.innerHTML += `
            <div class="flip-card" onclick="this.classList.toggle('flipped')">
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        <h3 style="color:#334155;">${s.name}</h3>
                        <p style="font-size:0.85rem; color:#475569;">${s.class}</p>
                        <div style="margin-top:4px;">${payBadge}</div>
                        <div class="progress-container">
                            <div class="progress-label">
                                <span>উপস্থিতি (${toBanglaNumber(attCount)} দিন)</span> <span>${toBanglaNumber(percentage)}%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                        </div>
                        <p style="font-size:0.75rem; color:#64748b; margin-top:8px;">(উল্টাতে ক্লিক করুন 🔄)</p>
                    </div>
                    <div class="flip-card-back">
                        <h4>${s.name}</h4>
                        ${backContent}
                    </div>
                </div>
            </div>`;
    });
}

function renderPublicAttendanceTable() {
    const container = document.getElementById('publicAttendanceContainer');
    if(!container) return;
    let html = `<table><tr><th>নাম</th><th>মোট উপস্থিতি</th><th>বিস্তারিত (DD-MM-YYYY)</th></tr>`;
    students.forEach((s) => {
        let mData = getMonthData(s, currentMonth);
        let daysArray = mData.attendedDates || [];
        html += `<tr>
            <td><strong>${s.name}</strong></td>
            <td><strong style="color:var(--primary-dark);">${toBanglaNumber(daysArray.length)}</strong> / ২৬ দিন</td>
            <td>
                <div class="tooltip-container">
                    <span class="calendar-icon">📅</span>
                    <div class="tooltip-text"><strong>উপস্থিতির তারিখগুলি:</strong><br>${getFormattedDatesString(daysArray)}</div>
                </div>
            </td>
        </tr>`;
    });
    html += `</table>`;
    container.innerHTML = html;
}

function renderAdminAttendanceTable() {
    const container = document.getElementById('adminAttendanceContainer');
    if(!container) return;
    let html = `<table><tr><th>নাম</th><th>হাজিরা আপডেট করুন (কমা দিয়ে তারিখ)</th><th>হোমওয়ার্ক</th></tr>`;
    students.forEach((s, idx) => {
        let mData = getMonthData(s, currentMonth);
        let daysArray = mData.attendedDates || [];
        html += `<tr>
            <td><strong>${s.name}</strong></td>
            <td>
                <div class="att-admin-box">
                    <input type="text" class="date-input-box" placeholder="যেমন: 1, 5, 12" value="${daysArray.join(', ')}" onchange="updateAttendanceDates(${idx}, this.value)">
                    <button onclick="markTodayAttendance(${idx})" class="btn-check">✔️</button>
                    <span style="font-weight:900;">= ${toBanglaNumber(daysArray.length)} দিন</span>
                </div>
            </td>
            <td>
                <input type="checkbox" ${mData.hwDone ? 'checked' : ''} onchange="toggleHW(${idx})" style="width:18px; height:18px;"> ${mData.hwDone ? 'হয়েছে ✔️' : 'বাকি'}
            </td>
        </tr>`;
    });
    html += `</table>`;
    container.innerHTML = html;
}

function updateAttendanceDates(index, val) {
    let mData = getMonthData(students[index], currentMonth);
    if (!val.trim()) { mData.attendedDates = []; } 
    else {
        let rawArr = val.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d > 0 && d <= 31);
        mData.attendedDates = [...new Set(rawArr)].sort((a, b) => a - b);
    }
    saveData();
}

function markTodayAttendance(index) {
    let mData = getMonthData(students[index], currentMonth);
    let today = new Date().getDate();
    if (!mData.attendedDates) mData.attendedDates = [];
    if (mData.attendedDates.includes(today)) {
        alert(`❌ আজকের তারিখ (${toBanglaNumber(today)}) আগেই যুক্ত আছে!`);
        return;
    }
    mData.attendedDates.push(today);
    mData.attendedDates.sort((a, b) => a - b);
    saveData();
}

function toggleHW(index) {
    let mData = getMonthData(students[index], currentMonth);
    mData.hwDone = !mData.hwDone;
    saveData();
}

function renderAdminFeesTable() {
    const container = document.getElementById('adminFeesContainer');
    if(!container) return;
    
    let totalCollected = 0;

    let html = `<table><tr>
        <th>নাম</th>
        <th>পেমেন্ট স্ট্যাটাস</th>
        <th>পেমেন্ট তারিখ</th>
        <th>টাকার পরিমাণ (৳)</th>
        <th>নম্বর</th>
        <th>রিসিট/রিমাইন্ডার</th>
    </tr>`;

    students.forEach((s, idx) => {
        let mData = getMonthData(s, currentMonth);
        if(mData.feePaid) {
            totalCollected += parseInt(mData.feeAmount) || 0;
        }

        html += `<tr>
            <td><strong>${s.name}</strong></td>
            <td>
                <button onclick="toggleFee(${idx})" class="btn ${mData.feePaid ? 'btn-success' : 'btn-danger'}" style="padding:6px 10px; font-size:0.8rem;">
                    ${mData.feePaid ? 'পেইড ✔️' : 'বকেয়া'}
                </button>
            </td>
            <td>
                <input type="date" value="${mData.feeDate || ''}" onchange="updateFeeDate(${idx}, this.value)" class="date-input-box" style="width:130px; padding:4px;">
            </td>
            <td>
                <input type="number" placeholder="৳" value="${mData.feeAmount}" onchange="updateFeeAmount(${idx}, this.value)" class="date-input-box" style="width:80px; padding:4px;">
            </td>
            <td>
                <input type="number" value="${mData.examMarks}" onchange="updateMarks(${idx}, this.value)" class="date-input-box" style="width:60px; padding:4px;">
            </td>
            <td>
                ${!mData.feePaid 
                    ? `<a href="https://wa.me/91${s.phone}?text=${encodeURIComponent('নমস্কার, ' + currentMonth + ' মাসের ফিস বকেয়া রয়েছে।')}" target="_blank" class="btn-wa">রিমাইন্ডার 💬</a>` 
                    : `<button onclick="alert('৳${toBanglaNumber(mData.feeAmount)} জমা নেওয়া হয়েছে।')" class="btn btn-primary" style="font-size:0.75rem;">রিসিট 📄</button>`}
            </td>
        </tr>`;
    });
    html += `</table>`;
    container.innerHTML = html;

    const sumEl = document.getElementById('adminTotalFeesCollected');
    if(sumEl) sumEl.innerText = `৳ ${totalCollected.toLocaleString('en-IN')}`;
}

function toggleFee(index) { 
    if(!isAdminUnlocked) return; 
    let mData = getMonthData(students[index], currentMonth); 
    mData.feePaid = !mData.feePaid; 
    if (mData.feePaid && !mData.feeDate) { mData.feeDate = new Date().toISOString().split('T')[0]; } 
    saveData(); 
}
function updateFeeDate(index, val) { 
    if(!isAdminUnlocked) return; 
    let mData = getMonthData(students[index], currentMonth); 
    mData.feeDate = val; 
    if(val) mData.feePaid = true; 
    saveData(); 
}
function updateFeeAmount(index, val) { 
    if(!isAdminUnlocked) return; 
    getMonthData(students[index], currentMonth).feeAmount = parseInt(val) || 0; 
    saveData(); 
}
function updateMarks(index, val) { 
    if(!isAdminUnlocked) return; 
    getMonthData(students[index], currentMonth).examMarks = parseInt(val) || 0; 
    saveData(); 
}

function uploadQuestionPaper() {
    const classInput = document.getElementById('qClassInput'); const fileInput = document.getElementById('qFileInput'); const qClass = classInput?.value.trim() || "General Note";
    if (!fileInput || fileInput.files.length === 0) { alert("❌ PDF ফাইল সিলেক্ট করুন!"); return; }
    const file = fileInput.files[0]; const fileSizeKB = file.size / 1024;
    if (file.type !== "application/pdf") { alert("❌ শুধুমাত্র PDF ফাইল!"); return; }
    if (fileSizeKB < 20 || fileSizeKB > 60) { alert(`❌ সাইজ ${fileSizeKB.toFixed(1)} KB। (নিয়ম: 20-60 KB)`); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        questionPapers.push({ id: Date.now(), className: qClass, fileName: file.name, sizeKB: fileSizeKB.toFixed(1), url: e.target.result });
        classInput.value = ""; fileInput.value = ""; saveQuestionsData(); alert(`✅ আপলোড হয়েছে!`);
    };
    reader.readAsDataURL(file);
}
function deleteQuestionPaper(id) { if (confirm("ডিলিট করতে চান?")) { questionPapers = questionPapers.filter(q => q.id !== id); saveQuestionsData(); } }
function renderQuestionHub() {
    const homeList = document.getElementById('questionList'); const adminList = document.getElementById('adminQuestionList');
    if (homeList) { homeList.innerHTML = questionPapers.length === 0 ? `<p style="color:#64748b; font-size:0.85rem;">কোনো প্রশ্নপত্র নেই।</p>` : questionPapers.map(q => `<a href="${q.url}" download="${q.fileName}" class="q-link-item" style="display:block; margin:6px 0; background:#f1f5f9; padding:10px; border-radius:8px;">📄 <strong>[${q.className}]</strong> ${q.fileName} (${toBanglaNumber(q.sizeKB)} KB) ⬇️</a>`).join(''); }
    if (adminList) { adminList.innerHTML = questionPapers.length === 0 ? `<p style="color:#64748b;">কোনো প্রশ্ন নেই।</p>` : `<table>` + questionPapers.map(q => `<tr><td><strong>${q.className}</strong></td><td>${q.fileName}</td><td>${toBanglaNumber(q.sizeKB)} KB</td><td><button onclick="deleteQuestionPaper(${q.id})" class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;">ডিলিট</button></td></tr>`).join('') + `</table>`; }
}

function searchStudent() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || ""; const resultsDiv = document.getElementById('searchResults'); if(!resultsDiv) return; resultsDiv.innerHTML = ''; if (query.trim() === '') return;
    students.filter(s => s.name.toLowerCase().includes(query)).forEach(s => { resultsDiv.innerHTML += `<div class="search-item" onclick="switchTab('slide-students')"><strong>${s.name}</strong> (${s.class})</div>`; });
}
function unlockAdmin() {
    const email = document.getElementById('adminEmailInput')?.value; const password = document.getElementById('adminPasswordInput')?.value;
    if (!email || !password) { alert("❌ দুটিই লিখুন!"); return; }
    auth.signInWithEmailAndPassword(email, password).then(() => { alert("✅ লগইন সফল!"); }).catch(() => { alert("❌ ভুল তথ্য!"); });
}
function lockAdmin() { auth.signOut().then(() => { alert("🔒 লক করা হয়েছে।"); }); }
function updateBranding() { const inst = document.getElementById('editInstName')?.value; const t = document.getElementById('editTeacherName')?.value; if (inst) try{db.ref('branding/instName').set(inst);}catch(e){} if (t) try{db.ref('branding/teacherName').set(t);}catch(e){} alert("আপডেট হয়েছে!"); }
function addStudent() {
    const name = document.getElementById('newStName')?.value; const cls = document.getElementById('newStClass')?.value;
    if (!name || !cls) { alert("❌ নাম ও ক্লাস লিখুন!"); return; }
    students.push({ id: Date.now(), name: name, class: cls, phone: document.getElementById('newStPhone')?.value || "N/A", address: document.getElementById('newStAddress')?.value || "N/A", monthlyData: {} });
    saveData(); alert(`✅ যোগ হয়েছে!`);
}
function editStudent(index) {
    let s = students[index]; let n = prompt("নাম:", s.name); let c = prompt("ক্লাস:", s.class); if(n&&c){ students[index].name=n; students[index].class=c; saveData(); alert("সফল!"); }
}
function deleteStudent(index) { if (confirm("ডিলিট করতে চান?")) { students.splice(index, 1); saveData(); } }
function renderAdminStudentList() {
    const container = document.getElementById('adminStudentListContainer'); if (!container) return;
    container.innerHTML = `<table>` + students.map((s, idx) => `<tr><td><strong>${s.name}</strong></td><td>${s.class}</td><td><button onclick="editStudent(${idx})" class="btn btn-warning" style="padding:4px 8px; font-size:0.8rem;">এডিট</button> <button onclick="deleteStudent(${idx})" class="btn btn-danger" style="padding:4px 8px; font-size:0.8rem;">ডিলিট</button></td></tr>`).join('') + `</table>`;
}

function generateIncomeReport() {
    const container = document.getElementById('incomeReportContainer'); if (!container) return;
    const m = document.getElementById('reportMonthSelect')?.value; 
    let y = document.getElementById('reportYearSelect')?.value || new Date().getFullYear(); 
    if(!m) return;
    
    const filterMonthStr = `${m} ${toBanglaNumber(y)}`; 
    let totalIncome = 0;

    let html = `
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin:0; color:#3730a3;">জ্ঞানকুঠির - Tuition Report</h2>
        <p style="margin:5px 0; font-size:1.1rem; font-weight:bold; color:#475569;">মাস: ${filterMonthStr}</p>
    </div>
    <table>
        <tr style="background: #e6fcf5;">
            <th>ছাত্র/ছাত্রীর নাম</th>
            <th>ক্লাস</th>
            <th>উপস্থিতি</th>
            <th>পেমেন্ট তারিখ</th>
            <th>স্ট্যাটাস ট্যাগ</th>
            <th style="text-align:right;">টাকা (৳)</th>
        </tr>`;

    students.forEach(s => {
        let mData = getMonthData(s, filterMonthStr);
        let amount = mData.feePaid ? (parseInt(mData.feeAmount) || 0) : 0;
        totalIncome += amount;
        let statusBadge = getPaymentStatusBadge(mData.feePaid, mData.feeDate);
        let attCount = mData.attendedDates ? mData.attendedDates.length : 0;

        html += `<tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.class}</td>
            <td>${toBanglaNumber(attCount)} দিন</td>
            <td>${mData.feeDate || '-'}</td>
            <td>${statusBadge}</td>
            <td style="text-align:right; font-size:1.05rem;"><strong>৳ ${amount.toLocaleString('en-IN')}</strong></td>
        </tr>`;
    });

    html += `<tr style="background: #dcfce7; font-size: 1.15rem;">
        <td colspan="5" style="text-align: right;"><strong>মোট মাসিক আয় (Total Income):</strong></td>
        <td style="text-align:right;"><strong style="color: #166534;">৳ ${totalIncome.toLocaleString('en-IN')}</strong></td>
    </tr></table>`;
    
    container.innerHTML = html;
}