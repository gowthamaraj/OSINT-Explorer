   // Assuming ECharts is already included in your HTML
   
   // Function to initialize the ECharts tree chart
   function initTreeChart() {
    // Load the data from data.json
    fetch('data.json')
      .then(response => response.json())
      .then(data => {
        // Initialize the chart
        var myChart = echarts.init(document.getElementById('treeChart'));
        var option = {
          tooltip: {
            trigger: 'item',
            triggerOn: 'click',
            formatter: function (params) {
              const data = params.data;
              let tooltipContent = `Name: ${data.name}`;
              if (data.url) {
                tooltipContent += `<br>URL: <a href="${data.url}" target="_blank">${data.url}</a>`;
              }
              if (data.description) {
                tooltipContent += `<br>Description: ${data.description}`;
              }
              return tooltipContent;
            }
          },
          series: [
            {
              type: 'tree',
              data: [data],
              symbol: 'diamond',
              top: '1%',
              left: '7%',
              bottom: '1%',
              right: '10%',
              symbolSize: 10,
              label: {
                color: '#FFA500',
                position: 'left',
                verticalAlign: 'middle',
                align: 'right',
                fontSize: 9
              },
              leaves: {
                label: {
                  position: 'right',
                  verticalAlign: 'middle',
                  align: 'left'
                }
              },
              emphasis: {
                focus: 'descendant'
              },
              itemStyle: {
                color: '	#00ff00', // Node color
                borderColor: '#c23531', // Node border color
            },
            lineStyle: {
                color: '#aaa', // Link color
                type: 'solid' // Link style (solid, dashed, or dotted)
            },
              expandAndCollapse: true,
              animationDuration: 550,
              animationDurationUpdate: 750
            }
          ]
        };
        myChart.setOption(option);
      });
  }
  
  // Call the function to initialize the chart
  initTreeChart();