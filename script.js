   
        let currentUser = null;
        let currentUserType = null;
        let selectedCategory = null;
        let selectedImage = null;
        let currentAssignmentReportId = null;
        let currentCompletionReportId = null;
        let selectedCompletionImages = [];
        let allReports = JSON.parse(localStorage.getItem('jansamadhaan_reports') || '[]');
        let users = JSON.parse(localStorage.getItem('jansamadhaan_users') || '{}');

        // Officer data for different departments
        const departmentOfficers = {
            'Public Works': ['Aarav Sharma', 'Ananya Reddy', 'Michael Brown'],
            'Water Department': ['Priya Nair', 'Karthik Iyer', 'Sneha Kapoor'],
            'Sanitation Department': ['Aditya Verma', 'Pooja Singh', 'Neha Joshi'],
            'Electrical Department': ['Arjun Deshmukh', 'Kavya Menon', 'Suresh Patil'],
            'Roads & Transport': ['Meera Kulkarni', 'Manish Gupta', 'Aishwarya Rao'],
            'Environment Department': ['Vikram Choudhary', 'Daniel Lewis', 'Jessica Walker']
        };

        // Demo users for testing
        if (Object.keys(users).length === 0) {
            users = {
                citizens: {
                    '9876543210': { 
                        password: '123', 
                        name: 'Mahindra', 
                        phone: '9876543210',
                        reports: []
                    }
                },
                municipal: {
                    'MUN001': { 
                        password: '123', 
                        name: 'A R Likith', 
                        id: 'MUN001',
                        department: 'General Administration'
                    }
                }
            };
            localStorage.setItem('jansamadhaan_users', JSON.stringify(users));
        }

        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            setupEventListeners();
            updateDashboardStats();
        });

        function setupEventListeners() {
            // Login form submissions
            document.getElementById('citizenLoginForm').addEventListener('submit', function(e) {
                e.preventDefault();
                loginCitizen();
            });

            document.getElementById('municipalLoginForm').addEventListener('submit', function(e) {
                e.preventDefault();
                loginMunicipal();
            });

            // Category selection
            document.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', function() {
                    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
                    this.classList.add('selected');
                    selectedCategory = this.dataset.category;
                });
            });

            // Auto-fill contact phone for logged-in citizens
            if (currentUser && currentUserType === 'citizen') {
                document.getElementById('contactPhone').value = currentUser.phone;
            }

            // Department selection change handler
            document.getElementById('assignDepartment').addEventListener('change', function() {
                populateOfficers(this.value);
            });
        }

        // Image preview function
        function previewImage(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    selectedImage = e.target.result;
                    document.getElementById('previewImg').src = e.target.result;
                    document.getElementById('imagePreview').style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        }

        // Completion images preview function
        function previewCompletionImages(event) {
            const files = event.target.files;
            selectedCompletionImages = [];
            const previewContainer = document.getElementById('previewImagesContainer');
            previewContainer.innerHTML = '';

            if (files.length > 0) {
                document.getElementById('completionImagePreview').style.display = 'block';
                
                Array.from(files).forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        selectedCompletionImages.push(e.target.result);
                        
                        const imageDiv = document.createElement('div');
                        imageDiv.style.cssText = 'position: relative; display: inline-block;';
                        
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.cssText = 'max-width: 150px; max-height: 150px; border-radius: 8px; border: 2px solid #e0e0e0;';
                        
                        const removeBtn = document.createElement('button');
                        removeBtn.textContent = '×';
                        removeBtn.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;';
                        removeBtn.onclick = function() {
                            selectedCompletionImages.splice(index, 1);
                            imageDiv.remove();
                            if (selectedCompletionImages.length === 0) {
                                document.getElementById('completionImagePreview').style.display = 'none';
                            }
                        };
                        
                        imageDiv.appendChild(img);
                        imageDiv.appendChild(removeBtn);
                        previewContainer.appendChild(imageDiv);
                    };
                    reader.readAsDataURL(file);
                });
            } else {
                document.getElementById('completionImagePreview').style.display = 'none';
            }
        }

        // Populate officers based on department selection
        function populateOfficers(department) {
            const officerSelect = document.getElementById('assignOfficer');
            officerSelect.innerHTML = '<option value="">Select Officer</option>';
            
            if (department && departmentOfficers[department]) {
                departmentOfficers[department].forEach(officer => {
                    const option = document.createElement('option');
                    option.value = officer;
                    option.textContent = officer;
                    officerSelect.appendChild(option);
                });
            }
        }

        // Login Functions
        function switchLoginTab(type) {
            document.querySelectorAll('.login-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(type + 'LoginForm').classList.add('active');
        }

        function loginCitizen() {
            const phone = document.getElementById('citizenPhone').value;
            const password = document.getElementById('citizenPassword').value;

            if (users.citizens[phone] && users.citizens[phone].password === password) {
                currentUser = users.citizens[phone];
                currentUserType = 'citizen';
                
                // Update UI
                document.getElementById('citizenName').textContent = currentUser.name;
                document.getElementById('citizenAvatar').textContent = currentUser.name.charAt(0);
                
                // Switch to citizen app
                document.getElementById('loginContainer').classList.remove('active');
                document.getElementById('citizenApp').classList.add('active');
                
                // Load user's reports
                loadUserReports();
                
                showNotification('Login successful! Welcome back, ' + currentUser.name);
            } else {
                showNotification('Invalid phone number or password', 'error');
            }
        }

        function loginMunicipal() {
            const empId = document.getElementById('municipalId').value;
            const password = document.getElementById('municipalPassword').value;

            if (users.municipal[empId] && users.municipal[empId].password === password) {
                currentUser = users.municipal[empId];
                currentUserType = 'municipal';
                
                // Update UI
                document.getElementById('municipalName').textContent = currentUser.name;
                document.getElementById('municipalAvatar').textContent = currentUser.name.charAt(0);
                
                // Switch to municipal app
                document.getElementById('loginContainer').classList.remove('active');
                document.getElementById('municipalApp').classList.add('active');
                
                // Load all reports
                loadAllReports();
                updateDashboardStats();
                
                showNotification('Login successful! Welcome, ' + currentUser.name);
            } else {
                showNotification('Invalid employee ID or password', 'error');
            }
        }

        function logout() {
            currentUser = null;
            currentUserType = null;
            
            // Reset forms
            document.querySelectorAll('form').forEach(form => form.reset());
            
            // Switch back to login
            document.querySelectorAll('.app-container').forEach(container => {
                container.classList.remove('active');
            });
            document.getElementById('loginContainer').classList.add('active');
            
            showNotification('Logged out successfully');
        }

        function showSignup(type) {
            if (type === 'citizen') {
                const name = prompt('Enter your full name:');
                const phone = prompt('Enter your phone number:');
                const password = prompt('Create a password:');
                
                if (name && phone && password) {
                    if (!users.citizens[phone]) {
                        users.citizens[phone] = {
                            name: name,
                            phone: phone,
                            password: password,
                            reports: []
                        };
                        localStorage.setItem('jansamadhaan_users', JSON.stringify(users));
                        showNotification('Account created successfully! Please login.');
                    } else {
                        showNotification('Phone number already registered', 'error');
                    }
                }
            }
        }

        // Navigation Functions
        function switchTab(tabName) {
            document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.dashboard-content').forEach(content => content.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }

        function switchMunicipalTab(tabName) {
            document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.dashboard-content').forEach(content => content.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }

        // Report Functions
        function generateReportId() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `JSM-${year}${month}${day}-${random}`;
        }

        function submitReport() {
            if (!selectedCategory) {
                showNotification('Please select a category', 'error');
                return;
            }

            const title = document.getElementById('issueTitle').value.trim();
            const priority = document.getElementById('priority').value;
            const description = document.getElementById('description').value.trim();
            const location = document.getElementById('location').value.trim();
            const contactPhone = document.getElementById('contactPhone').value.trim();

            if (!title || !priority || !description || !location) {
                showNotification('Please fill all required fields', 'error');
                return;
            }

            const reportId = generateReportId();
            const report = {
                id: reportId,
                title: title,
                category: selectedCategory,
                priority: priority,
                description: description,
                location: location,
                contactPhone: contactPhone || currentUser.phone,
                image: selectedImage,
                status: 'submitted',
                submittedBy: currentUser.name,
                submittedPhone: currentUser.phone,
                submittedAt: new Date().toISOString(),
                assignedTo: null,
                assignedAt: null,
                progressUpdates: [],
                completedAt: null
            };

            // Add to all reports
            allReports.push(report);
            
            // Add to user's reports
            if (!currentUser.reports) currentUser.reports = [];
            currentUser.reports.push(reportId);
            
            // Update localStorage
            users.citizens[currentUser.phone] = currentUser;
            localStorage.setItem('jansamadhaan_reports', JSON.stringify(allReports));
            localStorage.setItem('jansamadhaan_users', JSON.stringify(users));

            // Reset form
            document.getElementById('issueTitle').value = '';
            document.getElementById('priority').value = '';
            document.getElementById('description').value = '';
            document.getElementById('location').value = '';
            document.getElementById('issueImage').value = '';
            selectedCategory = null;
            selectedImage = null;
            document.getElementById('imagePreview').style.display = 'none';
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));

            showNotification(`Report submitted successfully! Your tracking ID is: ${reportId}`);
            
            // Refresh user reports
            loadUserReports();
        }

        function trackReportStatus() {
            const trackingId = document.getElementById('trackingId').value.trim().toUpperCase();
            
            if (!trackingId) {
                showNotification('Please enter a tracking ID', 'error');
                return;
            }

            const report = allReports.find(r => r.id === trackingId);
            
            if (!report) {
                showNotification('Report not found. Please check your tracking ID.', 'error');
                document.getElementById('trackResult').style.display = 'none';
                return;
            }

            // Show report info
            document.getElementById('reportInfo').innerHTML = `
                <h3>${report.title}</h3>
                <p><strong>Category:</strong> ${getCategoryName(report.category)}</p>
                <p><strong>Priority:</strong> <span class="priority-badge priority-${report.priority}">${report.priority.toUpperCase()}</span></p>
                <p><strong>Location:</strong> ${report.location}</p>
                <p><strong>Submitted:</strong> ${new Date(report.submittedAt).toLocaleString()}</p>
            `;

            // Update status timeline
            updateStatusTimeline(report.status);

            // Show status details
            const statusMessages = {
                'submitted': 'Your report has been submitted and is awaiting assignment.',
                'assigned': `Your report has been assigned to ${report.assignedTo || 'a department'}.`,
                'progress': 'Work is in progress on your report.',
                'completed': 'Your report has been completed and resolved.'
            };

            document.getElementById('statusDetails').innerHTML = `
                <p><strong>Current Status:</strong> <span class="status-badge status-${report.status}">${report.status.toUpperCase()}</span></p>
                <p>${statusMessages[report.status]}</p>
            `;

            // Show completion details if report is completed
            displayCompletionDetails(report, 'completionDetails');

            document.getElementById('trackResult').style.display = 'block';
        }

        function displayCompletionDetails(report, containerId) {
            const container = document.getElementById(containerId);
            
            if (report.status === 'completed' && report.workDescription) {
                let completionImagesHtml = '';
                if (report.completionImages && report.completionImages.length > 0) {
                    completionImagesHtml = `
                        <div class="completion-item">
                            <strong>Completion Photos:</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                                ${report.completionImages.map(img => 
                                    `<img src="${img}" alt="Completed Work" style="max-width: 150px; height: auto; border-radius: 8px; border: 2px solid #27ae60; cursor: pointer;" onclick="window.open('${img}', '_blank')">`
                                ).join('')}
                            </div>
                        </div>
                    `;
                }

                container.innerHTML = `
                    <div class="completion-section">
                        <h4>Work Completion Details</h4>
                        <div class="completion-grid">
                            <div class="completion-item">
                                <strong>Work Description:</strong>
                                ${report.workDescription}
                            </div>
                            <div class="completion-item">
                                <strong>Completed By:</strong>
                                ${report.completedBy}
                            </div>
                            <div class="completion-item">
                                <strong>Completion Date:</strong>
                                ${new Date(report.completedAt).toLocaleDateString()}
                            </div>
                            ${report.materialsUsed ? `
                                <div class="completion-item">
                                    <strong>Materials Used:</strong>
                                    ${report.materialsUsed}
                                </div>
                            ` : ''}
                            ${report.costIncurred > 0 ? `
                                <div class="completion-item">
                                    <strong>Cost Incurred:</strong>
                                    ₹${report.costIncurred.toFixed(2)}
                                </div>
                            ` : ''}
                            ${report.additionalNotes ? `
                                <div class="completion-item">
                                    <strong>Additional Notes:</strong>
                                    ${report.additionalNotes}
                                </div>
                            ` : ''}
                        </div>
                        ${completionImagesHtml}
                    </div>
                `;
            } else {
                container.innerHTML = '';
            }
        }

        function updateStatusTimeline(currentStatus) {
            const steps = document.querySelectorAll('.status-step');
            const statusOrder = ['submitted', 'assigned', 'progress', 'completed'];
            const currentIndex = statusOrder.indexOf(currentStatus);

            steps.forEach((step, index) => {
                step.classList.remove('completed', 'current');
                if (index < currentIndex) {
                    step.classList.add('completed');
                } else if (index === currentIndex) {
                    step.classList.add('current');
                }
            });
        }

        function loadUserReports() {
            if (!currentUser.reports || currentUser.reports.length === 0) {
                document.getElementById('userReportsList').innerHTML = 
                    '<p style="text-align: center; color: #666; padding: 40px;">No reports submitted yet.</p>';
                return;
            }

            const userReports = allReports.filter(report => 
                currentUser.reports.includes(report.id)
            );

            let html = '<table class="reports-table"><thead><tr>';
            html += '<th>Report ID</th><th>Title</th><th>Category</th><th>Status</th><th>Date</th><th>Actions</th>';
            html += '</tr></thead><tbody>';

            userReports.forEach(report => {
                html += `<tr>
                    <td>${report.id}</td>
                    <td>${report.title}</td>
                    <td>${getCategoryName(report.category)}</td>
                    <td><span class="status-badge status-${report.status}">${report.status.toUpperCase()}</span></td>
                    <td>${new Date(report.submittedAt).toLocaleDateString()}</td>
                    <td><button class="action-btn btn-assign" onclick="viewCitizenReportDetails('${report.id}')">View Details</button></td>
                </tr>`;
            });

            html += '</tbody></table>';
            document.getElementById('userReportsList').innerHTML = html;
        }

        // Municipal Functions
        function loadAllReports() {
            const recentTable = document.getElementById('recentReportsTable');
            const allTable = document.getElementById('allReportsTable');

            if (allReports.length === 0) {
                recentTable.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No reports available</td></tr>';
                allTable.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No reports available</td></tr>';
                return;
            }

            // Recent reports (last 10)
            const recentReports = allReports.slice(-10).reverse();
            recentTable.innerHTML = recentReports.map(report => `
                <tr>
                    <td>${report.id}</td>
                    <td>${report.title}</td>
                    <td>${getCategoryName(report.category)}</td>
                    <td><span class="priority-badge priority-${report.priority}">${report.priority.toUpperCase()}</span></td>
                    <td><span class="status-badge status-${report.status}">${report.status.toUpperCase()}</span></td>
                    <td>${new Date(report.submittedAt).toLocaleDateString()}</td>
                    <td>${getMunicipalActions(report)}</td>
                </tr>
            `).join('');

            // All reports
            allTable.innerHTML = allReports.slice().reverse().map(report => `
                <tr>
                    <td>${report.id}</td>
                    <td>${report.title}</td>
                    <td>${getCategoryName(report.category)}</td>
                    <td><span class="priority-badge priority-${report.priority}">${report.priority.toUpperCase()}</span></td>
                    <td><span class="status-badge status-${report.status}">${report.status.toUpperCase()}</span></td>
                    <td>${report.submittedBy}</td>
                    <td>${new Date(report.submittedAt).toLocaleDateString()}</td>
                    <td>${getMunicipalActions(report)}</td>
                </tr>
            `).join('');
        }

        function getMunicipalActions(report) {
            let actions = `<button class="action-btn btn-assign" onclick="viewReportDetails('${report.id}')">View</button>`;
            
            if (report.status === 'submitted') {
                actions += `<button class="action-btn btn-assign" onclick="assignReport('${report.id}')">Assign</button>`;
            } else if (report.status === 'assigned') {
                actions += `<button class="action-btn btn-progress" onclick="startProgress('${report.id}')">Start Work</button>`;
            } else if (report.status === 'progress') {
                actions += `<button class="action-btn btn-complete" onclick="completeReport('${report.id}')">Complete</button>`;
            }
            
            return actions;
        }

        function assignReport(reportId) {
            currentAssignmentReportId = reportId;
            const report = allReports.find(r => r.id === reportId);
            
            if (report) {
                // Pre-fill current priority
                document.getElementById('assignPriority').value = report.priority;
                
                // Set minimum date to today
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('expectedCompletion').min = today;
                
                // Show the assignment modal
                document.getElementById('assignmentModal').style.display = 'block';
            }
        }

        function closeAssignmentModal() {
            document.getElementById('assignmentModal').style.display = 'none';
            currentAssignmentReportId = null;
            document.getElementById('reportAssignmentForm').reset();
        }

        function confirmAssignment() {
            const department = document.getElementById('assignDepartment').value;
            const officer = document.getElementById('assignOfficer').value;
            const priority = document.getElementById('assignPriority').value;
            const expectedDate = document.getElementById('expectedCompletion').value;
            const notes = document.getElementById('assignmentNotes').value;

            if (!department || !officer || !expectedDate) {
                showNotification('Please fill all required fields', 'error');
                return;
            }

            const reportIndex = allReports.findIndex(r => r.id === currentAssignmentReportId);
            if (reportIndex !== -1) {
                allReports[reportIndex].status = 'assigned';
                allReports[reportIndex].assignedTo = officer;
                allReports[reportIndex].assignedDepartment = department;
                allReports[reportIndex].priority = priority;
                allReports[reportIndex].expectedCompletion = expectedDate;
                allReports[reportIndex].assignmentNotes = notes;
                allReports[reportIndex].assignedAt = new Date().toISOString();
                allReports[reportIndex].assignedBy = currentUser.name;
                
                localStorage.setItem('jansamadhaan_reports', JSON.stringify(allReports));
                loadAllReports();
                updateDashboardStats();
                
                showNotification(`Report ${currentAssignmentReportId} assigned to ${officer} (${department})`);
                closeAssignmentModal();
            }
        }

        function startProgress(reportId) {
            const reportIndex = allReports.findIndex(r => r.id === reportId);
            if (reportIndex !== -1) {
                allReports[reportIndex].status = 'progress';
                
                localStorage.setItem('jansamadhaan_reports', JSON.stringify(allReports));
                loadAllReports();
                updateDashboardStats();
                
                showNotification(`Work started on report ${reportId}`);
            }
        }

        function completeReport(reportId) {
            currentCompletionReportId = reportId;
            const report = allReports.find(r => r.id === reportId);
            
            if (report) {
                // Set default completion date to today
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('completionDate').value = today;
                document.getElementById('completionDate').max = today;
                
                // Pre-fill completed by field with current user
                document.getElementById('completedBy').value = currentUser.name;
                
                // Show the completion modal
                document.getElementById('completionModal').style.display = 'block';
            }
        }

        function closeCompletionModal() {
            document.getElementById('completionModal').style.display = 'none';
            currentCompletionReportId = null;
            selectedCompletionImages = [];
            document.getElementById('reportCompletionForm').reset();
            document.getElementById('completionImagePreview').style.display = 'none';
            document.getElementById('previewImagesContainer').innerHTML = '';
        }

        function confirmCompletion() {
            const workDescription = document.getElementById('workDescription').value.trim();
            const completionDate = document.getElementById('completionDate').value;
            const completedBy = document.getElementById('completedBy').value.trim();
            const materialsUsed = document.getElementById('materialsUsed').value.trim();
            const costIncurred = document.getElementById('costIncurred').value;
            const additionalNotes = document.getElementById('additionalNotes').value.trim();

            if (!workDescription || !completionDate || !completedBy) {
                showNotification('Please fill all required fields', 'error');
                return;
            }

            const reportIndex = allReports.findIndex(r => r.id === currentCompletionReportId);
            if (reportIndex !== -1) {
                allReports[reportIndex].status = 'completed';
                allReports[reportIndex].completedAt = new Date(completionDate).toISOString();
                allReports[reportIndex].workDescription = workDescription;
                allReports[reportIndex].completedBy = completedBy;
                allReports[reportIndex].materialsUsed = materialsUsed;
                allReports[reportIndex].costIncurred = costIncurred ? parseFloat(costIncurred) : 0;
                allReports[reportIndex].additionalNotes = additionalNotes;
                allReports[reportIndex].completionImages = selectedCompletionImages;
                allReports[reportIndex].completionProcessedBy = currentUser.name;
                allReports[reportIndex].completionProcessedAt = new Date().toISOString();
                
                localStorage.setItem('jansamadhaan_reports', JSON.stringify(allReports));
                loadAllReports();
                updateDashboardStats();
                
                showNotification(`Report ${currentCompletionReportId} marked as completed successfully`);
                closeCompletionModal();
            }
        }

        function updateDashboardStats() {
            const pending = allReports.filter(r => r.status === 'submitted').length;
            const progress = allReports.filter(r => r.status === 'assigned' || r.status === 'progress').length;
            const completed = allReports.filter(r => r.status === 'completed').length;
            const critical = allReports.filter(r => r.priority === 'critical').length;

            document.getElementById('pendingCount').textContent = pending;
            document.getElementById('progressCount').textContent = progress;
            document.getElementById('completedCount').textContent = completed;
            document.getElementById('criticalCount').textContent = critical;
            document.getElementById('totalReports').textContent = allReports.length;

            // Calculate average resolution time
            const completedReports = allReports.filter(r => r.status === 'completed' && r.completedAt);
            let avgDays = 0;
            if (completedReports.length > 0) {
                const totalDays = completedReports.reduce((sum, report) => {
                    const submitted = new Date(report.submittedAt);
                    const completed = new Date(report.completedAt);
                    const days = Math.ceil((completed - submitted) / (1000 * 60 * 60 * 24));
                    return sum + days;
                }, 0);
                avgDays = Math.round(totalDays / completedReports.length);
            }
            document.getElementById('avgResolutionTime').textContent = avgDays;
        }

        // Utility Functions
        function getCategoryName(category) {
            const names = {
                'road': 'Road & Traffic',
                'water': 'Water Supply',
                'waste': 'Waste Management',
                'electricity': 'Electricity',
                'drainage': 'Drainage',
                'sanitation': 'Sanitation',
                'parks': 'Parks & Recreation',
                'streetlight': 'Street Lighting',
                'noise': 'Noise Pollution',
                'air': 'Air Pollution',
                'building': 'Building Violations',
                'animal': 'Stray Animals',
                'public': 'Public Facilities',
                'health': 'Public Health',
                'security': 'Public Safety',
                'other': 'Other Issues'
            };
            return names[category] || category;
        }

        // Enhanced view function for citizens to see completion details
        function viewCitizenReportDetails(reportId) {
            const report = allReports.find(r => r.id === reportId);
            if (!report) return;

            let imageSection = '';
            if (report.image) {
                imageSection = `<p><strong>Attached Image:</strong></p>
                               <img src="${report.image}" alt="Report Image" style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #e0e0e0; margin: 10px 0;">`;
            }

            let assignmentDetails = '';
            if (report.status !== 'submitted') {
                assignmentDetails = `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h4>Assignment Details</h4>
                        ${report.assignedTo ? `<p><strong>Assigned to:</strong> ${report.assignedTo}</p>` : ''}
                        ${report.assignedDepartment ? `<p><strong>Department:</strong> ${report.assignedDepartment}</p>` : ''}
                        ${report.expectedCompletion ? `<p><strong>Expected Completion:</strong> ${new Date(report.expectedCompletion).toLocaleDateString()}</p>` : ''}
                        ${report.assignedAt ? `<p><strong>Assigned on:</strong> ${new Date(report.assignedAt).toLocaleString()}</p>` : ''}
                    </div>
                `;
            }

            let completionDetailsHtml = '';
            if (report.status === 'completed') {
                let completionImagesSection = '';
                if (report.completionImages && report.completionImages.length > 0) {
                    completionImagesSection = `
                        <div style="margin: 15px 0;">
                            <p><strong>Work Completion Photos:</strong></p>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                ${report.completionImages.map(img => 
                                    `<img src="${img}" alt="Completed Work" style="max-width: 200px; height: auto; border-radius: 8px; border: 2px solid #27ae60; cursor: pointer;" onclick="window.open('${img}', '_blank')">`
                                ).join('')}
                            </div>
                            <p style="font-size: 0.9rem; color: #666; margin-top: 5px;">Click on images to view in full size</p>
                        </div>
                    `;
                }

                completionDetailsHtml = `
                    <div class="completion-section">
                        <h4>Work Completion Details</h4>
                        <div class="completion-grid">
                            <div class="completion-item">
                                <strong>Work Description:</strong>
                                ${report.workDescription}
                            </div>
                            <div class="completion-item">
                                <strong>Completed by:</strong>
                                ${report.completedBy}
                            </div>
                            <div class="completion-item">
                                <strong>Completion Date:</strong>
                                ${new Date(report.completedAt).toLocaleDateString()}
                            </div>
                            ${report.materialsUsed ? `
                                <div class="completion-item">
                                    <strong>Materials Used:</strong>
                                    ${report.materialsUsed}
                                </div>
                            ` : ''}
                            ${report.costIncurred && report.costIncurred > 0 ? `
                                <div class="completion-item">
                                    <strong>Cost Incurred:</strong>
                                    ₹${report.costIncurred.toFixed(2)}
                                </div>
                            ` : ''}
                            ${report.additionalNotes ? `
                                <div class="completion-item">
                                    <strong>Additional Notes:</strong>
                                    ${report.additionalNotes}
                                </div>
                            ` : ''}
                        </div>
                        ${completionImagesSection}
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(21, 87, 36, 0.2);">
                            <p style="font-size: 0.9rem; color: #155724;"><strong>Resolution completed successfully!</strong> Thank you for using JanSamadhaan.</p>
                        </div>
                    </div>
                `;
            }

            const modalContent = `
                <h3>${report.title}</h3>
                <p><strong>Report ID:</strong> ${report.id}</p>
                <p><strong>Category:</strong> ${getCategoryName(report.category)}</p>
                <p><strong>Priority:</strong> <span class="priority-badge priority-${report.priority}">${report.priority.toUpperCase()}</span></p>
                <p><strong>Status:</strong> <span class="status-badge status-${report.status}">${report.status.toUpperCase()}</span></p>
                <p><strong>Description:</strong> ${report.description}</p>
                <p><strong>Location:</strong> ${report.location}</p>
                <p><strong>Contact:</strong> ${report.contactPhone}</p>
                <p><strong>Submitted on:</strong> ${new Date(report.submittedAt).toLocaleString()}</p>
                ${imageSection}
                ${assignmentDetails}
                ${completionDetailsHtml}
            `;

            document.getElementById('modalContent').innerHTML = modalContent;
            document.getElementById('reportModal').style.display = 'block';
        }

        function viewReportDetails(reportId) {
            const report = allReports.find(r => r.id === reportId);
            if (!report) return;

            let imageSection = '';
            if (report.image) {
                imageSection = `<p><strong>Attached Image:</strong></p>
                               <img src="${report.image}" alt="Report Image" style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #e0e0e0; margin: 10px 0;">`;
            }

            let assignmentDetails = '';
            if (report.status !== 'submitted') {
                assignmentDetails = `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h4>Assignment Details</h4>
                        ${report.assignedTo ? `<p><strong>Assigned to:</strong> ${report.assignedTo}</p>` : ''}
                        ${report.assignedDepartment ? `<p><strong>Department:</strong> ${report.assignedDepartment}</p>` : ''}
                        ${report.expectedCompletion ? `<p><strong>Expected Completion:</strong> ${new Date(report.expectedCompletion).toLocaleDateString()}</p>` : ''}
                        ${report.assignmentNotes ? `<p><strong>Notes:</strong> ${report.assignmentNotes}</p>` : ''}
                        ${report.assignedBy ? `<p><strong>Assigned by:</strong> ${report.assignedBy}</p>` : ''}
                        ${report.assignedAt ? `<p><strong>Assigned on:</strong> ${new Date(report.assignedAt).toLocaleString()}</p>` : ''}
                    </div>
                `;
            }

            let completionDetails = '';
            if (report.status === 'completed') {
                let completionImagesSection = '';
                if (report.completionImages && report.completionImages.length > 0) {
                    completionImagesSection = `
                        <div style="margin: 15px 0;">
                            <p><strong>Completion Images:</strong></p>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                ${report.completionImages.map(img => 
                                    `<img src="${img}" alt="Completion Image" style="max-width: 200px; height: auto; border-radius: 8px; border: 2px solid #e0e0e0; cursor: pointer;" onclick="window.open('${img}', '_blank')">`
                                ).join('')}
                            </div>
                        </div>
                    `;
                }

                completionDetails = `
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #27ae60;">
                        <h4>Completion Details</h4>
                        ${report.workDescription ? `<p><strong>Work Completed:</strong> ${report.workDescription}</p>` : ''}
                        ${report.completedBy ? `<p><strong>Completed by:</strong> ${report.completedBy}</p>` : ''}
                        ${report.completedAt ? `<p><strong>Completion Date:</strong> ${new Date(report.completedAt).toLocaleDateString()}</p>` : ''}
                        ${report.materialsUsed ? `<p><strong>Materials Used:</strong> ${report.materialsUsed}</p>` : ''}
                        ${report.costIncurred ? `<p><strong>Cost Incurred:</strong> ₹${report.costIncurred.toFixed(2)}</p>` : ''}
                        ${report.additionalNotes ? `<p><strong>Additional Notes:</strong> ${report.additionalNotes}</p>` : ''}
                        ${completionImagesSection}
                        ${report.completionProcessedBy ? `<p><strong>Processed by:</strong> ${report.completionProcessedBy}</p>` : ''}
                        ${report.completionProcessedAt ? `<p><strong>Processed on:</strong> ${new Date(report.completionProcessedAt).toLocaleString()}</p>` : ''}
                    </div>
                `;
            }

            const modalContent = `
                <h3>${report.title}</h3>
                <p><strong>Report ID:</strong> ${report.id}</p>
                <p><strong>Category:</strong> ${getCategoryName(report.category)}</p>
                <p><strong>Priority:</strong> <span class="priority-badge priority-${report.priority}">${report.priority.toUpperCase()}</span></p>
                <p><strong>Status:</strong> <span class="status-badge status-${report.status}">${report.status.toUpperCase()}</span></p>
                <p><strong>Description:</strong> ${report.description}</p>
                <p><strong>Location:</strong> ${report.location}</p>
                <p><strong>Contact:</strong> ${report.contactPhone}</p>
                <p><strong>Submitted by:</strong> ${report.submittedBy}</p>
                <p><strong>Submitted on:</strong> ${new Date(report.submittedAt).toLocaleString()}</p>
                ${imageSection}
                ${assignmentDetails}
                ${completionDetails}
            `;

            document.getElementById('modalContent').innerHTML = modalContent;
            document.getElementById('reportModal').style.display = 'block';
        }

        function closeModal() {
            document.getElementById('reportModal').style.display = 'none';
        }

        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';

            setTimeout(() => {
                notification.style.display = 'none';
            }, 4000);
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const reportModal = document.getElementById('reportModal');
            const assignmentModal = document.getElementById('assignmentModal');
            const completionModal = document.getElementById('completionModal');
            
            if (event.target === reportModal) {
                reportModal.style.display = 'none';
            }
            if (event.target === assignmentModal) {
                closeAssignmentModal();
            }
            if (event.target === completionModal) {
                closeCompletionModal();
            }
        }
