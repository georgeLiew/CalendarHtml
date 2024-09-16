class Calendar {
    constructor(options) {
        this.options = options;
        this.selectedDates = options.singleDateSelector ? null : [];
        this.disabledDates = [];
        this.prices = {};
        this.currentMonth = new Date();
        this.view = options.view || 'desktop';
        this.dateFormat = options.dateFormat || "ddd, DD/MMM/YYYY";
        this.calendarId = `calendar-container-${Math.random().toString(36).substr(2, 9)}`;
        this.init();
    }

    init() {
        this.createCalendar();
        this.addEventListeners();
        this.updateCalendar();
        this.setView(this.view);
    }

    createCalendar() {
        const calendarContainer = document.createElement('div');
        calendarContainer.id = this.calendarId;
        calendarContainer.className = 'calendar-container';
        calendarContainer.style.display = 'none';

        // Create desktop view (2 months side by side)
        const desktopView = document.createElement('div');
        desktopView.className = 'desktop-view';
        for (let i = 0; i < 2; i++) {
            const monthContainer = this.createMonthContainer();
            desktopView.appendChild(monthContainer);
        }
        const verticalLine = document.createElement('div');
        verticalLine.className = 'vertical-line';
        desktopView.insertBefore(verticalLine, desktopView.children[1]);

        // Add navigation buttons for desktop
        const prevButton = document.createElement('button');
        prevButton.innerText = 'Previous';
        prevButton.addEventListener('click', () => this.changeMonth(-1));
        const nextButton = document.createElement('button');
        nextButton.innerText = 'Next';
        nextButton.addEventListener('click', () => this.changeMonth(1));
        desktopView.appendChild(prevButton);
        desktopView.appendChild(nextButton);

        calendarContainer.appendChild(desktopView);

        // Create mobile view (multiple months stacked)
        const mobileView = document.createElement('div');
        mobileView.className = 'mobile-view';
        for (let i = 0; i < 3; i++) {
            const monthContainer = this.createMonthContainer();
            mobileView.appendChild(monthContainer);
        }
        calendarContainer.appendChild(mobileView);

        // Append to placeholder or body
        const placeholder = document.querySelector(this.options.placeholder);
        if (placeholder) {
            placeholder.appendChild(calendarContainer);
        } else {
            document.body.appendChild(calendarContainer);
        }
    }

    createMonthContainer() {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';

        // Add month and year header
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthContainer.appendChild(monthHeader);

        // Add day of week headers
        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-header';
        daysOfWeek.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.innerText = day;
            headerRow.appendChild(dayElement);
        });
        monthContainer.appendChild(headerRow);

        // Add date cells
        const dateContainer = document.createElement('div');
        dateContainer.className = 'date-container';
        for (let i = 0; i < 42; i++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'calendar-date';
            dateContainer.appendChild(dateCell);
        }
        monthContainer.appendChild(dateContainer);

        return monthContainer;
    }

    addEventListeners() {
        const inputSelector = this.options.singleDateSelector || this.options.rangeDateSelectors.join(', ');
        document.querySelectorAll(inputSelector).forEach(input => {
            input.addEventListener('focus', () => {
                document.getElementById(this.calendarId).style.display = 'block';
            });
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest(`#${this.calendarId}`) && !event.target.matches(inputSelector)) {
                document.getElementById(this.calendarId).style.display = 'none';
            }
        });

        document.querySelectorAll(`#${this.calendarId} .calendar-date`).forEach(dateCell => {
            dateCell.addEventListener('click', (event) => {
                this.selectDate(event.target);
            });
            dateCell.addEventListener('mouseover', (event) => {
                this.highlightRange(event.target);
            });
        });

        // Add swipe functionality for mobile view
        if (this.view === 'mobile') {
            const mobileView = document.querySelector(`#${this.calendarId} .mobile-view`);
            let touchStartY;
            mobileView.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            });
            mobileView.addEventListener('touchmove', (e) => {
                const touchEndY = e.touches[0].clientY;
                const diff = touchStartY - touchEndY;
                if (Math.abs(diff) > 50) { // Threshold for swipe
                    this.changeMonth(diff > 0 ? 1 : -1);
                    touchStartY = touchEndY;
                }
            });
        }
    }

    selectDate(dateElement) {
        const selectedDate = new Date(dateElement.dataset.date);
        
        if (this.options.singleDateSelector) {
            // Single date picker logic
            const singleDateInput = document.querySelector(this.options.singleDateSelector);
            singleDateInput.value = this.formatDate(selectedDate);
            this.selectedDates = selectedDate;
            document.getElementById(this.calendarId).style.display = 'none';
        } else if (this.options.rangeDateSelectors) {
            // Date range picker logic
            const [startDateInput, endDateInput] = this.options.rangeDateSelectors.map(selector => document.querySelector(selector));
            
            if (this.selectedDates.length === 0 || this.selectedDates.length === 2) {
                this.selectedDates = [selectedDate];
                startDateInput.value = this.formatDate(selectedDate);
                endDateInput.value = '';
            } else {
                if (selectedDate > this.selectedDates[0]) {
                    this.selectedDates[1] = selectedDate;
                    endDateInput.value = this.formatDate(selectedDate);
                    document.getElementById(this.calendarId).style.display = 'none';
                } else if (selectedDate < this.selectedDates[0]) {
                    this.selectedDates = [selectedDate];
                    startDateInput.value = this.formatDate(selectedDate);
                    endDateInput.value = '';
                } else {
                    // If same as start date, do nothing
                    return;
                }
            }
        }

        this.highlightSelectedDates();
    }

    highlightSelectedDates() {
        document.querySelectorAll(`#${this.calendarId} .calendar-date`).forEach(dateCell => {
            const cellDate = new Date(dateCell.dataset.date);
            dateCell.classList.remove('selected', 'in-range');
            
            if (this.options.singleDateSelector) {
                if (this.selectedDates && cellDate.getTime() === this.selectedDates.getTime()) {
                    dateCell.classList.add('selected');
                }
            } else if (this.options.rangeDateSelectors) {
                if (this.selectedDates.some(date => date && date.getTime() === cellDate.getTime())) {
                    dateCell.classList.add('selected');
                } else if (this.selectedDates.length === 2 && 
                           cellDate > this.selectedDates[0] && 
                           cellDate < this.selectedDates[1]) {
                    dateCell.classList.add('in-range');
                }
            }
        });
    }

    highlightRange(dateElement) {
        if (this.selectedDates.length === 1) {
            const hoverDate = new Date(dateElement.dataset.date);
            document.querySelectorAll(`#${this.calendarId} .calendar-date`).forEach(dateCell => {
                const cellDate = new Date(dateCell.dataset.date);
                if (cellDate > this.selectedDates[0] && cellDate <= hoverDate) {
                    dateCell.classList.add('in-range');
                } else {
                    dateCell.classList.remove('in-range');
                }
            });
        }
    }

    formatDate(date) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return this.dateFormat
            .replace('ddd', days[date.getDay()])
            .replace('DD', date.getDate().toString().padStart(2, '0'))
            .replace('MMM', months[date.getMonth()])
            .replace('YYYY', date.getFullYear());
    }

    updateCalendar() {
        const monthContainers = document.querySelectorAll(`#${this.calendarId} .month-container`);
        monthContainers.forEach((container, index) => {
            const monthDate = new Date(this.currentMonth);
            monthDate.setMonth(monthDate.getMonth() + index);
            this.updateMonthContainer(container, monthDate);
        });
    }

    updateMonthContainer(container, date) {
        const monthHeader = container.querySelector('.month-header');
        monthHeader.innerText = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

        const dateCells = container.querySelectorAll('.calendar-date');
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        let currentDate = new Date(firstDay);
        currentDate.setDate(currentDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));

        dateCells.forEach((cell, index) => {
            cell.innerText = currentDate.getDate();
            cell.dataset.date = currentDate.toISOString();

            if (currentDate.getMonth() !== date.getMonth()) {
                cell.classList.add('other-month');
            } else {
                cell.classList.remove('other-month');
            }

            if (this.disabledDates.includes(currentDate.toISOString().split('T')[0])) {
                cell.classList.add('disabled');
            } else {
                cell.classList.remove('disabled');
            }

            const price = this.prices[currentDate.toISOString().split('T')[0]];
            if (price) {
                const priceElement = document.createElement('div');
                priceElement.className = 'price';
                priceElement.innerText = `$${price}`;
                cell.appendChild(priceElement);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        });
    }

    changeMonth(delta) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
        this.updateCalendar();
    }

    disableDates(dates) {
        this.disabledDates = dates;
        this.updateCalendar();
    }

    setPrices(prices) {
        this.prices = prices;
        this.updateCalendar();
    }

    setView(view) {
        this.view = view;
        const container = document.getElementById(this.calendarId);
        if (view === 'desktop') {
            container.classList.remove('mobile-view');
            container.classList.add('desktop-view');
        } else {
            container.classList.remove('desktop-view');
            container.classList.add('mobile-view');
        }
        this.updateCalendar();
    }
}

// Export the Calendar class
export default Calendar;