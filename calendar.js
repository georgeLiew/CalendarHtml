class Calendar {
    constructor(dateFormat = "EEE, dd/MMM/yyyy") {
        this.currentDate = new Date();
        this.selectedDates = [];
        this.disabledDates = [];
        this.prices = {};
        this.dateFormat = dateFormat;
        this.isMobile = window.innerWidth <= 768; // Add mobile detection
        this.initContainer();

        this.initElements();
        this.renderCalendar();
        this.addEventListeners();
        this.hoverDate = null;
        this.touchStartX = 0;
        this.touchEndX = 0;
    }

    initContainer() {
        // Create container for calendar
        this.calendarContainer = document.createElement('div');
        this.calendarContainer.className = 'calendar-container';
        this.calendarContainer.style.display = 'none';

        if (this.isMobile) {
            this.calendarContainer.style.position = 'fixed';
            this.calendarContainer.style.top = '0';
            this.calendarContainer.style.left = '0';
            this.calendarContainer.style.width = '100vw';
            this.calendarContainer.style.height = '100vh';
            this.calendarContainer.style.zIndex = '1000';
        } else {
            this.calendarContainer.style.position = 'absolute';
        }

        document.body.appendChild(this.calendarContainer);

        // Move existing calendar HTML into this container
        // ... (code to create calendar HTML structure)
    }

    initElements() {
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

        // Add mouseover and mouseout events to date cells
        const dateCells = this.calendarBody.querySelectorAll('.date:not(.disabled)');
        dateCells.forEach(cell => {
            cell.addEventListener('mouseenter', (e) => this.handleDateHover(e));
            cell.addEventListener('mouseleave', (e) => this.handleDateHoverEnd(e));
        });
    }

    getDateClass(date) {
        let classes = 'date';
        if (this.disabledDates.some(d => d.toDateString() === date.toDateString())) {
            classes += ' disabled';
        }
        if (this.selectedDates.some(d => d.toDateString() === date.toDateString())) {
            classes += ' selected';
        }
        if (this.selectedDates.length === 2 && 
            date > this.selectedDates[0] && 
            date < this.selectedDates[1]) {
            classes += ' in-range';
        }
        if (this.selectedDates.length === 1 && this.hoverDate) {
            const [minDate, maxDate] = [this.selectedDates[0], this.hoverDate].sort((a, b) => a - b);
            if (date > minDate && date <= maxDate) {
                classes += ' hover-range';
            }
        }
        return classes;
    }

    handleDateHover(e) {
        if (this.selectedDates.length === 1) {
            this.hoverDate = new Date(e.target.dataset.date);
            this.renderCalendar();
            console.log('handleDateHover', this.hoverDate);
        }
    }

    handleDateHoverEnd(e) {
        if (this.selectedDates.length === 1) {
            this.hoverDate = null;
            this.renderCalendar();
            console.log('handleDateHoverEnd');
        }
    }

    addEventListeners() {
        this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        this.calendarBody.addEventListener('click', (e) => this.handleDateClick(e));

        // Add touch events for swiping
        this.calendarBody.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        });
        this.calendarBody.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
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
        if (this.touchEndX < this.touchStartX - swipeThreshold) {
            this.changeMonth(1);
        }
        if (this.touchEndX > this.touchStartX + swipeThreshold) {
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

        if (this.inputs.length === 1) {
            // Single date selection
            this.selectedDates = [clickedDate];
            this.updateInputs();
            this.renderCalendar();
            this.hideCalendar();
        } else if (this.inputs.length === 2) {
            // Two date selection
            if (this.selectedDates.length === 0 || this.selectedDates.length === 2) {
                this.selectedDates = [clickedDate];
            } else if (this.selectedDates.length === 1) {
                if (clickedDate > this.selectedDates[0]) {
                    this.selectedDates.push(clickedDate);
                } else {
                    this.selectedDates = [clickedDate, this.selectedDates[0]];
                }
                this.hideCalendar();
            }
            this.hoverDate = null;
            this.updateInputs();
            this.renderCalendar();
        }
    }

    updateInputs() {
        if (this.inputs.length === 1) {
            this.inputs[0].value = this.selectedDates[0] ? this.formatDate(this.selectedDates[0]) : '';
        } else if (this.inputs.length === 2) {
            this.inputs[0].value = this.selectedDates[0] ? this.formatDate(this.selectedDates[0]) : '';
            this.inputs[1].value = this.selectedDates[1] ? this.formatDate(this.selectedDates[1]) : '';
        }
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
        if (this.inputs.length === 1 || (this.inputs.length === 2 && this.selectedDates.length === 2)) {
            this.calendarContainer.style.display = 'none';
        }
    }

    setDateFormat(format) {
        this.dateFormat = format;
        this.updateInputs();
    }

    // New method to initialize start and end date inputs
    initDateInputs(...inputSelectors) {
        this.inputs = inputSelectors.map(selector => document.querySelector(selector));

        if (this.inputs.some(input => !input)) {
            console.error('One or more date inputs not found');
            return;
        }

        this.inputs.forEach(input => {
            input.addEventListener('click', () => this.showCalendar());
        });

        // Position the calendar container relative to the first input
        const firstInput = this.inputs[0];
        const rect = firstInput.getBoundingClientRect();
        this.calendarContainer.style.top = `${rect.bottom}px`;
        this.calendarContainer.style.left = `${rect.left}px`;
    }
}
// Example usage:
// calendar.setDisabledDates(['2023-05-06', '2023-05-07']);
// calendar.setPrices({'2023-05-13': '$100', '2023-05-14': '$120'});
// calendar.setDateFormat("yyyy-MM-dd");

// Usage:
const calendar = new Calendar();
calendar.initDateInputs('#startDate', '#endDate'); // For two date selection
// OR
// calendar.initDateInputs('#singleDate'); // For single date selection