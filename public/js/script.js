// Global variables
let myChart;
let chartData;
let searchTimeout;
const categories = new Set();

// Initialize the chart
function initTreeChart() {
  // Show loading indicator
  document.getElementById('loading').style.display = 'flex';
  
  fetch('data.json')
    .then(response => response.json())
    .then(rawData => {
      chartData = preprocessData(rawData);
      renderChart(chartData);
      buildSearchIndex(chartData);
      document.getElementById('loading').style.display = 'none';
      
      // Initialize the category filter
      initCategoryFilter();
    })
    .catch(error => {
      console.error('Error loading data:', error);
      document.getElementById('loading').style.display = 'none';
      document.getElementById('errorMessage').textContent = 'Failed to load data. Please try again later.';
      document.getElementById('errorMessage').style.display = 'block';
    });
}

// Preprocess the data to add colors, icons, and other properties
function preprocessData(data) {
  // Category-specific icons and colors
  const categoryIcons = {
    'Username': '👤',
    'domain_info': '🌐',
    'Email': '✉️',
    'Phone': '📱',
    'Social Media': '📱',
    'Images': '🖼️',
    'Documents': '📄',
    'Search Engines': '🔍',
    'Maps': '🗺️',
    'default': '🔍'
  };
  
  const categoryColors = {
    'Username': '#4e79a7',
    'domain_info': '#76b7b2',
    'Email': '#59a14f',
    'Phone': '#edc949',
    'Social Media': '#af7aa1',
    'Images': '#ff9da7',
    'Documents': '#9c755f',
    'Search Engines': '#bab0ab',
    'Maps': '#e15759',
    'default': '#79706e'
  };

  function assignProperties(node, depth = 0) {
    // Add to categories set (for filtering)
    if (depth === 1) {
      categories.add(node.name);
    }
    
    // Get icon and color based on category or use default
    const icon = depth === 1 ? 
      categoryIcons[node.name] || categoryIcons['default'] : 
      (node.children ? '📁' : '🔗');
    
    const color = depth === 1 ? 
      categoryColors[node.name] || categoryColors['default'] : 
      (node.children ? '#555' : '#8ca0ff');
    
    // Add properties to node
    node.itemStyle = { 
      color: color, 
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#00ff00'
    };
    
    node.originalName = node.name;
    node.name = `${icon} ${node.name}`;
    
    // Add tooltip with description if available
    if (node.description) {
      node.tooltip = {
        formatter: `<div style="padding: 10px;">
          <h4>${node.name}</h4>
          <p>${node.description}</p>
          ${node.url ? `<a href="${node.url}" target="_blank">${node.url}</a>` : ''}
        </div>`
      };
    }
    
    // Process children recursively
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => assignProperties(child, depth + 1));
    }
  }

  assignProperties(data);
  return data;
}

// Render the chart with the given data
function renderChart(data) {
  const container = document.getElementById('treeChart');
  myChart = echarts.init(container);
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#00ff00',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      },
      confine: true
    },
    series: [
      {
        type: 'tree',
        data: [data],
        symbol: 'rect',
        symbolSize: [160, 40],
        top: '5%',
        left: '7%',
        bottom: '5%',
        right: '7%',
        layout: 'orthogonal',
        orient: 'LR',
        label: {
          color: '#fff',
          position: 'inside',
          verticalAlign: 'middle',
          align: 'center',
          fontSize: 10,
          fontWeight: 'bold',
          formatter: function(params) {
            return params.data.name;
          }
        },
        leaves: {
          label: {
            position: 'inside',
            verticalAlign: 'middle',
            align: 'center',
            color: '#fff',
          }
        },
        emphasis: {
          focus: 'descendant',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 255, 0, 0.7)'
          }
        },
        itemStyle: {
          borderRadius: 10,
          borderColor: '#00ff00',
        },
        lineStyle: {
          color: '#00ff00',
          width: 1.5,
          curveness: 0.5
        },
        roam: true,
        expandAndCollapse: true,
        initialTreeDepth: 1,
        animationDuration: 750,
        animationDurationUpdate: 750,
        animationEasing: 'elasticOut',
      }
    ],
    toolbox: {
      feature: {
        restore: {
          title: 'Reset View'
        },
        saveAsImage: {
          title: 'Save as Image'
        }
      },
      iconStyle: {
        color: '#00ff00',
        borderColor: '#00ff00'
      }
    }
  };
  
  myChart.setOption(option);

  // Resize handler
  window.addEventListener('resize', () => {
    myChart.resize();
  });

  // Event listener for node click
  myChart.on('click', function(params) {
    if (!params.data.children) { // It's a leaf node
      showNodeInfo(params.data);
    }
  });
}

