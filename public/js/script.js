// Global variables
let myChart;
let chartData;
let searchTimeout;
const categories = new Set();
let currentViewMode = 'tree'; // Track current view mode
let showLabels = true; // Track label visibility

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
      
      // Initialize view mode controls
      initViewModeControls();
    })
    .catch(error => {
      console.error('Error loading data:', error);
      document.getElementById('loading').style.display = 'none';
      document.getElementById('errorMessage').textContent = 'Failed to load data. Please try again later.';
      document.getElementById('errorMessage').style.display = 'block';
    });
}

// Initialize view mode controls
function initViewModeControls() {
  // Tree view mode button
  document.getElementById('treeViewMode').addEventListener('click', function(e) {
    e.preventDefault();
    if (currentViewMode !== 'tree') {
      currentViewMode = 'tree';
      animateViewChange(chartData);
    }
  });
  
  // Radial view mode button
  document.getElementById('radialViewMode').addEventListener('click', function(e) {
    e.preventDefault();
    if (currentViewMode !== 'radial') {
      currentViewMode = 'radial';
      animateViewChange(chartData);
    }
  });
  
  // Toggle labels button
  document.getElementById('toggleLabels').addEventListener('click', function(e) {
    e.preventDefault();
    showLabels = !showLabels;
    updateChartLabels();
  });
}

// Animate the transition between view modes with improved animation
function animateViewChange(data) {
  if (!myChart) return;
  
  // Create transition effect
  document.getElementById('treeChart').classList.add('chart-transition');
  
  // Apply fade out effect
  myChart.getDom().style.opacity = 0;
  
  // Create visual effect for transition
  const animContainer = document.createElement('div');
  animContainer.className = 'chart-animation-container';
  document.getElementById('treeChartContainer').appendChild(animContainer);
  
  // Wait for fade out to complete
  setTimeout(() => {
    // Render with new view mode
    renderChart(data);
    
    // Fade back in
    myChart.getDom().style.opacity = 1;
    
    // Remove animation container
    setTimeout(() => {
      document.getElementById('treeChartContainer').removeChild(animContainer);
      document.getElementById('treeChart').classList.remove('chart-transition');
    }, 800);
  }, 400);
}

// Update chart labels based on showLabels setting
function updateChartLabels() {
  if (!myChart) return;
  
  myChart.setOption({
    series: [{
      label: {
        show: showLabels
      }
    }]
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
  
  // Add spacing properties to nodes
  function addSpacingProperties(node, depth = 0) {
    // Set node-specific spacing properties
    node.spacing = {
      horizontal: 50 + (depth * 10), // Increase spacing with depth
      vertical: 40
    };
    
    // Process children recursively
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => addSpacingProperties(child, depth + 1));
    }
  }
  
  // Apply spacing properties
  addSpacingProperties(data);
  return data;
}

