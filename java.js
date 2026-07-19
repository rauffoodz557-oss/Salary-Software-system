let currentViewMonth = '';
﻿// اسٹرکچرڈ ڈیٹا اسٹوریج کے لیے ایک سادہ اری (اب اسے Local Storage سے لوڈ اور سیو کیا جائے گا)
let employees = [];
let savedRecords = {}; // ماہانہ ریکارڈز کو محفوظ کرنے کے لیے

// Employee کلاس
class Employee {
    constructor(empId, name, salaryPerMonth, gender, workingDays, previousDue = 0, overtimeHours = 0, advanceTaken = 0, papadDeduction = 0, isMonthSalaryFinalized = false) {
        this.empId = empId;
        this.name = name;
        this.salaryPerMonth = salaryPerMonth;
        this.gender = gender;
        this.workingDays = workingDays;
        this.previousDue = previousDue;
        this.overtimeHours = overtimeHours;
        this.advanceTaken = advanceTaken; 
        this.papadDeduction = papadDeduction;
        this.isMonthSalaryFinalized = isMonthSalaryFinalized; // نئی پراپرٹی: کیا اس مہینے کی تنخواہ مکمل ہو گئی ہے؟
    }

    // اوور ٹائم کی رقم کیلکولیٹ کریں (8 گھنٹے فی دن کے حساب سے)
    calculateOvertimePay() {
        // Assume 30 days in a month for daily salary calculation
        const dailySalary = this.salaryPerMonth / 30; 
        // Assume 8 hours working day for hourly salary calculation
        const hourlySalary = dailySalary / 8; 
        return this.overtimeHours * hourlySalary;
    }

    // مجموعی تنخواہ (بغیر کٹوتیوں کے)
    calculateGrossSalary() {
        const dailySalary = this.salaryPerMonth / 30;
        const salaryForWorkingDays = dailySalary * this.workingDays;
        return salaryForWorkingDays + this.calculateOvertimePay();
    }

    // کل کٹوتیاں کیلکولیٹ کریں
    calculateTotalDeductions() {
        return this.previousDue + this.advanceTaken + this.papadDeduction;
    }

    // موجودہ (نیٹ) تنخواہ اور بنام رقم کیلکولیٹ کریں
    calculateFinalAmounts() {
        const grossSalary = this.calculateGrossSalary();
        const totalDeductions = this.calculateTotalDeductions();
        
        let netSalary = 0;
        let dueAmount = 0; // بنام رقم

        if (grossSalary > totalDeductions) {
            netSalary = grossSalary - totalDeductions;
        } else {
            dueAmount = totalDeductions - grossSalary;
            netSalary = 0; // جب بنام ہو تو موجودہ تنخواہ صفر ہو گی
        }

        return { netSalary, dueAmount, grossSalary, totalDeductions };
    }
}

// Local Storage سے ڈیٹا لوڈ کریں
function loadDataFromLocalStorage() {
    const storedEmployees = localStorage.getItem('currentEmployeesData');
    if (storedEmployees) {
        employees = JSON.parse(storedEmployees).map(empData => new Employee(
            empData.empId, empData.name, empData.salaryPerMonth, empData.gender,
            empData.workingDays, empData.previousDue, empData.overtimeHours,
            empData.advanceTaken, empData.papadDeduction, empData.isMonthSalaryFinalized // isMonthSalaryFinalized کو لوڈ کریں
        ));
        console.log('Data loaded from localStorage (currentEmployeesData):', employees); // Debug log
    } else {
        employees = []; // اگر کچھ بھی نہیں ملا تو اری کو خالی کر دیں
    }

    const storedRecords = localStorage.getItem('savedSalaryRecords');
    if (storedRecords) {
        savedRecords = JSON.parse(storedRecords);
        for (const monthYear in savedRecords) {
            savedRecords[monthYear] = savedRecords[monthYear].map(empData => new Employee(
                empData.empId, empData.name, empData.salaryPerMonth, empData.gender,
                empData.workingDays, empData.previousDue, empData.overtimeHours,
                empData.advanceTaken, empData.papadDeduction, empData.isMonthSalaryFinalized // isMonthSalaryFinalized کو لوڈ کریں
            ));
        }
        console.log('Data loaded from localStorage (savedSalaryRecords):', savedRecords); // Debug log
    } else {
        savedRecords = {}; // اگر کچھ بھی نہیں ملا تو آبجیکٹ کو خالی کر دیں
    }
}

// Local Storage میں ڈیٹا سیو کریں
function saveDataToLocalStorage() {
    localStorage.setItem('currentEmployeesData', JSON.stringify(employees));
    localStorage.setItem('savedSalaryRecords', JSON.stringify(savedRecords));
    console.log('Data saved to localStorage. Current employees:', employees); // Debug log
    console.log('Saved records:', savedRecords); // Debug log
}

// تاریخ کا سلیکٹر
const monthYearInput = document.getElementById('current-month-year');

