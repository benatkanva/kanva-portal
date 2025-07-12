import BaseComponent from './BaseComponent';

/**
 * Data Table Component
 * A reusable table component with sorting, pagination, and row actions
 */
class DataTable extends BaseComponent {
    /**
     * Create a new DataTable
     * @param {Object} options - Component options
     * @param {Array} [options.columns=[]] - Column definitions
     * @param {Array} [options.data=[]] - Table data
     * @param {Object} [options.pagination] - Pagination settings
     * @param {boolean} [options.selectable=false] - Whether rows are selectable
     * @param {boolean} [options.sortable=true] - Whether columns are sortable
     * @param {Function} [options.onRowClick] - Row click handler
     * @param {Function} [options.onSelectionChange] - Selection change handler
     */
    constructor({
        columns = [],
        data = [],
        pagination = {
            enabled: true,
            pageSize: 10,
            currentPage: 1
        },
        selectable = false,
        sortable = true,
        onRowClick = null,
        onSelectionChange = null,
        ...rest
    } = {}) {
        super({
            columns,
            data,
            pagination: {
                enabled: pagination.enabled !== false,
                pageSize: pagination.pageSize || 10,
                currentPage: pagination.currentPage || 1
            },
            sortable,
            selectable,
            selectedRows: new Set(),
            sortColumn: null,
            sortDirection: 'asc',
            ...rest
        });
        
        // Bind methods
        this.handleSort = this.handleSort.bind(this);
        this.handleRowClick = this.handleRowClick.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.handleSelectRow = this.handleSelectRow.bind(this);
        this.setPage = this.setPage.bind(this);
    }
    
    /**
     * Render the data table
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'admin-datatable';
        
        // Table container
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-responsive';
        
        // Table
        const table = document.createElement('table');
        table.className = 'table table-hover align-middle';
        
        // Table header
        const thead = this.renderTableHeader();
        
        // Table body
        const tbody = this.renderTableBody();
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        // Pagination
        const pagination = this.data.pagination.enabled ? this.renderPagination() : null;
        
        // Assemble the component
        this.element.innerHTML = '';
        this.element.appendChild(tableContainer);
        if (pagination) {
            this.element.appendChild(pagination);
        }
        
        return this.element;
    }
    
    /**
     * Render the table header
     */
    renderTableHeader() {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Select all checkbox
        if (this.data.selectable) {
            const th = document.createElement('th');
            th.className = 'select-column';
            th.innerHTML = `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="selectAllRows" 
                           ${this.areAllRowsSelected() ? 'checked' : ''}>
                </div>
            `;
            headerRow.appendChild(th);
        }
        
        // Column headers
        this.data.columns.forEach(column => {
            const th = document.createElement('th');
            th.className = column.headerClass || '';
            
            if (this.data.sortable && column.sortable !== false) {
                th.classList.add('sortable');
                th.dataset.column = column.key;
                
                const sortIcon = this.data.sortColumn === column.key 
                    ? `<i class="fas fa-sort-${this.data.sortDirection === 'asc' ? 'up' : 'down'}"></i>`
                    : '<i class="fas fa-sort"></i>';
                
                th.innerHTML = `
                    <a href="#" class="text-decoration-none text-dark">
                        ${column.label || column.key}
                        ${sortIcon}
                    </a>
                `;
            } else {
                th.textContent = column.label || column.key;
            }
            
            headerRow.appendChild(th);
        });
        
        // Actions column
        if (this.data.columns.some(col => col.actions)) {
            const th = document.createElement('th');
            th.className = 'actions-column';
            th.textContent = 'Actions';
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        return thead;
    }
    
    /**
     * Render the table body
     */
    renderTableBody() {
        const tbody = document.createElement('tbody');
        
        if (this.data.data.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = this.data.columns.length + (this.data.selectable ? 1 : 0) + 
                        (this.data.columns.some(col => col.actions) ? 1 : 0);
            td.className = 'text-center py-4 text-muted';
            td.textContent = 'No data available';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return tbody;
        }
        
        // Get paginated data
        const paginatedData = this.getPaginatedData();
        
        // Create rows
        paginatedData.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            tr.dataset.id = row.id || rowIndex;
            
            // Add click handler if provided
            if (this.data.onRowClick) {
                tr.style.cursor = 'pointer';
            }
            
            // Select checkbox
            if (this.data.selectable) {
                const td = document.createElement('td');
                td.className = 'select-column';
                td.innerHTML = `
                    <div class="form-check">
                        <input class="form-check-input row-checkbox" type="checkbox" 
                               data-id="${row.id || rowIndex}" 
                               ${this.data.selectedRows.has(row.id || rowIndex) ? 'checked' : ''}>
                    </div>
                `;
                tr.appendChild(td);
            }
            
            // Data cells
            this.data.columns.forEach(column => {
                const td = document.createElement('td');
                td.className = column.cellClass || '';
                
                // Format cell value
                let cellValue = row[column.key];
                
                if (column.formatter) {
                    cellValue = column.formatter(cellValue, row);
                } else if (column.key === 'actions' && column.actions) {
                    cellValue = this.renderRowActions(column.actions, row);
                }
                
                td.innerHTML = cellValue || '';
                tr.appendChild(td);
            });
            
            // Actions column
            if (this.data.columns.some(col => col.actions)) {
                const td = document.createElement('td');
                td.className = 'actions-column';
                
                const actions = this.data.columns.find(col => col.actions)?.actions || [];
                td.innerHTML = this.renderRowActions(actions, row);
                
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        });
        
        return tbody;
    }
    