// Render the chart with the given data
function renderChart(data) {
  const container = document.getElementById('treeChart');
  
  // If chart already exists, dispose it
  if (myChart) {
    myChart.dispose();
  }
  
  myChart = echarts.init(container, null, { renderer: 'canvas' });

  // Common options for both view modes
  const commonOptions = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(40, 44, 52, 0.85)',
      borderColor: '#00ff00',
      borderWidth: 2,
      textStyle: {
        color: '#fff',
        fontSize: 13
      },
      padding: 15,
      confine: true
    },
    toolbox: {
      feature: {
        restore: {
          title: 'Reset View'
        },
        saveAsImage: {
          title: 'Save as Image',
          pixelRatio: 2
        }
      },
      iconStyle: {
        color: '#00ff00',
        borderColor: '#00ff00'
      },
      right: 20,
      top: 20
    }
  };

  // View-specific options
  let viewSpecificOptions;
  
  if (currentViewMode === 'tree') {
    viewSpecificOptions = {
      series: [{
        type: 'tree',
        data: [data],
        symbol: 'rect',
        symbolSize: [200, 50],  // Increased rectangle size
        top: '8%',
        left: '15%',  // More left margin
        bottom: '8%',
        right: '25%',  // More right margin
        layout: 'orthogonal',
        orient: 'LR',
        nodePadding: 50,  // Increased node padding
        itemStyle: {
          borderRadius: 12,
          borderColor: '#00ff00',
          shadowColor: 'rgba(0, 255, 0, 0.2)',
          shadowBlur: 5
        },
        lineStyle: {
          color: '#00ff00',
          width: 1.2,
          curveness: 0.5,
          shadowColor: 'rgba(0, 255, 0, 0.3)',
          shadowBlur: 5,
          opacity: 0.7
        },
        label: {
          show: showLabels,
          color: '#fff',
          position: 'inside',
          verticalAlign: 'middle',
          align: 'center',
          fontSize: 12,  // Larger font
          fontWeight: 'bold',
          formatter: function(params) {
            const name = params.data.originalName || params.data.name.substring(2).trim();
            return name.length > 20 ? name.substring(0, 18) + '...' : name;
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
            shadowBlur: 15,
            shadowColor: 'rgba(0, 255, 0, 0.7)'
          },
          lineStyle: {
            width: 2.5,
            color: '#0f0'
          }
        },
        initialTreeDepth: 1,
        roam: true,
        expandAndCollapse: true,
        animationDuration: 750,
        animationDurationUpdate: 750,
        animationEasing: 'elasticOut',
      }]
    };
  } else {
    // Radial view options
    viewSpecificOptions = {
      series: [{
        type: 'tree',
        data: [data],
        symbol: 'circle',
        symbolSize: 30,  // Larger circles
        initialTreeDepth: 1,
        layout: 'radial',
        top: '5%',
        left: '10%',  // More left space
        bottom: '5%',
        right: '10%',  // More right space
        roam: true,
        nodeGap: 30,  // Increased node gap
        edgeShape: 'curve',
        edgeForkPosition: '70%',
        label: {
          show: showLabels,
          position: 'right',
          verticalAlign: 'middle',
          align: 'left',
          fontSize: 12,
          color: '#fff',
          distance: 10,  // Increased distance
          formatter: function(params) {
            const displayName = params.data.originalName || params.data.name.substring(2).trim();
            return displayName.length > 18 ? displayName.substring(0, 16) + '...' : displayName;
          },
          backgroundColor: 'rgba(30, 30, 30, 0.7)',
          padding: [4, 7],
          borderRadius: 4
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
            distance: 10  // Increased distance
          }
        },
        emphasis: {
          focus: 'descendant',
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(0, 255, 0, 0.7)'
          },
          lineStyle: {
            width: 2,
            color: '#0f0'
          }
        },
        expandAndCollapse: true,
        animationDuration: 750,
        animationDurationUpdate: 750,
        animationEasing: 'elasticOut',
        itemStyle: {
          color: function(params) {
            return params.data.itemStyle ? params.data.itemStyle.color : '#555';
          },
          borderWidth: 2.5,
          borderColor: '#00ff00',
          shadowColor: 'rgba(0, 255, 0, 0.2)',
          shadowBlur: 5
        },
        lineStyle: {
          color: 'rgba(0, 255, 0, 0.6)',
          width: 1.5,
          curveness: 0.5,
          opacity: 0.7
        }
      }]
    };
  }

  // Merge options
  const option = { ...commonOptions, ...viewSpecificOptions };
  
  // Apply options with animation
  myChart.setOption(option);

  // Update zoom indicator
  updateZoomIndicator(1.0);

  // Resize handler with debounce for performance
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      myChart.resize();
    }, 100);
  });

  // Event listener for node click
  myChart.on('click', function(params) {
    if (!params.data.children) { // It's a leaf node
      showNodeInfo(params.data);
    }
  });
  
  // Listen for zoom changes to update the zoom indicator
  myChart.on('datazoom', function(params) {
    const zoom = myChart.getOption().series[0].zoom || 1;
    updateZoomIndicator(zoom);
  });

  // Add visual effect when nodes expand/collapse
  myChart.on('treeExpandChange', function() {
    setTimeout(() => {
      // Create a subtle glow effect on relevant nodes
      const glowEffect = document.createElement('div');
      glowEffect.className = 'glow-effect';
      container.appendChild(glowEffect);
      
      // Remove the glow effect after animation
      setTimeout(() => {
        container.removeChild(glowEffect);
      }, 500);
    }, 300);
  });
}

// Update zoom indicator
function updateZoomIndicator(zoom) {
  const indicator = document.getElementById('zoomIndicator');
  if (indicator) {
    indicator.querySelector('.zoom-level').textContent = `${zoom.toFixed(1)}x`;
  }
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
    const cleanName = node.originalName || node.name.substring(2).trim();

    // Add all nodes to search index, not just leaf nodes
    searchIndex.push({
      name: cleanName,
      path: currentPath.map(p => p.substring(2).trim()).join(' > '),
      url: node.url,
      description: node.description,
      nodeRef: node,
      hasChildren: node.children && node.children.length > 0
    });
    
    // Process children recursively
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child, currentPath));
    }
  }

  traverse(data);

  // Attach search index to window for easy access
  window.searchIndex = searchIndex;
}