// تاریخ کو آج کے مہینے پر سیٹ کریں
function setCurrentMonthYear() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const formattedDate = `${year}-${month}`;
    if (monthYearInput) {
        monthYearInput.value = formattedDate;
    }
    console.log('Current month/year set to:', formattedDate); // Debug log
}

// نیا ملازم ID خودکار طریقے سے جنریٹ کرنے کا فنکشن
function generateNewEmployeeId() {
    let maxId = 0;
    if (employees.length > 0) {
        maxId = Math.max(...employees.map(emp => emp.empId));
    }
    // Set the value directly to the input field
    document.getElementById('emp-id').value = maxId + 1;
    document.getElementById('emp-id').readOnly = true; // اسے صرف پڑھنے کے قابل بناتے ہیں تاکہ صارف تبدیل نہ کر سکے
    console.log('Generated new employee ID:', maxId + 1); // Debug log
}

// سیکشنز اور بٹنوں کو دکھانے/چھپانے کا فنکشن
function showSection(sectionId) {
    console.log(`showSection called with: ${sectionId}`); // Debug log
    // Hide all sections first
    document.querySelectorAll('.attendance-section').forEach(section => {
        section.classList.remove('active');
    });
    // Activate the target section
    document.getElementById(sectionId).classList.add('active');

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });
    // Add active class to the clicked nav button, excluding the logout button
    const clickedNavButton = document.querySelector(`.nav-button[onclick="showSection('${sectionId}')"]`);
    if (clickedNavButton) {
        clickedNavButton.classList.add('active');
    }

    // ہینڈل کریں کہ کون سے بٹن دکھائے جائیں
    // پہلے تمام امپورٹ/ایکسپورٹ/پرنٹ بٹن چھپا دیں
    document.querySelectorAll('.export-btn, .print-btn, .import-btn').forEach(button => {
        button.style.display = 'none';
    });

    if (sectionId === 'male-section') {
        document.querySelectorAll('.male-btn').forEach(button => {
            button.style.display = 'inline-block';
        });
        document.getElementById('import-male-btn').style.display = 'inline-block';
        renderEmployees('male');
    } else if (sectionId === 'female-section') {
        document.querySelectorAll('.female-btn').forEach(button => {
            button.style.display = 'inline-block';
        });
        document.getElementById('import-female-btn').style.display = 'inline-block';
        renderEmployees('female');
    } else if (sectionId === 'add-employee-section' || sectionId === 'saved-records-section') {
        // Add Employee اور Saved Records سیکشنز میں دونوں امپورٹ بٹن دکھا سکتے ہیں
        document.getElementById('import-male-btn').style.display = 'inline-block';
        document.getElementById('import-female-btn').style.display = 'inline-block';
        if (sectionId === 'add-employee-section') {
            generateNewEmployeeId(); // Call auto-ID generation for add employee section
        } else { // saved-records-section
            renderSavedRecordsList();
        }
    }
    
    // Save the last active section
    localStorage.setItem('lastActiveSection', sectionId);
}

