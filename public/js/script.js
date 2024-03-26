   // Assuming ECharts is already included in your HTML
   function preprocessData(data) {
    function assignColorAndEmoji(node) {
      const emojis = ['💻', '👾', '🔒', '🕵️‍♂️', '🔑']; // List of cyber emojis
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]; // Select a random emoji
      if (node.children && node.children.length > 0) {
        node.itemStyle = { color: '#555', borderRadius: 10 }; // Color and rounded corners for nodes with children
        node.name = `${randomEmoji} ${node.name}`; // Prepend emoji to node name
        node.children.forEach(assignColorAndEmoji); // Recursively apply to children
      } else {
        node.itemStyle = { color: '#8ca0ff', borderRadius: 10 }; // Color and rounded corners for leaf nodes
        node.name = `${randomEmoji} ${node.name}`; // Prepend emoji to node name
      }
    }
  
    assignColorAndEmoji(data);
    return data;
  }

   function initTreeChart() {
    fetch('data.json')
      .then(response => response.json())
      .then(rawData => {
        const data = preprocessData(rawData);
        var myChart = echarts.init(document.getElementById('treeChart'));
        var option = {
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
              label: {
                color: '#00ff00',
                position: 'inside',
                verticalAlign: 'middle',
                align: 'center',
                fontSize: 9,
                formatter: function(params) {
                  return params.data.name;
                }
              },
              leaves: {
                label: {
                  position: 'inside',
                  verticalAlign: 'middle',
                  align: 'center',
                  color: '#00ff00',
                }
              },
              emphasis: {
                focus: 'descendant'
              },
              itemStyle: {
                borderRadius: 10,
                color: function(params) {
                  if (params.data.children && params.data.children.length > 0) {
                    return '#555';
                  } else {
                    return '#8ca0ff';
                  }
                },
                borderColor: '#00ff00',
              },
              lineStyle: {
                color: '#00ff00',
                type: 'solid'
              },
              roam: true,
              expandAndCollapse: true,
              initialTreeDepth: 0,
              animationDuration: 550,
              animationDurationUpdate: 750
            }
          ],
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 100,
              zoomOnMouseWheel: true,
              moveOnMouseMove: true,
              preventDefaultMouseMove: false
            }
          ]
        };
        myChart.setOption(option);

        // Event listener for node click
        myChart.on('click', function (params) {
          if (!params.data.children) { // It's a leaf node
            const nodeData = params.data;
            const modalTitle = document.getElementById('nodeInfoModalLabel');
            const modalBody = document.getElementById('nodeInfoContent');
            modalTitle.innerHTML = `Node Information: ${nodeData.name}`;
            modalBody.innerHTML = `
              <p><strong>Name:</strong> ${nodeData.name}</p>
              ${nodeData.url ? `<p><strong>URL:</strong> <a href="${nodeData.url}" target="_blank">${nodeData.url}</a></p>` : ''}
              ${nodeData.description ? `<p><strong>Description:</strong> ${nodeData.description}</p>` : ''}
            `;
            // Show the modal
            new bootstrap.Modal(document.getElementById('nodeInfoModal')).show();
          }
        });

        // Close modal when clicked outside or on the close button
        document.getElementById('nodeInfoModal').addEventListener('click', function(event) {
          if (event.target.classList.contains('btn-close') || !event.target.closest('.modal-content')) {
            bootstrap.Modal.getInstance(document.getElementById('nodeInfoModal')).hide();
          }
        });
      });
  }
  
  initTreeChart();