// Search function
function performSearch(query) {
  const searchResults = document.getElementById('searchResults');
  const searchInput = document.getElementById('searchInput');
  
  // Clear results if query is empty or too short
  if (!query || query.length < 2) {
    searchResults.innerHTML = '';
    searchResults.style.display = 'none';
    return;
  }

  query = query.toLowerCase().trim();

  // Filter search index
  const results = window.searchIndex.filter(item => 
    item.name.toLowerCase().includes(query) || 
    (item.description && item.description.toLowerCase().includes(query))
  ).slice(0, 10); // Limit to top 10 results

  // If no results found
  if (results.length === 0) {
    searchResults.innerHTML = '<p class="text-center p-3 text-muted">No results found</p>';
    searchResults.style.display = 'block';
    return;
  }

  // Build results HTML
  let resultHTML = '';
  results.forEach(result => {
    const iconClass = result.hasChildren ? 'fa-folder' : 'fa-link';
    
    resultHTML += `
      <div class="search-result" data-node-id="${encodeURIComponent(JSON.stringify(result.nodeRef))}">
        <h6><i class="fas ${iconClass} me-2"></i>${result.name}</h6>
        <small class="text-muted d-block mb-1">${result.path}</small>
        ${result.description ? 
          `<p class="small mb-0">${result.description.length > 100 ? 
            result.description.substring(0, 100) + '...' : 
            result.description}</p>` : 
          ''}
      </div>
    `;
  });

  searchResults.innerHTML = resultHTML;
  searchResults.style.display = 'block';

  // Add click event listeners to search results
  document.querySelectorAll('.search-result').forEach(item => {
    item.addEventListener('click', function() {
      try {
        const nodeData = JSON.parse(decodeURIComponent(this.getAttribute('data-node-id')));
        if (nodeData) {
          // If it's a leaf node, show info modal
          if (!nodeData.children || nodeData.children.length === 0) {
            showNodeInfo(nodeData);
          } else {
            // If it's a parent node, highlight and expand it in the chart
            highlightNode(nodeData);
          }
          
          // Clear search
          searchInput.value = '';
          searchResults.style.display = 'none';
        }
      } catch (error) {
        console.error('Error processing search result:', error);
      }
    });
  });
}

