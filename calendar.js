class Calendar {
    constructor(dateFormat = "EEE, dd/MMM/yyyy") {
        this.currentDate = new Date();
        this.selectedDates = [];
        this.disabledDates = [];
        this.prices = {};
        this.dateFormat = dateFormat;

        this.initElements();
        this.renderCalendar();
        this.addEventListeners();
    }

    initElements() {
        this.calendarContainer = document.querySelector('.calendar-container');
        this.calendarBody = document.getElementById('calendarBody');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        this.startDateInput = document.getElementById('startDate');
        this.endDateInput = document.getElementById('endDate');
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        this.currentMonthElement.textContent = `${this.currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        let dateString = '';
        for (let i = 0; i < firstDay; i++) {
            dateString += '<div></div>';
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateClass = this.getDateClass(date);
            const price = this.prices[date.toDateString()] || '';
            dateString += `<div class="${dateClass}" data-date="${date.toDateString()}">${i}<span class="price">${price}</span></div>`;
        }

        this.calendarBody.innerHTML = dateString;
    }

    getDateClass(date) {
        let classes = 'date';
        if (this.disabledDates.some(d => d.toDateString() === date.toDateString())) {
            classes += ' disabled';
        }
        if (this.selectedDates.some(d => d.toDateString() === date.toDateString())) {
            classes += ' selected';
        }
        return classes;
    }

    addEventListeners() {
        this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        this.calendarBody.addEventListener('click', (e) => this.handleDateClick(e));

        // Add touch events for swiping
        let touchStartX = 0;
        let touchEndX = 0;
        this.calendarBody.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        this.calendarBody.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });

        // Show calendar when clicking on input fields
        this.startDateInput.addEventListener('click', () => this.showCalendar());
        this.endDateInput.addEventListener('click', () => this.showCalendar());

        // Hide calendar when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.calendarContainer.contains(e.target) && 
                e.target !== this.startDateInput && 
                e.target !== this.endDateInput) {
                this.hideCalendar();
            }
        });
    }

    handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            this.changeMonth(1);
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            this.changeMonth(-1);
        }
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    handleDateClick(e) {
        if (!e.target.classList.contains('date') || e.target.classList.contains('disabled')) return;

        const clickedDate = new Date(e.target.dataset.date);

        if (this.selectedDates.length === 0) {
            this.selectedDates = [clickedDate];
        } else if (this.selectedDates.length === 1) {
            if (clickedDate > this.selectedDates[0]) {
                this.selectedDates.push(clickedDate);
            } else {
                this.selectedDates = [clickedDate];
            }
        } else if (this.selectedDates.length === 2) {
            if (clickedDate > this.selectedDates[1]) {
                this.selectedDates[1] = clickedDate;
            } else if (clickedDate < this.selectedDates[0]) {
                this.selectedDates[0] = clickedDate;
            } else {
                this.selectedDates = [clickedDate];
            }
        }

        this.updateInputs();
        this.renderCalendar();

        if (this.selectedDates.length === 2) {
            this.hideCalendar();
        }
    }

    updateInputs() {
        this.startDateInput.value = this.selectedDates[0] ? this.formatDate(this.selectedDates[0]) : '';
        this.endDateInput.value = this.selectedDates[1] ? this.formatDate(this.selectedDates[1]) : '';
    }

    formatDate(date) {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        };
        const formattedDate = date.toLocaleDateString('en-US', options);
        return this.dateFormat
            .replace('EEE', formattedDate.split(',')[0])
            .replace('dd', formattedDate.split(' ')[2])
            .replace('MMM', formattedDate.split(' ')[1])
            .replace('yyyy', formattedDate.split(' ')[3]);
    }

    setDisabledDates(dates) {
        this.disabledDates = dates.map(date => new Date(date));
        this.renderCalendar();
    }

    setPrices(prices) {
        this.prices = Object.fromEntries(
            Object.entries(prices).map(([key, value]) => [new Date(key).toDateString(), value])
        );
        this.renderCalendar();
    }

    showCalendar() {
        this.calendarContainer.style.display = 'block';
    }

    hideCalendar() {
        if (this.selectedDates.length === 2) {
            this.calendarContainer.style.display = 'none';
        }
    }

    setDateFormat(format) {
        this.dateFormat = format;
        this.updateInputs();
    }
}

const calendar = new Calendar();

// Example usage:
// calendar.setDisabledDates(['2023-05-06', '2023-05-07']);
// calendar.setPrices({'2023-05-13': '$100', '2023-05-14': '$120'});
// calendar.setDateFormat("yyyy-MM-dd");