// ملازمین کے ڈیٹا کو ٹیبل میں دکھانے کا فنکشن
function renderEmployees(gender) {
    const table = document.getElementById(`${gender}-attendance-table`);
    const tableHead = table.querySelector('thead tr');
    const tableBody = table.getElementsByTagName('tbody')[0];
    const tableFoot = table.querySelector('tfoot tr');
    
    tableBody.innerHTML = ''; // Clear existing rows

    const filteredEmployees = employees.filter(emp => emp.gender === gender);
    console.log(`Rendering for gender: ${gender}. Filtered employees for display:`, filteredEmployees); // Debug log
    
    // Ensure 'بنام رقم' header is present (it should be in HTML, but this ensures robustness)
    let dueAmountHeaderExists = Array.from(tableHead.cells).some(th => th.innerText.trim() === 'بنام رقم');
    if (!dueAmountHeaderExists) {
        const netSalaryHeaderIndex = Array.from(tableHead.cells).findIndex(th => th.innerText.trim() === 'موجودہ تنخواہ');
        if (netSalaryHeaderIndex !== -1) {
            const newHeader = document.createElement('th');
            newHeader.innerText = 'بنام رقم';
            tableHead.insertBefore(newHeader, tableHead.cells[netSalaryHeaderIndex + 1]);
        }
    }

    // مجموعہ کے لیے ویری ایبلز
    let totalOvertimePaySum = 0;
    let totalGrossSalarySum = 0;
    let totalPreviousDueSum = 0;;
    let totalAdvanceSum = 0;
    let totalPapadSum = 0;
    let totalDeductionsSum = 0;
    let totalNetSalarySum = 0;
    let totalDueAmountSum = 0; 

    filteredEmployees.forEach(emp => {
        const row = tableBody.insertRow();
        const { netSalary, dueAmount, grossSalary, totalDeductions } = emp.calculateFinalAmounts();
        const overtimePay = emp.calculateOvertimePay();

        totalOvertimePaySum += overtimePay;
        totalGrossSalarySum += grossSalary;
        totalPreviousDueSum += emp.previousDue;
        totalAdvanceSum += emp.advanceTaken;
        totalPapadSum += emp.papadDeduction;
        totalDeductionsSum += totalDeductions;
        totalNetSalarySum += netSalary;
        totalDueAmountSum += dueAmount; 

        // Populate cells based on their logical order, matching the HTML table header
        // شمار, نام, کام کے دن, تنخواہ, اوور ٹائم, کل تنخواہ (اوور ٹائم کے ساتھ), سابقہ بنام, ایڈوانس, پاپڑ, کل کٹوتی, موجودہ تنخواہ, بنام رقم, ایکشنز
        row.insertCell(0).innerText = emp.empId; // شمار
        row.insertCell(1).innerText = emp.name.toUpperCase(); // نام کو بڑے حروف میں دکھائیں
        row.insertCell(2).innerText = emp.workingDays.toFixed(2); // کام کے دن - Changed: Added toFixed(2) for display
        row.insertCell(3).innerText = emp.salaryPerMonth.toFixed(2); // تنخواہ
        row.insertCell(4).innerText = overtimePay.toFixed(2); // اوور ٹائم
        row.insertCell(5).innerText = grossSalary.toFixed(2); // کل تنخواہ (اوور ٹائم کے ساتھ)
        row.insertCell(6).innerText = emp.previousDue.toFixed(2); // سابقہ بنام
        row.insertCell(7).innerText = emp.advanceTaken.toFixed(2); // ایڈوانس
        row.insertCell(8).innerText = emp.papadDeduction.toFixed(2); // پاپڑ
        row.insertCell(9).innerText = totalDeductions.toFixed(2); // کل کٹوتی
        row.insertCell(10).innerText = netSalary.toFixed(2); // موجودہ تنخواہ
        row.insertCell(11).innerText = dueAmount.toFixed(2); // بنام رقم

        const actionsCell = row.insertCell(12); // ایکشنز
        actionsCell.classList.add('no-print'); 
        
        const editButton = document.createElement('button');
        editButton.innerText = 'ایڈٹ کریں';
        editButton.classList.add('edit-button');
        editButton.onclick = () => openEditModal(emp.empId);
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'ڈیلیٹ کریں';
        deleteButton.classList.add('delete-button');
        deleteButton.onclick = () => deleteEmployee(emp.empId, emp.name, emp.gender); // Pass gender to re-render correct table
        actionsCell.appendChild(deleteButton);

        // اگر تنخواہ مکمل ہو چکی ہے تو ٹک مارک شامل کریں
        if (emp.isMonthSalaryFinalized) {
            const tickSpan = document.createElement('span');
            tickSpan.innerHTML = ' &#10003;'; // چیک مارک کا نشان (✓)
            tickSpan.style.color = 'green';
            tickSpan.style.fontWeight = 'bold';
            tickSpan.style.fontSize = '1.2em';
            tickSpan.style.marginLeft = '5px'; // LTR کے لیے
            actionsCell.appendChild(tickSpan);
        }
    });

    // Update Footer Totals
    const footCells = Array.from(tableFoot.cells);
    const headerTexts = Array.from(tableHead.querySelectorAll('th:not(.no-print)')).map(th => th.innerText.trim());

    document.getElementById(`${gender}-total-overtime-sum`).innerText = totalOvertimePaySum.toFixed(2);
    document.getElementById(`${gender}-total-gross-salary-sum`).innerText = totalGrossSalarySum.toFixed(2);
    document.getElementById(`${gender}-total-previous-due-sum`).innerText = totalPreviousDueSum.toFixed(2);
    document.getElementById(`${gender}-total-advance-sum`).innerText = totalAdvanceSum.toFixed(2);
    document.getElementById(`${gender}-total-papad-sum`).innerText = totalPapadSum.toFixed(2);
    document.getElementById(`${gender}-total-deductions-sum-footer`).innerText = totalDeductionsSum.toFixed(2);
    document.getElementById(`${gender}-total-net-salary-sum`).innerText = totalNetSalarySum.toFixed(2);
    
    // Find the cell for 'بنام رقم' total in the footer (which is the last data-related sum cell)
    const dueAmountFooterCellIndex = footCells.length - 2; // Assuming 'بنام رقم' is second to last before the empty action cell
    if (footCells[dueAmountFooterCellIndex]) {
        footCells[dueAmountFooterCellIndex].innerText = totalDueAmountSum.toFixed(2);
    } else {
        console.warn(`Error: Footer cell for 'بنام رقم' not found at expected index ${dueAmountFooterCellIndex}.`);
    }

    const firstFooterTh = tableFoot.querySelector('th:first-child');
    if (firstFooterTh) {
        // Calculate colspan dynamically based on visible headers before the first sum (اوور ٹائم)
        const countBeforeFirstSum = headerTexts.indexOf('اوور ٹائم'); // Index of 'اوور ٹائم'
        if (countBeforeFirstSum !== -1) {
            firstFooterTh.setAttribute('colspan', countBeforeFirstSum);
        } else {
            firstFooterTh.setAttribute('colspan', 4); // Default fallback if not found, based on user's HTML
        }
    }
}