// Highlight and navigate to a node in the chart
function highlightNode(nodeData) {
  if (!myChart) return;
  
  // First, find the node path to expand all parent nodes
  let nodePath = [];
  
  function findNodePath(node, target, currentPath = []) {
    if (node.originalName === target.originalName) {
      nodePath = [...currentPath, node.originalName];
      return true;
    }
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (findNodePath(child, target, [...currentPath, node.originalName])) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  findNodePath(chartData, nodeData);
  
  // Expand all nodes in the path
  myChart.dispatchAction({
    type: 'treeExpandToNode',
    seriesIndex: 0,
    dataIndex: nodePath.join('/')
  });
  
  // Highlight the node
  myChart.dispatchAction({
    type: 'highlight',
    seriesIndex: 0,
    dataIndex: nodePath.join('/')
  });
  
  // Center view on the node
  myChart.dispatchAction({
    type: 'focusNodeAdjacency',
    seriesIndex: 0,
    dataIndex: nodePath.join('/')
  });
}

// Initialize category filter (Dropdown with checkboxes)
function initCategoryFilter() {
  const filterDropdownMenu = document.getElementById('categoryFilter');

  if (!filterDropdownMenu) return;

  filterDropdownMenu.innerHTML = ''; // Clear existing content

  // Add "Select All" option
  const selectAllItem = document.createElement('li');
  selectAllItem.innerHTML = `
    <div class="form-check form-check-inline m-2">
      <input class="form-check-input" type="checkbox" id="filter-all" checked>
      <label class="form-check-label text-light" for="filter-all">All</label>
    </div>
  `;
  filterDropdownMenu.appendChild(selectAllItem);

  // Add each category as a checkbox in the dropdown menu
  categories.forEach(category => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <div class="form-check form-check-inline m-2">
        <input class="form-check-input filter-category" type="checkbox" id="filter-${category}" checked>
        <label class="form-check-label text-light" for="filter-${category}">${category}</label>
      </div>
    `;
    filterDropdownMenu.appendChild(listItem);
  });

  // Prevent the dropdown from closing when clicking inside
  filterDropdownMenu.addEventListener('click', function(event) {
    event.stopPropagation();
  });

  // Add event listeners for filtering
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
  // Get selected categories from the dropdown checkboxes
  const selectedCategories = [...document.querySelectorAll('#categoryFilter .filter-category:checked')].map(cb =>
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

// Update view mode controls initialization
function initViewModeControls() {
  const treeViewBtn = document.getElementById('treeViewMode');
  const radialViewBtn = document.getElementById('radialViewMode');
  const toggleLabelsBtn = document.getElementById('toggleLabels');
  
  // Set initial active state
  treeViewBtn.classList.add('active-view-mode');
  
  // Tree view mode button
  treeViewBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (currentViewMode !== 'tree') {
      currentViewMode = 'tree';
      
      // Update active state
      radialViewBtn.classList.remove('active-view-mode');
      treeViewBtn.classList.add('active-view-mode');
      
      // Show transition message
      showTransitionMessage('Switching to Tree View');
      
      // Animate view change
      animateViewChange(chartData);
    }
  });
  
  // Radial view mode button
  radialViewBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (currentViewMode !== 'radial') {
      currentViewMode = 'radial';
      
      // Update active state
      treeViewBtn.classList.remove('active-view-mode');
      radialViewBtn.classList.add('active-view-mode');
      
      // Show transition message
      showTransitionMessage('Switching to Radial View');
      
      // Animate view change
      animateViewChange(chartData);
    }
  });
  
  // Toggle labels button
  toggleLabelsBtn.addEventListener('click', function(e) {
    e.preventDefault();
    showLabels = !showLabels;
    
    // Show transition message
    showTransitionMessage(showLabels ? 'Showing Labels' : 'Hiding Labels');
    
    // Update chart labels
    updateChartLabels();
  });
}

// Show a temporary transition message
function showTransitionMessage(message) {
  // Create message element if it doesn't exist
  let transitionMsg = document.getElementById('transitionMessage');
  if (!transitionMsg) {
    transitionMsg = document.createElement('div');
    transitionMsg.id = 'transitionMessage';
    document.getElementById('treeChartContainer').appendChild(transitionMsg);
  }
  
  // Set message and show
  transitionMsg.textContent = message;
  transitionMsg.classList.add('show');
  
  // Hide after timeout
  setTimeout(() => {
    transitionMsg.classList.remove('show');
  }, 1500);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize chart
  initTreeChart();

  // Set up search functionality
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  
  if (searchInput) {
    // Add event listener for input changes with debounce
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(this.value);
      }, 300);
    });
    
    // Clear search when ESC key is pressed
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        this.value = '';
        searchResults.style.display = 'none';
      }
    });
    
    // Focus search on Ctrl+F or Cmd+F (prevent default browser search)
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  // Close search results when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('#searchContainer')) {
      if (searchResults) {
        searchResults.style.display = 'none';
      }
    }
  });

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
  const expandAllBtn = document.getElementById('expandAll');
  const collapseAllBtn = document.getElementById('collapseAll');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', function() {
      if (myChart) {
        const option = myChart.getOption();
        const currentZoom = (option.series && option.series[0] && option.series[0].zoom) !== undefined ? option.series[0].zoom : 1;
        myChart.setOption({
          series: [{
            zoom: currentZoom * 1.2
          }]
        });
      }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', function() {
      if (myChart) {
        const option = myChart.getOption();
        const currentZoom = (option.series && option.series[0] && option.series[0].zoom) !== undefined ? option.series[0].zoom : 1;
        myChart.setOption({
          series: [{
            zoom: currentZoom * 0.8
          }]
        });
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
  
  // Expand all nodes
  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', function() {
      if (myChart) {
        myChart.setOption({
          series: [{
            initialTreeDepth: -1 // Expand all levels
          }]
        });
      }
    });
  }
  
  // Collapse all nodes except root
  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', function() {
      if (myChart) {
        myChart.setOption({
          series: [{
            initialTreeDepth: 1 // Only show first level
          }]
        });
      }
    });
  }

  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Initialize view mode controls
  initViewModeControls();
});