    /**
     * Render row actions
     */
    renderRowActions(actions, row) {
        if (!actions || !Array.isArray(actions)) return '';
        
        return `
            <div class="btn-group btn-group-sm" role="group">
                ${actions.map(action => {
                    const isVisible = !action.visible || action.visible(row);
                    const isDisabled = action.disabled && action.disabled(row);
                    
                    if (!isVisible) return '';
                    
                    return `
                        <button type="button" 
                                class="btn ${action.class || 'btn-outline-secondary'}"
                                data-action="${action.id}"
                                data-id="${row.id}"
                                ${isDisabled ? 'disabled' : ''}
                                title="${action.tooltip || ''}">
                            <i class="fas fa-${action.icon}"></i>
                            ${action.label ? ` ${action.label}` : ''}
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    /**
     * Render pagination controls
     */
    renderPagination() {
        const totalPages = Math.ceil(this.data.data.length / this.data.pagination.pageSize);
        if (totalPages <= 1) return null;
        
        const currentPage = this.data.pagination.currentPage;
        const pagination = document.createElement('div');
        pagination.className = 'd-flex justify-content-between align-items-center mt-3';
        
        // Page info
        const startItem = (currentPage - 1) * this.data.pagination.pageSize + 1;
        const endItem = Math.min(currentPage * this.data.pagination.pageSize, this.data.data.length);
        
        // Pagination controls
        pagination.innerHTML = `
            <div class="text-muted small">
                Showing ${startItem} to ${endItem} of ${this.data.data.length} entries
            </div>
            <nav>
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                    
                    ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Show pages around current page
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }
                        
                        return `
                            <li class="page-item ${pageNum === currentPage ? 'active' : ''}">
                                <a class="page-link" href="#" data-page="${pageNum}">${pageNum}</a>
                            </li>
                        `;
                    }).join('')}
                    
                    ${totalPages > 5 && currentPage < totalPages - 2 ? '
                        <li class="page-item disabled">
                            <span class="page-link">...</span>
                        </li>
                        <li class="page-item">
                            <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                        </li>' : ''
                    }
                    
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
        `;
        
        return pagination;
    }
    
    /**
     * Handle sort column
     */
    handleSort(e) {
        e.preventDefault();
        
        const th = e.target.closest('th.sortable');
        if (!th) return;
        
        const column = th.dataset.column;
        if (!column) return;
        
        let direction = 'asc';
        if (this.data.sortColumn === column) {
            direction = this.data.sortDirection === 'asc' ? 'desc' : 'asc';
        }
        
        this.setState({
            sortColumn: column,
            sortDirection: direction,
            pagination: {
                ...this.data.pagination,
                currentPage: 1 // Reset to first page when sorting
            }
        });
        
        this.emit('sort', { column, direction });
    }
    
    /**
     * Handle row click
     */
    handleRowClick(e) {
        if (!this.data.onRowClick) return;
        
        const row = e.target.closest('tr');
        if (!row || row.closest('thead')) return;
        
        const rowId = row.dataset.id;
        const rowData = this.data.data.find(item => 
            String(item.id) === String(rowId) || 
            String(item._id) === String(rowId)
        );
        
        if (rowData) {
            this.data.onRowClick(rowData, e);
        }
    }
    
    /**
     * Handle select all rows
     */
    handleSelectAll(e) {
        const isChecked = e.target.checked;
        const checkboxes = this.element.querySelectorAll('.row-checkbox');
        const selectedRows = new Set();
        
        if (isChecked) {
            checkboxes.forEach(checkbox => {
                selectedRows.add(checkbox.dataset.id);
            });
        }
        
        this.setState({ selectedRows });
        
        if (this.data.onSelectionChange) {
            this.data.onSelectionChange(Array.from(selectedRows));
        }
    }
    
    /**
     * Handle select row
     */
    handleSelectRow(e) {
        const checkbox = e.target.closest('.row-checkbox');
        if (!checkbox) return;
        
        const rowId = checkbox.dataset.id;
        const selectedRows = new Set(this.data.selectedRows);
        
        if (checkbox.checked) {
            selectedRows.add(rowId);
        } else {
            selectedRows.delete(rowId);
        }
        
        this.setState({ selectedRows });
        
        // Update select all checkbox
        const selectAllCheckbox = this.element?.querySelector('#selectAllRows');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = this.areAllRowsSelected();
            selectAllCheckbox.indeterminate = 
                !selectAllCheckbox.checked && 
                this.data.selectedRows.size > 0;
        }
        
        if (this.data.onSelectionChange) {
            this.data.onSelectionChange(Array.from(selectedRows));
        }
    }
    