// نیا ملازم شامل کرنے کا فارم ہینڈل کریں
document.getElementById('add-employee-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // emp-id value is already set by generateNewEmployeeId() and is readOnly
    const empId = parseInt(document.getElementById('emp-id').value);
    const empName = document.getElementById('emp-name').value;
    const empSalary = parseFloat(document.getElementById('emp-salary').value);
    const empGender = document.getElementById('emp-gender').value;
    const empWorkingDays = parseFloat(document.getElementById('emp-working-days').value); 
    const empPreviousDue = parseFloat(document.getElementById('emp-previous-due').value || 0);
    const empOvertime = parseFloat(document.getElementById('emp-overtime').value || 0);    
    const empAdvance = parseFloat(document.getElementById('emp-advance').value || 0);      
    const empPapad = parseFloat(document.getElementById('emp-papad').value || 0);          

    const idExists = employees.some(emp => emp.empId === empId);
    if (idExists) {
        alert("یہ ملازم ID پہلے سے موجود ہے۔ براہ کرم ایک منفرد ID درج کریں۔");
        return;
    }

    // نئے ملازم کو شامل کرتے وقت isMonthSalaryFinalized کو false پر سیٹ کریں
    const newEmployee = new Employee(empId, empName, empSalary, empGender, empWorkingDays, empPreviousDue, empOvertime, empAdvance, empPapad, false); 
    employees.push(newEmployee);
    saveDataToLocalStorage(); 

    console.log('New employee added:', newEmployee); // Debug log: Check gender here
    console.log('Current employees array after adding:', employees); // Debug log: Check full array content
    alert(`${newEmployee.name} کو کامیابی سے شامل کر دیا گیا ہے!`);
    this.reset();
    generateNewEmployeeId(); // Generate a new ID for the next entry

    if (empGender === 'male') {
        showSection('male-section'); // Switch to male section and render
    } else {
        showSection('female-section'); // Switch to female section and render
    }
});

// Edit Modal Functions
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-employee-form');

function openEditModal(empId) {
    const employee = employees.find(emp => emp.empId === empId);
    if (employee) {
        document.getElementById('edit-emp-id').value = employee.empId;
        document.getElementById('edit-emp-name').value = employee.name; 
        document.getElementById('edit-working-days').value = employee.workingDays;
        document.getElementById('edit-salary').value = employee.salaryPerMonth;
        document.getElementById('edit-overtime').value = employee.overtimeHours;
        document.getElementById('edit-previous-due').value = employee.previousDue;
        document.getElementById('edit-advance').value = employee.advanceTaken;
        document.getElementById('edit-papad').value = employee.papadDeduction;
        editModal.style.display = 'block';
    }
}

function closeEditModal() {
    editModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == editModal) {
        closeEditModal();
    }
}

editForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const empIdToUpdate = parseInt(document.getElementById('edit-emp-id').value);
    const updatedName = document.getElementById('edit-emp-name').value; // Get updated name
    const updatedWorkingDays = parseFloat(document.getElementById('edit-working-days').value); 
    const updatedSalary = parseFloat(document.getElementById('edit-salary').value);
    const updatedOvertime = parseFloat(document.getElementById('edit-overtime').value);
    const updatedPreviousDue = parseFloat(document.getElementById('edit-previous-due').value);
    const updatedAdvance = parseFloat(document.getElementById('edit-advance').value);
    const updatedPapad = parseFloat(document.getElementById('edit-papad').value);

    const employeeIndex = employees.findIndex(emp => emp.empId === empIdToUpdate);

    if (employeeIndex !== -1) {
        employees[employeeIndex].name = updatedName; // Update employee name
        employees[employeeIndex].workingDays = updatedWorkingDays;
        employees[employeeIndex].salaryPerMonth = updatedSalary;
        employees[employeeIndex].overtimeHours = updatedOvertime;
        employees[employeeIndex].previousDue = updatedPreviousDue;
        employees[employeeIndex].advanceTaken = updatedAdvance;
        employees[employeeIndex].papadDeduction = updatedPapad;
        employees[employeeIndex].isMonthSalaryFinalized = true; // جب ایڈٹ ہو تو مکمل نشان لگائیں

        saveDataToLocalStorage(); 
        alert(`${employees[employeeIndex].name} کی معلومات کامیابی سے اپ ڈیٹ ہو گئی ہیں۔`);
        closeEditModal();

        renderEmployees(employees[employeeIndex].gender);
    } else {
        alert("ملازم نہیں ملا۔");
    }
});

// --- Delete Employee Function ---
function deleteEmployee(empId, empName, empGender) {
    if (confirm(`کیا آپ واقعی ${empName} (ID: ${empId}) کو ڈیلیٹ کرنا چاہتے ہیں؟ یہ کارروائی واپس نہیں لی جا سکتی۔`)) {
        employees = employees.filter(emp => emp.empId !== empId);
        saveDataToLocalStorage();
        alert(`${empName} کو کامیابی سے ڈیلیٹ کر دیا گیا ہے۔`);
        renderEmployees(empGender); // Re-render the correct gender table
    }
}

