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
        this.mobileMonths = []; // Array to store month data for mobile view
        this.enableScrollLoading = false;
        this.init();
    }

    init() {
        this.createCalendar();
        this.addEventListeners();
        this.updateCalendar();
        this.setView(this.view); // This will now be called after creation
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

        // Create mobile view (full-screen popup)
        const mobileView = document.createElement('div');
        mobileView.className = 'mobile-view';
        mobileView.innerHTML = `
            <div class="mobile-header">
                <button class="close-btn">Close</button>
                <h2>Select Date</h2>
            </div>
            <div class="selected-date-display"></div>
            <div class="mobile-months-container"></div>
            <div class="confirm-btn-container">
                <button class="confirm-btn">Confirm</button>
            </div>
        `;
        calendarContainer.appendChild(mobileView);

        // Append to body for full-screen mobile view
        document.body.appendChild(calendarContainer);
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
            input.addEventListener('click', () => {
                const container = document.getElementById(this.calendarId);
                container.style.display = 'block';
                this.setView(this.view);
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

        // Mobile view specific listeners
        const mobileView = document.querySelector(`#${this.calendarId} .mobile-view`);
        const closeBtn = mobileView.querySelector('.close-btn');
        const monthsContainer = mobileView.querySelector('.mobile-months-container');
        const confirmBtn = mobileView.querySelector('.confirm-btn');

        closeBtn.addEventListener('click', () => {
            document.getElementById(this.calendarId).style.display = 'none';
        });

        confirmBtn.addEventListener('click', () => {
            this.confirmSelection();
        });

        monthsContainer.addEventListener('scroll', this.handleMobileScroll.bind(this));
    }

    selectDate(dateElement) {
        const selectedDate = new Date(dateElement.dataset.date);
        
        if (this.options.singleDateSelector) {
            // Single date picker logic
            this.selectedDates = selectedDate;
        } else if (this.options.rangeDateSelectors) {
            // Date range picker logic
            if (this.selectedDates.length === 0 || this.selectedDates.length === 2) {
                this.selectedDates = [selectedDate];
            } else {
                if (selectedDate > this.selectedDates[0]) {
                    this.selectedDates[1] = selectedDate;
                } else if (selectedDate < this.selectedDates[0]) {
                    this.selectedDates = [selectedDate];
                } else {
                    // If same as start date, do nothing
                    return;
                }
            }
        }

        this.highlightSelectedDates();
        this.updateSelectedDateDisplay();
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
        const desktopView = container.querySelector('.desktop-view');
        const mobileView = container.querySelector('.mobile-view');

        if (view === 'desktop') {
            container.style.position = 'absolute';
            desktopView.style.display = 'flex';
            mobileView.style.display = 'none';
            this.updateCalendar();
        } else {
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.zIndex = '1000';
            desktopView.style.display = 'none';
            mobileView.style.display = 'flex';
            this.initMobileView();
        }
    }

    initMobileView() {
        this.mobileMonths = [];
        const currentDate = new Date(this.currentMonth);
        
        // Add 2 previous months, current month, and 2 next months
        for (let i = -2; i <= 2; i++) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            this.mobileMonths.push(monthDate);
        }

        // Disable scroll loading initially
        this.enableScrollLoading = false;

        this.renderMobileMonths();

        // Enable scroll loading after a short delay
        setTimeout(() => {
            this.enableScrollLoading = true;
        }, 500); // Adjust this delay as needed
    }

    renderMobileMonths() {
        const monthsContainer = document.querySelector(`#${this.calendarId} .mobile-months-container`);
        monthsContainer.innerHTML = '';

        this.mobileMonths.forEach((date, index) => {
            const monthContainer = this.createMonthContainer();
            this.updateMonthContainer(monthContainer, date);
            monthContainer.style.order = index;
            monthsContainer.appendChild(monthContainer);

            // Add click event listeners to date cells
            monthContainer.querySelectorAll('.calendar-date').forEach(dateCell => {
                dateCell.addEventListener('click', (event) => {
                    this.selectDate(event.target);
                });
            });
        });

        // Scroll to the current month
        setTimeout(() => {
            const currentMonthIndex = this.mobileMonths.findIndex(date => date.getMonth() === this.currentMonth.getMonth() && date.getFullYear() === this.currentMonth.getFullYear());
            const currentMonth = monthsContainer.children[currentMonthIndex];
            currentMonth.scrollIntoView({ behavior: 'auto', block: 'center' });
        }, 0);
    }

    handleMobileScroll(event) {
        if (!this.enableScrollLoading) return;

        const container = event.target;
        const scrollPosition = container.scrollTop;
        const containerHeight = container.clientHeight;
        const scrollHeight = container.scrollHeight;

        if (scrollPosition < containerHeight * 0.2) {
            this.loadMoreMonths('top');
        } else if (scrollPosition + containerHeight > scrollHeight - containerHeight * 0.2) {
            this.loadMoreMonths('bottom');
        }
    }

    loadMoreMonths(position) {
        const monthToAdd = 1; // Number of months to add each time

        if (position === 'top') {
            const firstMonth = this.mobileMonths[0];
            const newDate = new Date(firstMonth.getFullYear(), firstMonth.getMonth() - monthToAdd, 1);
            this.mobileMonths.unshift(newDate);
        } else {
            const lastMonth = this.mobileMonths[this.mobileMonths.length - 1];
            const newDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + monthToAdd, 1);
            this.mobileMonths.push(newDate);
        }

        this.renderMobileMonths();

        // Adjust scroll position to prevent jumping
        setTimeout(() => {
            const monthsContainer = document.querySelector(`#${this.calendarId} .mobile-months-container`);
            if (position === 'top') {
                monthsContainer.scrollTop += monthsContainer.children[0].offsetHeight;
            }
        }, 0);
    }

    updateSelectedDateDisplay() {
        const displayElement = document.querySelector(`#${this.calendarId} .selected-date-display`);
        if (this.options.singleDateSelector) {
            displayElement.textContent = this.selectedDates ? this.formatDate(this.selectedDates) : 'No date selected';
        } else if (this.options.rangeDateSelectors) {
            if (this.selectedDates.length === 0) {
                displayElement.textContent = 'No dates selected';
            } else if (this.selectedDates.length === 1) {
                displayElement.textContent = `Start: ${this.formatDate(this.selectedDates[0])}`;
            } else {
                displayElement.textContent = `Start: ${this.formatDate(this.selectedDates[0])} - End: ${this.formatDate(this.selectedDates[1])}`;
            }
        }
    }

    confirmSelection() {
        if (this.options.singleDateSelector) {
            const singleDateInput = document.querySelector(this.options.singleDateSelector);
            singleDateInput.value = this.selectedDates ? this.formatDate(this.selectedDates) : '';
        } else if (this.options.rangeDateSelectors) {
            const [startDateInput, endDateInput] = this.options.rangeDateSelectors.map(selector => document.querySelector(selector));
            if (this.selectedDates.length > 0) {
                startDateInput.value = this.formatDate(this.selectedDates[0]);
                endDateInput.value = this.selectedDates[1] ? this.formatDate(this.selectedDates[1]) : '';
            }
        }
        document.getElementById(this.calendarId).style.display = 'none';
    }
}

// Export the Calendar class
export default Calendar;