// Show node information in the modal
function showNodeInfo(nodeData) {
  const modalTitle = document.getElementById('nodeInfoModalLabel');
  const modalBody = document.getElementById('nodeInfoContent');
  
  // Clean up the node name (remove emoji)
  const cleanName = nodeData.originalName || nodeData.name.substring(2).trim();
  
  modalTitle.innerHTML = cleanName;
  
  // Build modal content with enhanced styling
  let modalContent = `
    <div class="card bg-dark border-success mb-3">
      <div class="card-body">
        <h5 class="card-title text-success">Details</h5>
        ${nodeData.description ? `<p class="card-text">${nodeData.description}</p>` : '<p class="card-text text-muted">No description available</p>'}
      </div>
    </div>
  `;
  
  if (nodeData.url) {
    modalContent += `
      <div class="card bg-dark border-info">
        <div class="card-body">
          <h5 class="card-title text-info">Resource</h5>
          <a href="${nodeData.url}" target="_blank" class="btn btn-outline-info btn-sm">
            <i class="fas fa-external-link-alt"></i> Open Link
          </a>
          <button id="copyUrlBtn" class="btn btn-outline-secondary btn-sm ms-2" data-url="${nodeData.url}">
            <i class="fas fa-copy"></i> Copy URL
          </button>
        </div>
      </div>
    `;
  }
  
  modalBody.innerHTML = modalContent;
  
  // Show the modal
  new bootstrap.Modal(document.getElementById('nodeInfoModal')).show();
  
  // Add event listener for copy button
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  if (copyUrlBtn) {
    copyUrlBtn.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      navigator.clipboard.writeText(url).then(function() {
        copyUrlBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
          copyUrlBtn.innerHTML = '<i class="fas fa-copy"></i> Copy URL';
        }, 2000);
      });
    });
  }
}

// Build search index from data
function buildSearchIndex(data) {
  const searchIndex = [];
  
  function traverse(node, path = []) {
    const currentPath = [...path, node.name];
    
    if (!node.children) {
      searchIndex.push({
        name: node.originalName || node.name.substring(2).trim(),
        path: currentPath.map(p => p.substring(2).trim()).join(' > '),
        url: node.url,
        description: node.description,
        nodeRef: node
      });
    } else {
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    }
  }
  
  traverse(data);
  
  // Attach search index to window for easy access
  window.searchIndex = searchIndex;
}

// Search function
function performSearch(query) {
  if (!query || query.length < 2) {
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchResults').style.display = 'none';
    return;
  }
  
  query = query.toLowerCase();
  
  const results = window.searchIndex.filter(item => 
    item.name.toLowerCase().includes(query) || 
    (item.description && item.description.toLowerCase().includes(query))
  ).slice(0, 10);
  
  const resultContainer = document.getElementById('searchResults');
  
  if (results.length === 0) {
    resultContainer.innerHTML = '<p class="text-center p-3">No results found</p>';
  } else {
    let resultHTML = '';
    results.forEach(result => {
      resultHTML += `
        <div class="search-result" data-path="${result.path}">
          <h6>${result.name}</h6>
          <small class="text-muted">${result.path}</small>
          ${result.description ? `<p class="small">${result.description.substring(0, 100)}${result.description.length > 100 ? '...' : ''}</p>` : ''}
        </div>
      `;
    });
    resultContainer.innerHTML = resultHTML;
    
    // Add click event to results
    document.querySelectorAll('.search-result').forEach(item => {
      item.addEventListener('click', function() {
        const resultPath = this.getAttribute('data-path');
        const result = window.searchIndex.find(r => r.path === resultPath);
        
        if (result) {
          showNodeInfo(result.nodeRef);
          document.getElementById('searchResults').style.display = 'none';
          document.getElementById('searchInput').value = '';
        }
      });
    });
  }
  
  resultContainer.style.display = 'block';
}