// --- Export and Print Functions ---
// یہ فنکشن اب موجودہ فعال سیکشن کے مطابق ڈیٹا فلٹر کرے گا
function getTableDataForExport(tableId) {
    const table = document.getElementById(tableId);
    let data = [];
    const headers = [];
    // Get headers (excluding 'ایکشنز' which has 'no-print' class)
    table.querySelectorAll('thead th:not(.no-print)').forEach(th => {
        headers.push(th.innerText.trim());
    });
    // Ensure "بنام رقم" is in headers if it's supposed to be
    if (!headers.includes('بنام رقم')) {
        const netSalaryHeaderIndex = headers.indexOf('موجودہ تنخواہ');
        if (netSalaryHeaderIndex !== -1) {
            const newHeader = document.createElement('th');
            newHeader.innerText = 'بنام رقم';
            tableHead.insertBefore(newHeader, tableHead.cells[netSalaryHeaderIndex + 1]);
        }
    }
    // 'جنس' کو ہیڈر میں شامل کریں تاکہ CSV امپورٹ کے لیے مکمل ڈیٹا موجود ہو
    if (!headers.includes('جنس')) {
        const nameIndex = headers.indexOf('نام');
        if (nameIndex !== -1) {
            headers.splice(nameIndex + 1, 0, 'جنس');
        } else {
            headers.push('جنس');
        }
    }
    // 'isMonthSalaryFinalized' کو ہیڈر میں شامل کریں تاکہ ایکسپورٹ/امپورٹ میں یہ اسٹیٹس بھی شامل ہو
    if (!headers.includes('مکمل شدہ')) {
        headers.push('مکمل شدہ');
    }
    data.push(headers); // Determine gender based on tableId passed to this function
    let genderToFilter = '';
    if (tableId === 'male-attendance-table') {
        genderToFilter = 'male';
    } else if (tableId === 'female-attendance-table') {
        genderToFilter = 'female';
    }
    console.log(`getTableDataForExport: Exporting data for tableId=${tableId}, determined gender=${genderToFilter}`); // Debug log
    console.log('getTableDataForExport: Current employees array BEFORE filtering for export:', employees); // Debug log: Check full array
    const filteredEmployees = employees.filter(emp => emp.gender === genderToFilter);
    console.log(`getTableDataForExport: Filtered employees for export (${genderToFilter}):`, filteredEmployees); // Debug log
    // Create a map from header name to its index in the `headers` array
    const headerMap = {};
    headers.forEach((header, index) => {
        headerMap[header] = index;
    });
    filteredEmployees.forEach(emp => {
        const rowData = new Array(headers.length).fill(''); // Initialize with empty strings
        const { netSalary, dueAmount, grossSalary, totalDeductions } = emp.calculateFinalAmounts();
        // Populate rowData based on the headerMap and current table structure
        if (headerMap['شمار'] !== undefined) rowData[headerMap['شمار']] = emp.empId;
        if (headerMap['نام'] !== undefined) rowData[headerMap['نام']] = emp.name;
        if (headerMap['جنس'] !== undefined) rowData[headerMap['جنس']] = emp.gender; // جنس شامل کریں
        if (headerMap['کام کے دن'] !== undefined) rowData[headerMap['کام کے دن']] = emp.workingDays.toFixed(2);
        if (headerMap['تنخواہ'] !== undefined) rowData[headerMap['تنخواہ']] = emp.salaryPerMonth.toFixed(2);
        if (headerMap['اوور ٹائم'] !== undefined) rowData[headerMap['اوور ٹائم']] = emp.overtimeHours.toFixed(2); // Export actual overtime hours
        if (headerMap['کل تنخواہ (اوور ٹائم کے ساتھ)'] !== undefined) rowData[headerMap['کل تنخواہ (اوور ٹائم کے ساتھ)']] = grossSalary.toFixed(2);
        if (headerMap['سابقہ بنام'] !== undefined) rowData[headerMap['سابقہ بنام']] = emp.previousDue.toFixed(2);
        if (headerMap['ایڈوانس'] !== undefined) rowData[headerMap['ایڈوانس']] = emp.advanceTaken.toFixed(2);
        if (headerMap['پاپڑ'] !== undefined) rowData[headerMap['پاپڑ']] = emp.papadDeduction.toFixed(2);
        if (headerMap['کل کٹوتی'] !== undefined) rowData[headerMap['کل کٹوتی']] = totalDeductions.toFixed(2);
        if (headerMap['موجودہ تنخواہ'] !== undefined) rowData[headerMap['موجودہ تنخواہ']] = netSalary.toFixed(2);
        if (headerMap['بنام رقم'] !== undefined) rowData[headerMap['بنام رقم']] = dueAmount.toFixed(2);
        if (headerMap['مکمل شدہ'] !== undefined) rowData[headerMap['مکمل شدہ']] = emp.isMonthSalaryFinalized ? 'Yes' : 'No';

        data.push(rowData);
    });

    return data;
}

