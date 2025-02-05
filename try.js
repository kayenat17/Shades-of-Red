const monthYearElement = document.getElementById('monthYear');
const daysContainer = document.getElementById('daysContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let periodStartDate = null;
let periodEndDate = null;

function renderCalendar() {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    monthYearElement.textContent = `${firstDayOfMonth.toLocaleString('default', { month: 'long' })} ${currentYear}`;

    const daysHTML = [];
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
        daysHTML.push(`<div class="day"></div>`);
    }
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        let classes = 'day';
        if (i === periodStartDate) {
            classes += ' start-date';
        } else if (i === periodEndDate) {
            classes += ' end-date';
        }
        if (i >= periodStartDate && i <= periodEndDate) {
            classes += ' selected';
        }
        const mark = (i === periodStartDate || i === periodEndDate) ? '*' : '';
        daysHTML.push(`<div class="${classes}" onclick="selectDate(${i})">${i}<span class="mark">${mark}</span></div>`);
    }
    daysContainer.innerHTML = daysHTML.join('');
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 9;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 9) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

function selectDate(date) {
    if (!periodStartDate) {
        periodStartDate = date;
        renderCalendar();
    } else if (!periodEndDate) {
        if (date >= periodStartDate) {
            periodEndDate = date;
            renderCalendar();
        } else {
            alert("End date should be after start date.");
        }
    } else {
        periodStartDate = date;
        periodEndDate = null;
        renderCalendar();
    }
}

renderCalendar();