// Initialize category filter
function initCategoryFilter() {
  const filterContainer = document.getElementById('categoryFilter');
  
  if (!filterContainer) return;
  
  let filterHTML = '<div class="d-flex flex-wrap justify-content-center">';
  
  // Add "All" option
  filterHTML += `
    <div class="form-check form-check-inline m-2">
      <input class="form-check-input" type="checkbox" id="filter-all" checked>
      <label class="form-check-label text-light" for="filter-all">All</label>
    </div>
  `;
  
  // Add each category
  categories.forEach(category => {
    filterHTML += `
      <div class="form-check form-check-inline m-2">
        <input class="form-check-input filter-category" type="checkbox" id="filter-${category}" checked>
        <label class="form-check-label text-light" for="filter-${category}">${category}</label>
      </div>
    `;
  });
  
  filterHTML += '</div>';
  filterContainer.innerHTML = filterHTML;
  
  // Add event listeners
  document.getElementById('filter-all').addEventListener('change', function() {
    const checked = this.checked;
    document.querySelectorAll('.filter-category').forEach(checkbox => {
      checkbox.checked = checked;
    });
    applyFilters();
  });
  
  document.querySelectorAll('.filter-category').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      // Update "All" checkbox based on individual selections
      const allChecked = [...document.querySelectorAll('.filter-category')].every(cb => cb.checked);
      document.getElementById('filter-all').checked = allChecked;
      applyFilters();
    });
  });
}

// Apply category filters
function applyFilters() {
  // Get selected categories
  const selectedCategories = [...document.querySelectorAll('.filter-category:checked')].map(cb => 
    cb.id.replace('filter-', '')
  );
  
  // Clone the original data
  const filteredData = JSON.parse(JSON.stringify(chartData));
  
  // Filter top-level categories
  if (selectedCategories.length < categories.size) {
    filteredData.children = filteredData.children.filter(category => 
      selectedCategories.includes(category.originalName || category.name.substring(2).trim())
    );
  }
  
  // Re-render chart with filtered data
  renderChart(filteredData);
}

// Dark mode toggle
function toggleDarkMode() {
  const body = document.body;
  const darkModeBtn = document.getElementById('darkModeToggle');
  
  if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    darkModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', 'false');
  } else {
    body.classList.add('dark-mode');
    darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    localStorage.setItem('darkMode', 'true');
  }
  
  // Redraw chart if it exists
  if (myChart && chartData) {
    renderChart(chartData);
  }
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize chart
  initTreeChart();
  
  // Set up search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(this.value);
      }, 300);
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', function(event) {
      if (!event.target.closest('#searchContainer')) {
        document.getElementById('searchResults').style.display = 'none';
      }
    });
  }
  
  // Initialize dark mode from localStorage
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    if (document.getElementById('darkModeToggle')) {
      document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
  }
  
  // Set up dark mode toggle
  const darkModeBtn = document.getElementById('darkModeToggle');
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', toggleDarkMode);
  }
  
  // Set up zoom controls
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const resetZoomBtn = document.getElementById('resetZoom');
  
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', function() {
      if (myChart) {
        const option = myChart.getOption();
        myChart.setOption({
          series: [{
            zoom: 1.2
          }]
        }, {replaceMerge: ['series']});
      }
    });
  }
  
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', function() {
      if (myChart) {
        const option = myChart.getOption();
        myChart.setOption({
          series: [{
            zoom: 0.8
          }]
        }, {replaceMerge: ['series']});
      }
    });
  }
  
  if (resetZoomBtn) {
    resetZoomBtn.addEventListener('click', function() {
      if (myChart) {
        myChart.dispatchAction({
          type: 'restore'
        });
      }
    });
  }
  
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});