// یہ فنکشن اب موجودہ فعال سیکشن کے مطابق ڈیٹا ایکسپورٹ کرے گا
function exportTable(tableId, format) {
    const data = getTableDataForExport(tableId);

    if (data.length <= 1) { // Only headers are present
        alert('کوئی ڈیٹا ایکسپورٹ کرنے کے لیے موجود نہیں ہے۔');
        return;
    }

    let fileContent;
    let fileExtension;
    let mimeType;
    let filename;
    
    // Determine the gender for the filename
    let gender = '';
    if (tableId === 'male-attendance-table') {
        gender = 'مرد';
    } else if (tableId === 'female-attendance-table') {
        gender = 'خواتین';
    }

    const monthYear = document.getElementById('current-month-year').value || 'Unknown';
    const cleanMonthYear = monthYear.replace('-', '_');

    if (format === 'excel') {
        // Create CSV content for Excel
        fileContent = data.map(row => row.join(',')).join('\n');
        fileExtension = 'csv';
        // Add a Byte Order Mark (BOM) to the file content
        fileContent = '\ufeff' + fileContent; 
        mimeType = 'text/csv;charset=utf-8;';
        filename = `${gender}_Salary_Record_${cleanMonthYear}.csv`;
    } else if (format === 'text') {
        // Create tab-separated text content
        fileContent = data.map(row => row.join('\t')).join('\n');
        fileExtension = 'txt';
        mimeType = 'text/plain;charset=utf-8;';
        filename = `${gender}_Salary_Record_${cleanMonthYear}.txt`;
    } else if (format === 'word') {
        // Create a simple HTML table string for Word (DOC)
        let htmlTable = '<html><head><meta charset="utf-8"></head><body>';
        htmlTable += `<h1>${gender} ملازمین کی تنخواہ کا ریکارڈ - ${monthYear}</h1>`;
        htmlTable += '<table border="1" style="border-collapse: collapse;">';
        
        // Add headers
        htmlTable += '<thead><tr>';
        data[0].forEach(header => {
            htmlTable += `<th style="padding: 8px;">${header}</th>`;
        });
        htmlTable += '</tr></thead><tbody>';

        // Add rows
        for (let i = 1; i < data.length; i++) {
            htmlTable += '<tr>';
            data[i].forEach(cell => {
                htmlTable += `<td style="padding: 8px;">${cell}</td>`;
            });
            htmlTable += '</tr>';
        }

        htmlTable += '</tbody></table></body></html>';
        fileContent = htmlTable;
        fileExtension = 'doc';
        mimeType = 'application/msword';
        filename = `${gender}_Salary_Record_${cleanMonthYear}.doc`;
    } else {
        alert('غلط فائل فارمیٹ۔');
        return;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// --- Import Function ---
function handleImportFile(event, gender) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        try {
            const importedData = parseCsvData(text, gender);
            if (importedData.length > 0) {
                // Remove existing employees of the same gender before import
                employees = employees.filter(emp => emp.gender !== gender);
                employees.push(...importedData);
                saveDataToLocalStorage();
                alert(`تمام ${gender === 'male' ? 'مرد' : 'خواتین'} ملازمین کا ڈیٹا کامیابی سے اپ ڈیٹ ہو گیا ہے۔`);
                renderEmployees(gender);
            } else {
                alert("امپورٹ کرنے کے لیے کوئی ڈیٹا نہیں ملا یا فارمیٹ غلط ہے۔");
            }
        } catch (error) {
            console.error("CSV parsing error:", error);
            alert("فائل پڑھنے میں مسئلہ ہے۔ براہ کرم یقینی بنائیں کہ یہ ایک درست CSV فائل ہے۔");
        }
    };
    reader.readAsText(file);
}

// CSV ڈیٹا کو پارس کرنے کا فنکشن (بہتر ورژن)
function parseCsvData(text, gender) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const dataLines = lines.slice(1);
    const importedEmployees = [];

    dataLines.forEach(line => {
        const values = line.split(',').map(v => v.trim());
        const empData = {};
        headers.forEach((header, index) => {
            empData[header] = values[index];
        });

        // Ensure all required fields exist
        if (
            empData['شمار'] !== undefined &&
            empData['نام'] !== undefined &&
            empData['تنخواہ'] !== undefined &&
            empData['جنس'] !== undefined
        ) {
            const newEmployee = new Employee(
                parseInt(empData['شمار']),
                empData['نام'],
                parseFloat(empData['تنخواہ']),
                empData['جنس'],
                parseFloat(empData['کام کے دن'] || 0),
                parseFloat(empData['سابقہ بنام'] || 0),
                parseFloat(empData['اوور ٹائم'] || 0),
                parseFloat(empData['ایڈوانس'] || 0),
                parseFloat(empData['پاپڑ کی کٹوتی'] || 0),
                empData['مکمل شدہ'] === 'Yes' // اسٹیٹس کو درست طریقے سے سیٹ کریں
            );
            // Only import employees of the specified gender
            if (newEmployee.gender === gender) {
                importedEmployees.push(newEmployee);
            }
        }
    });

    return importedEmployees;
}