    /**
     * Check if all rows are selected
     */
    areAllRowsSelected() {
        const checkboxes = this.element?.querySelectorAll('.row-checkbox');
        if (!checkboxes || checkboxes.length === 0) return false;
        
        return Array.from(checkboxes).every(checkbox => checkbox.checked);
    }
    
    /**
     * Set current page
     */
    setPage(page) {
        const totalPages = Math.ceil(this.data.data.length / this.data.pagination.pageSize);
        page = Math.max(1, Math.min(page, totalPages));
        
        if (page !== this.data.pagination.currentPage) {
            this.setState({
                pagination: {
                    ...this.data.pagination,
                    currentPage: page
                }
            });
            
            this.emit('pageChange', page);
        }
    }
    
    /**
     * Get paginated data based on current page and sort
     */
    getPaginatedData() {
        let data = [...this.data.data];
        
        // Sort data if sort column is specified
        if (this.data.sortColumn) {
            data.sort((a, b) => {
                const aValue = a[this.data.sortColumn];
                const bValue = b[this.data.sortColumn];
                
                // Handle undefined/null values
                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;
                
                // Compare values
                if (aValue < bValue) return this.data.sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return this.data.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        // Apply pagination
        if (this.data.pagination.enabled) {
            const start = (this.data.pagination.currentPage - 1) * this.data.pagination.pageSize;
            const end = start + this.data.pagination.pageSize;
            return data.slice(start, end);
        }
        
        return data;
    }
    
    /**
     * Lifecycle hook - called after component is mounted
     */
    onMount() {
        // Add event listeners
        const table = this.element.querySelector('table');
        if (table) {
            // Sort
            if (this.data.sortable) {
                table.addEventListener('click', this.handleSort);
            }
            
            // Row click
            if (this.data.onRowClick) {
                table.addEventListener('click', this.handleRowClick);
            }
        }
        
        // Select all
        const selectAll = this.element.querySelector('#selectAllRows');
        if (selectAll) {
            selectAll.addEventListener('change', this.handleSelectAll);
        }
        
        // Row selection
        this.element.addEventListener('change', (e) => {
            if (e.target.classList.contains('row-checkbox')) {
                this.handleSelectRow(e);
            }
        });
        
        // Pagination
        this.element.addEventListener('click', (e) => {
            const pageLink = e.target.closest('a[data-page]');
            if (pageLink) {
                e.preventDefault();
                this.setPage(parseInt(pageLink.dataset.page, 10));
            }
        });
        
        // Action buttons
        this.element.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const actionId = actionBtn.dataset.action;
            const rowId = actionBtn.dataset.id;
            const rowData = this.data.data.find(item => 
                String(item.id) === String(rowId) || 
                String(item._id) === String(rowId)
            );
            
            if (rowData) {
                this.emit('action', { actionId, row: rowData });
            }
        });
    }
    
    /**
     * Lifecycle hook - called before component is unmounted
     */
    onBeforeUnmount() {
        // Remove event listeners
        const table = this.element?.querySelector('table');
        if (table) {
            table.removeEventListener('click', this.handleSort);
            table.removeEventListener('click', this.handleRowClick);
        }
        
        const selectAll = this.element?.querySelector('#selectAllRows');
        if (selectAll) {
            selectAll.removeEventListener('change', this.handleSelectAll);
        }
    }
    
    /**
     * Update table data
     * @param {Array} data - New table data
     */
    setData(data) {
        this.setState({ data });
    }
    
    /**
     * Get selected rows
     * @returns {Array} Array of selected row data
     */
    getSelectedRows() {
        return this.data.data.filter(item => 
            this.data.selectedRows.has(String(item.id)) || 
            this.data.selectedRows.has(String(item._id))
        );
    }
    
    /**
     * Clear row selection
     */
    clearSelection() {
        this.setState({ selectedRows: new Set() });
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DataTable = DataTable;
}

export default DataTable;