// پرنٹ فنکشن
function printTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Clone the table and remove the 'Actions' column
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Table</title>');

    // Apply basic table styling for printing
    printWindow.document.write(`
        <style>
            body { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            .no-print { display: none; }
        </style>
    `);
    
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>تنخواہ کا ریکارڈ</h1>');
    printWindow.document.write(table.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// نئے ریکارڈ کو محفوظ کرنے کا فنکشن
function saveCurrentMonthData() {
    const monthYear = document.getElementById('current-month-year').value;
    if (!monthYear) {
        alert("براہ کرم مہینہ اور سال منتخب کریں۔");
        return;
    }

    // Check if the current month's data has been updated and is valid
    // This is a simple check, could be more robust
    const maleEmployees = employees.filter(emp => emp.gender === 'male');
    const femaleEmployees = employees.filter(emp => emp.gender === 'female');
    
    // Check if at least one employee of each gender has their salary finalized. This is an assumption.
    const allMaleFinalized = maleEmployees.every(emp => emp.isMonthSalaryFinalized);
    const allFemaleFinalized = femaleEmployees.every(emp => emp.isMonthSalaryFinalized);

    if (!allMaleFinalized || !allFemaleFinalized) {
        if (!confirm("کیا آپ واقعی تنخواہوں کو حتمی شکل دیے بغیر محفوظ کرنا چاہتے ہیں؟")) {
            return;
        }
    }
    
    // Deep clone the employees array to save a snapshot
    savedRecords[monthYear] = JSON.parse(JSON.stringify(employees));
    saveDataToLocalStorage();
    alert(`موجودہ مہینے (${monthYear}) کا ڈیٹا کامیابی سے محفوظ ہو گیا ہے۔`);
    renderSavedRecordsList(); // Update the saved records list
}

// محفوظ شدہ ریکارڈز کو دکھانے کا فنکشن
function renderSavedRecordsList() {
    const list = document.getElementById('saved-records-list');
    if (!list) return;
    list.innerHTML = '';
    const sortedMonths = Object.keys(savedRecords).sort().reverse();
    sortedMonths.forEach(monthYear => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${monthYear}</span>`;

        const viewButton = document.createElement('button');
        viewButton.innerText = 'دیکھیں';
        viewButton.onclick = () => viewSavedRecord(monthYear);
        li.appendChild(viewButton);

        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'ڈیلیٹ کریں';
        deleteButton.onclick = () => deleteSavedRecord(monthYear);
        li.appendChild(deleteButton);

        list.appendChild(li);
    });
}

// محفوظ شدہ ریکارڈ دیکھنے کا فنکشن
function viewSavedRecord(monthYear) {
    if (!savedRecords[monthYear]) {
        alert('یہ ریکارڈ نہیں ملا۔');
        return;
    }
    
    // Switch to a new view or a modal to display the data
    const recordModal = document.getElementById('record-modal');
    const recordContent = document.getElementById('record-content');
    currentViewMonth = monthYear;
    recordContent.innerHTML = `<h3>${monthYear} کا محفوظ شدہ ریکارڈ</h3>`;

    // Create a new table to display the saved data
    const tableHtml = `
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th>شمار</th>
                    <th>نام</th>
                    <th>کام کے دن</th>
                    <th>تنخواہ</th>
                    <th>اوور ٹائم</th>
                    <th>کل تنخواہ</th>
                    <th>سابقہ بنام</th>
                    <th>ایڈوانس</th>
                    <th>پاپڑ</th>
                    <th>کل کٹوتی</th>
                    <th>موجودہ تنخواہ</th>
                    <th>بنام رقم</th>
                </tr>
            </thead>
            <tbody>
                ${savedRecords[monthYear].map(emp => {
                    const { netSalary, dueAmount, grossSalary, totalDeductions } = emp.calculateFinalAmounts();
                    const overtimePay = emp.calculateOvertimePay();
                    return `
                        <tr>
                            <td>${emp.empId}</td>
                            <td>${emp.name}</td>
                            <td>${emp.workingDays.toFixed(2)}</td>
                            <td>${emp.salaryPerMonth.toFixed(2)}</td>
                            <td>${overtimePay.toFixed(2)}</td>
                            <td>${grossSalary.toFixed(2)}</td>
                            <td>${emp.previousDue.toFixed(2)}</td>
                            <td>${emp.advanceTaken.toFixed(2)}</td>
                            <td>${emp.papadDeduction.toFixed(2)}</td>
                            <td>${totalDeductions.toFixed(2)}</td>
                            <td>${netSalary.toFixed(2)}</td>
                            <td>${dueAmount.toFixed(2)}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    recordContent.innerHTML += tableHtml;
    recordModal.style.display = 'block';
}

function closeRecordModal() {
    const recordModal = document.getElementById('record-modal');
    recordModal.style.display = 'none';
}

function deleteSavedRecord(monthYear) {
    if (confirm(`کیا آپ واقعی ${monthYear} کے ریکارڈ کو ڈیلیٹ کرنا چاہتے ہیں؟ یہ کارروائی واپس نہیں لی جا سکتی۔`)) {
        delete savedRecords[monthYear];
        saveDataToLocalStorage();
        alert(`ماہ ${monthYear} کا ریکارڈ کامیابی سے ڈیلیٹ کر دیا گیا ہے۔`);
        renderSavedRecordsList();
    }
}


// تاریخ سلیکٹ کرنے پر ٹک مارک ہٹانے کا نیا فنکشن
function resetFinalizedStatus() {
    employees.forEach(emp => {
        emp.isMonthSalaryFinalized = false;
    });
    saveDataToLocalStorage();
    console.log('Finalized status reset for all employees due to month change.');
    renderEmployees('male');
    renderEmployees('female');
}

// monthYearInput پر change ایونٹ شامل کریں
if (monthYearInput) {
    monthYearInput.addEventListener('change', resetFinalizedStatus);
}


// لاگ ان فنکشن
function login() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('login-error-message');

    // Simple hardcoded login for demonstration
    if (usernameInput.value === 'Nasir' && passwordInput.value === '321') {
        document.getElementById('login-modal').style.display = 'none';
        document.querySelector('.nav-bar').style.display = 'flex';
        document.querySelector('.header').style.display = 'block';
        document.querySelector('.controls').style.display = 'flex';
        document.getElementById('male-section').classList.add('active'); // show the initial section
        
        // Restore the last active section if it exists
        const lastSection = localStorage.getItem('lastActiveSection');
        if (lastSection) {
            showSection(lastSection);
        } else {
            showSection('male-section');
        }

    } else {
        errorMessage.innerText = 'غلط یوزر نیم یا پاس ورڈ۔';
        usernameInput.value = ''; // Clear fields on incorrect attempt
        passwordInput.value = '';
        usernameInput.focus(); // Focus on username for next attempt
    }
}


// لاگ آؤٹ فنکشن
function logout() {
    // Hide all main content
    document.querySelector('.nav-bar').style.display = 'none';
    document.querySelector('.header').style.display = 'none';
    document.querySelector('.controls').style.display = 'none';
    document.querySelectorAll('.attendance-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show login modal
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('login-error-message').innerText = '';
    document.getElementById('username').focus();
    
    // Clear last active section
    localStorage.removeItem('lastActiveSection');
}

// جب پیج لوڈ ہو تو:
document.addEventListener('DOMContentLoaded', () => {
    // Check if currentEmployeesData exists in localStorage BEFORE loading.
    const hasInitialDataInLocalStorage = localStorage.getItem('currentEmployeesData') !== null;

    loadDataFromLocalStorage(); // ہمیشہ پہلے ڈیٹا لوڈ کریں

    // ابتدائی ڈیٹا (ٹیسٹنگ کے لیے)
    // یہ صرف تبھی ڈیٹا شامل کرے گا جب 'currentEmployeesData' localStorage میں موجود نہ ہو
    if (!hasInitialDataInLocalStorage) {
        employees.push(new Employee(1, "علی احمد", 45000, "male", 25, 1500, 10, 2000, 500, false)); // نئے ملازم کے لیے false
        employees.push(new Employee(2, "بلال محمود", 30000, "male", 20, 0, 5, 1000, 0, false)); // نئے ملازم کے لیے false
        employees.push(new Employee(3, "عائشہ خان", 35000, "female", 22, 500, 0, 0, 0, false)); // نئے ملازم کے لیے false
        saveDataToLocalStorage(); // Initial save
        console.log('Initial employees data set (because localStorage was empty):', employees); // Debug log
    }

    // لاگ ان فارم ہینڈلر
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevents the form from submitting and page reloading
            login();
        });
    }

    // Set the month/year input to the current date on page load
    setCurrentMonthYear();
});

function importSavedRecordToMain(monthYear) {
    if (!savedRecords[monthYear]) {
        alert("ریکارڈ موجود نہیں ہے۔");
        return;
    }
    const restoredEmployees = savedRecords[monthYear].map(emp => new Employee(
        emp.empId, emp.name, emp.salaryPerMonth, emp.gender,
        emp.workingDays, emp.previousDue, emp.overtimeHours,
        emp.advanceTaken, emp.papadDeduction, false
    ));
    employees = employees.filter(e => e.gender !== restoredEmployees[0].gender);
    employees = employees.concat(restoredEmployees);
    saveDataToLocalStorage();
    alert("ڈیٹا کامیابی سے واپس Import کر دیا گیا ہے!");
    renderEmployees(restoredEmployees[0].gender);
}
