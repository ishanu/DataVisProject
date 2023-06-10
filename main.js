
var margin = { top: 30, right: 30, bottom: 30, left: 30 };



var city_color = d3.scaleOrdinal() // D3 Version 4
  .domain(["Boston", "Chicago", "New York", "San Francisco"])
  .range(["#2773b4", "#fd7d17", "#438e3e", "#c02e35"]);
var alt_color = d3.scaleOrdinal() // D3 Version 4
  .domain(["Boston", "Chicago", "New York", "San Francisco"])
  .range(["#7DABD2", "#FEB174", "#8EBB8B", "#D98286"]);

var donut_color;

var donut_color_map = new Map();
donut_color_map.set("Boston", ["#2368a2", "#1f5c90", "#1b517e", "#17456c", "#143a5a", "#102e48", "#0c2236", "#081724"]);
donut_color_map.set("Chicago", ["#e47115", "#ca6412", "#b15810", "#984b0e", "#7f3f0c", "#653209", "#4c2507", "#331905"]);
donut_color_map.set("New York", ["#3c8038", "#367232", "#2f632b", "#285525", "#22471f", "#1b3919", "#142b13", "#0d1c0c"]);
donut_color_map.set("San Francisco", ["#ad2930", "#9a252a", "#862025", "#731c20", "#60171b", "#4d1215", "#3a0e10", "#26090b"]);


var divToolTipDonut;

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function () {
  return this.each(function () {
    var firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};

//histogram variables
var svg;
var xAxisHistogram;
var yAxisHistogram;
var innerHeightHistogram;
var innerWidthHistogram;
var marginHistograms = { top: 20, right: 20, bottom: 40, left: 40 };
var g;
var svgHeatMap;
var xAxisHM;
var yAxisHM;


//heatmap variables

var widthHM;
var heightHM;
var divToolTipHM;

var dataHM;
var officerId = [];
var crimesHM = [];


//scatter plot variables
var scatter_plot_data;
var labelFlags;
var svgSP;
var xScaleSP;
var yScaleSP;
var isUpdated = false;
var innerWidthSP;
var innerHeightSP;

//dandelion variables
var bostonCrimeDataMap = new Map();
var chicagoCrimeDataMap = new Map();
var newYorkCrimeDataMap = new Map();
var sanFranciscoCrimeDataMap = new Map();
var divToolTipDL;
var maxCrimes = 0;
var dandelion_mode = true;




//var stacked radar path variables
var radarCentreX, radarCentreY;
var totalCrimeBoston = 0;
var maxPathLengthRadar;
var totalCrimeInEachCity = 0;
var legendsInfoMap = new Map();

var locationBasedCrimeDetailsMap = new Map();
var prevCrimeMap = new Map();
function resetPrevCrimeMap() {
  prevCrimeMap.set("Larceny", 0);
  prevCrimeMap.set("Vandalism", 0);
  prevCrimeMap.set("Drug abuse", 0);
  prevCrimeMap.set("Assault", 0);
  prevCrimeMap.set("Homicide", 0);
}

var stacked_radar_tracker = 0;
var svgRadar;




document.addEventListener('DOMContentLoaded', function () {
  //adding tooltip div
  divToolTipHM = d3.select("body").append("div")
    .attr("class", "tooltipHM")
    .style("opacity", 0);

  divToolTipDL = d3.select("body").append("div")
    .attr("class", "tooltipDL")
    .style("opacity", 0);

  divToolTipDonut = d3.select("body").append("div")
    .attr("class", "tooltipDonut")
    .style("opacity", 0);


  loadHistogram();
  loadHeatMapData();
  loadScatterPlot();
  loadDandelions();

  var loading = document.getElementById("loading");
  loading.style.display = "none";
  document.querySelector('.apply').addEventListener('click', (e) => {
    // Do whatever you want
    var apply = document.getElementById("apply-button");
    apply.style.display = "none";
    loading.style.display = "block";
    const val = document.querySelectorAll(`input[type='range']`);
    data = {
      "Larceny": +val[0].value,
      "Vandalism": +val[1].value,
      "Homicide": +val[2].value,
      "Drug abuse": +val[3].value,
      "Assault": +val[4].value
    };

    fetch("http://localhost:5000/api/update_severity", {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(
        data => {
          apply.style.display = "block";
          loading.style.display = "none";
          dataHM = data["heatmap"];
          svgHeatMap.selectAll('.heatmap-cell').transition().style("opacity", 0).remove();
          appendHeatmapSpots(dataHM);
          scatter_plot_data = data["scatterplot"];
          isUpdated = true;
          applyScatterPlotTransition(scatter_plot_data);
          isUpdated = false;
        }
      );
  });
});





//load historgram
function loadHistogram() {
  fetch('http://localhost:5000/api/histogram')
    .then((response) => response.json())
    .then((data) => {
      drawHistogram("histogram1", data["Larceny"], data["Larceny_average"]);
      svg.append("text").attr("x", 15).attr("y", 10).text("Larceny").style("font-size", "12.5px").attr("alignment-baseline", "middle");
      drawHistogram("histogram2", data["Vandalism"], data["Vandalism_average"]);
      svg.append("text").attr("x", 15).attr("y", 10).text("Vandalism").style("font-size", "12.5px").attr("alignment-baseline", "middle");
      drawHistogram("histogram3", data["Homicide"], data["Homicide_average"]);
      svg.append("text").attr("x", 15).attr("y", 10).text("Homicide").style("font-size", "12.5px").attr("alignment-baseline", "middle");
      drawHistogram("histogram4", data["Drug abuse"], data["Drug abuse_average"]);
      svg.append("text").attr("x", 15).attr("y", 10).text("Drug Abuse").style("font-size", "12.5px").attr("alignment-baseline", "middle");
      drawHistogram("histogram5", data["Assault"], data["Assault_average"]);
      svg.append("text").attr("x", 15).attr("y", 10).text("Assault").style("font-size", "12.5px").attr("alignment-baseline", "middle");
    });

}

//draw histogram
function drawHistogram(id, data, severity_score) {
  console.log(id);
  var margin = { top: 30, right: 10, bottom: 10, left: 10 },
    width = parseInt(d3.select('.histograms').style('width').replace("px", '')) - margin.left - margin.right,
    height = parseInt(d3.select('.histograms').style('height').replace("px", '')) - margin.top - margin.bottom;

  svg = d3.select(`#${id}`)
  // width = 260;
  // height = 190;

  var innerHeight = height - marginHistograms.top - marginHistograms.bottom;
  var innerWidth = width - marginHistograms.left - marginHistograms.right;
  innerHeightHistogram = innerHeight;
  innerWidthHistogram = innerWidth;
  g = svg.append("g").attr("transform", `translate(${marginHistograms.left},${marginHistograms.top})`);

  //.attr("transform","translate()");


  xAxisHistogram = d3.scaleBand()
    .range([0, innerWidth])
    .domain(Object.keys(data));

  yAxisHistogram = d3.scaleLinear()
    .domain([0, Math.max(...Object.values(data))])
    .range([innerHeight, 0]);

  g.append('g')
    .attr("id", "y-axis")
    .attr("transform", `translate(0,0)`)
    .call(d3.axisLeft(yAxisHistogram).ticks(5));


  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xAxisHistogram).tickFormat("").tickValues([]));

  g.selectAll(".mybar")
    .data(Object.entries(data))
    .enter()
    .append("rect")
    .attr("class", "myBar")
    .attr("x", function (d) { return xAxisHistogram(d[0]); })
    .attr("y", function (d) { return yAxisHistogram(d[1]); })
    .attr("width", xAxisHistogram.bandwidth() - 2)
    .attr("height", function (d) { return innerHeight - yAxisHistogram(d[1]); })
    .attr("fill", "#4b7ea7")


  const barchart_width = xAxisHistogram.bandwidth();
  document.getElementById(id + "slider").value = parseInt(Math.floor(severity_score));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 180)
    .style("text-anchor", "middle")
    .text("Severity Score")
    .style("font-size", "12px");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -75)
    .attr("y", 14)
    .style("text-anchor", "middle")
    .text("No. of ratings")
    .style("font-size", "12px");

  var pos = document.getElementById("histogram1slider").value;
  var LID = id + 'line';
  g.append("line")
    .attr("x1", xAxisHistogram(`${parseInt(Math.floor(severity_score))}`) + (severity_score % 1.0) * barchart_width)
    .attr("y1", 0)
    .attr("x2", xAxisHistogram(`${parseInt(Math.floor(severity_score))}`) + (severity_score % 1.0) * barchart_width)
    .attr("y2", innerHeight)
    .attr("stroke", "black")
    .attr("opacity", 1)
    .attr("id", LID);

  var ID = id + "circle";
  g.append("circle")
    .attr("cx", xAxisHistogram(`${parseInt(Math.floor(severity_score))}`) + (severity_score % 1.0) * barchart_width)
    .attr("cy", innerHeight)
    .attr("r", "5")
    .attr("id", ID)
    .style("fill", "#c36e6f");

  var TID = id + "text";
  g.append("text")
    .attr("id", TID)
    .attr("x", xAxisHistogram(`${parseInt(Math.floor(severity_score))}`) + (severity_score % 1.0) * barchart_width)
    .attr("y", innerHeight + 15)
    .text(severity_score)
    .attr("dx", "-0.3em")
    .style("fill", "black")
    .style("font-size", "10px")
    .style("font-style", "arial")

}

function h1circle() {
  var pos = document.getElementById("histogram1slider").value;
  d3.select('#histogram1')
    .selectAll("circle")
    .transition()
    .duration(100)
    .attr("cx", xAxisHistogram(pos))
    .attr("cy", innerHeightHistogram);

  d3.selectAll('#histogram1line')
    .transition()
    .duration(100)
    .attr("x1", xAxisHistogram(pos))
    .attr("y1", 0)
    .attr("x2", xAxisHistogram(pos))
    .attr("y2", innerHeightHistogram)

  d3.selectAll('#histogram1text')
    .transition()
    .duration(100)
    .attr("x", xAxisHistogram(pos))
    .attr("y", innerHeightHistogram + 15)
    .text(pos);
}

function h2circle() {
  var pos = document.getElementById("histogram2slider").value;
  d3.select("#histogram2")
    .selectAll("circle")
    .transition()
    .duration(100)
    .attr("cx", xAxisHistogram(pos))
    .attr("cy", innerHeightHistogram);

  d3.selectAll('#histogram2line')
    .transition()
    .duration(100)
    .attr("x1", xAxisHistogram(pos))
    .attr("y1", 0)
    .attr("x2", xAxisHistogram(pos))
    .attr("y2", innerHeightHistogram)

  d3.selectAll('#histogram2text')
    .transition()
    .duration(100)
    .attr("x", xAxisHistogram(pos))
    .attr("y", innerHeightHistogram + 15)
    .text(pos);
}

function h3circle() {
  var pos = document.getElementById("histogram3slider").value;
  d3.select("#histogram3")
    .selectAll("circle")
    .transition()
    .duration(100)
    .attr("cx", xAxisHistogram(pos))
    .attr("cy", innerHeightHistogram);

  d3.selectAll('#histogram3line')
    .transition()
    .duration(100)
    .attr("x1", xAxisHistogram(pos))
    .attr("y1", 0)
    .attr("x2", xAxisHistogram(pos))
    .attr("y2", innerHeightHistogram);

  d3.selectAll('#histogram3text')
    .transition()
    .duration(100)
    .attr("x", xAxisHistogram(pos))
    .attr("y", innerHeightHistogram + 15)
    .text(pos);
}

function h4circle() {
  var pos = document.getElementById("histogram4slider").value;
  d3.select("#histogram4")
    .selectAll("circle")
    .transition()
    .duration(100)
    .attr("cx", xAxisHistogram(pos))
    .attr("cy", innerHeightHistogram);

  d3.selectAll('#histogram4line')
    .transition()
    .duration(100)
    .attr("x1", xAxisHistogram(pos))
    .attr("y1", 0)
    .attr("x2", xAxisHistogram(pos))
    .attr("y2", innerHeightHistogram)

  d3.selectAll('#histogram4text')
    .transition()
    .duration(100)
    .attr("x", xAxisHistogram(pos))
    .attr("y", innerHeightHistogram + 15)
    .text(pos);
}

function h5circle() {
  var pos = document.getElementById("histogram5slider").value;
  d3.select("#histogram5")
    .selectAll("circle")
    .transition()
    .duration(100)
    .attr("cx", xAxisHistogram(pos))
    .attr("cy", innerHeightHistogram);

  d3.selectAll('#histogram5line')
    .transition()
    .duration(100)
    .attr("x1", xAxisHistogram(pos))
    .attr("y1", 0)
    .attr("x2", xAxisHistogram(pos))
    .attr("y2", innerHeightHistogram);

  d3.selectAll('#histogram5text')
    .transition()
    .duration(100)
    .attr("x", xAxisHistogram(pos))
    .attr("y", innerHeightHistogram + 15)
    .text(pos);
}


//load heatmap
function loadHeatMapData() {
  fetch("http://localhost:5000/api/heatmap")
    .then(response => response.json())
    .then(
      data => {
        dataHM = data;
        drawHeatMap();
      }
    );
}

//draw heatmap
function drawHeatMap() {

  var marginHM = { top: 100, right: 150, bottom: 30, left: 200 },
    widthHM = parseInt(d3.select('#heat-matrix-container').style('width').replace("px", ''));
  heightHM = parseInt(d3.select('#heat-matrix-container').style('height').replace("px", ''));
  innerWidthHM = widthHM - marginHM.left - marginHM.right
  innerHeightHM = heightHM - marginHM.top - marginHM.bottom;

  // console.log(`width${d3.select('#heat-matrix-container').style('width')}`)
  // append the svg object to the body of the page

  svgHeatMap = d3.select("#heat-matrix")
    .attr("width", widthHM)
    .attr("height", heightHM)
    .append("g")
    .attr("width", innerWidthHM)
    .attr("height", innerHeightHM)
    .attr("transform",
      "translate(" + marginHM.left + "," + marginHM.top + ")");

  // Build X scales and axis:
  dataHM["officer_score"].forEach(ele => {
    officerId.push(ele["id"]);
  });

  xAxisHM = d3.scaleBand()
    .range([0, innerWidthHM])
    .domain(officerId)
    .padding(0.05);

  dataHM["offense_list"].forEach(ele => {
    crimesHM.push(ele["offense_type"]);
  });

  // Build Y scales and axis:
  yAxisHM = d3.scaleBand()
    .range([innerHeightHM, 0])
    .domain(crimesHM)
    .padding(0.05);


  // draw heatmap
  appendHeatmapSpots(dataHM);


  //adding the row-headers
  const rowData = dataHM["offense_list"];
  const max_case = d3.max(rowData, (d) => d["total_cases"]);
  svgHeatMap.selectAll()
    .data(rowData)
    .enter()
    .append("rect")
    .attr("x", -80)
    .attr("y", (d, i) => {
      return yAxisHM(d.offense_type);
    })
    .attr("width", (d) => {
      return ((d["total_cases"] / max_case) * 70);
    })
    .attr("height", function (d) { return yAxisHM.bandwidth(d.offense_type) })
    // performance score
    .style("fill", "grey")
    .style("stroke", "none")
    .style("opacity", 0.8)

  svgHeatMap.selectAll()
    .data(rowData)
    .enter()
    .append("text")
    .attr("x", innerHeightHM - 330)
    .attr("y", (d, i) => {
      return yAxisHM(d.offense_type);
    })
    .attr("dy", "2.5em")
    .attr("style",
      "font-size:10px; font-weight:500; font-family:sans-serif;")
    .text((d) => {
      return d.offense_type;
    });

  //adding the column-headers
  const column_data = dataHM["officer_score"];
  const max_case_col = d3.max(column_data, (d) => d["normalized_performance_score"]);
  svgHeatMap.selectAll()
    .data(column_data)
    .enter()
    .append("rect")
    .attr("x", (d) => {
      return xAxisHM(d.id);
    })
    .attr("y", (d) => { return (50 - ((d["normalized_performance_score"] / max_case_col) * 50)) - 80; })
    .attr("width", (d) => {
      return xAxisHM.bandwidth(d.id);
    })
    .attr("height", function (d) { return ((d["normalized_performance_score"] / max_case_col) * 50); })
    // performance score
    .style("fill", "grey")
    .style("stroke", "none")
    .style("opacity", 0.8)


  svgHeatMap.selectAll()
    .data(column_data)
    .enter()
    .append("rect")
    .attr('transform', (d, i) => {
      return 'translate( ' + (xAxisHM(d.id) + 8) + ' ,-8 ),' + 'rotate(-50)';
    })
    .attr("width", 25)
    .attr("height", 15)
    .attr("class", "text-id")
    // performance score
    .style("fill", (d) => {
      return city_color(d.location);
    })
    .style("stroke", "none")
    .style("opacity", 1);

  const text_back = d3.selectAll(".text-background")._groups[0];
  text_back.forEach(ele => {
    d3.select(ele).moveToBack();
  }
  );

  svgHeatMap.selectAll()
    .data(column_data)
    .enter()
    .append("text")
    .attr('transform', (d, i) => {
      return 'translate( ' + (xAxisHM(d.id)) + ' ,-18 ),' + 'rotate(-50)';
    })
    .attr("width", 25)
    .attr("height", 15)
    .attr("class", "text-id")
    .attr("dy", "2.5em")
    .attr("style",
      "font-size:10px; font-weight:500; font-family:sans-serif;")
    .text((d) => {
      return d.id;
    }).style("fill", "white")
    .on("click", (d, i) => {
      fetchStackedRadarData(i.location, i.id)
    });
}


function appendHeatmapSpots(dataHM) {
  const data = dataHM["score_list"];

  svgHeatMap.selectAll()
    .data(data, function (d) { return d.id + ':' + d.offense_type; })
    .enter()
    .append("rect")
    .attr("x", function (d) { return xAxisHM(d.id) })
    .attr("y", function (d) { return yAxisHM(d.offense_type) })
    .attr("width", xAxisHM.bandwidth())
    .attr("height", yAxisHM.bandwidth())
    .attr("class", "heatmap-cell")
    // performance score
    .style("fill", function (d) { return d.color })
    .style("stroke-width", 2)
    .style("stroke", "none")
    .style("opacity", 0.8)
    .on('mousemove', function (event, d) {
      divToolTipHM.style("opacity", 1);
      divToolTipHM.html("<strong>Officer: " + d.id + "<br>" +
        "<strong>Score: " + d.offense_score + "<br>" +
        "<strong>Case: " + d.offense_type + "<br>")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 65) + "px");
    })
    .on("mouseout", function (d) {
      divToolTipHM.style("opacity", 0);
    })
    .style('opacity', 0)
    .transition().duration(function (d) {
      return Math.random() * 1000;
    })
    .style("opacity", 1);
}


//load scatter plot
function loadScatterPlot() {
  fetch("http://localhost:5000/api/scatterplot")
    .then(response => response.json())
    .then(
      data => {
        scatter_plot_data = data;
        drawScatterPlot();
      }
    );
}

//draw scatter plot
function drawScatterPlot() {

  var marginSP = { top: 10, right: 60, bottom: 50, left: 60 };
    innerWidthSP = parseInt(d3.select('#scatter-plot-container').style('width').replace("px", '')) - marginSP.left - marginSP.right,
    innerHeightSP = parseInt(d3.select('#scatter-plot-container').style('height').replace("px", '')) - marginSP.top - marginSP.bottom;

  // append the svg object to the body of the page
  svgSP = d3.select("#scatter-plot")
    .attr("width", innerWidthSP + marginSP.left + marginSP.right)
    .attr("height", innerHeightSP + marginSP.top + marginSP.bottom)
    .append("g")
    .attr("transform",
      "translate(" + marginSP.left + "," + marginSP.top + ")");

  // Add X axis
  xScaleSP = d3.scaleLinear()
    .domain([scatter_plot_data["mins"]["x_min"], scatter_plot_data["maxes"]["x_max"]])
    .range([0, innerWidthSP]);
  svgSP.append("g")
    .attr("class", "x-axix-sp")
    .attr("transform", "translate(0," + innerHeightSP + ")")
    .call(d3.axisBottom(xScaleSP));

  // Add Y axis
  yScaleSP = d3.scaleLinear()
    .domain([scatter_plot_data["mins"]["y_min"], scatter_plot_data["maxes"]["y_max"]])
    .range([innerHeightSP, 0]);
  svgSP.append("g")
    .attr("class", "y-axix-sp")
    .call(d3.axisLeft(yScaleSP));

  plotData(svgSP, xScaleSP, yScaleSP, scatter_plot_data["Boston"], "Boston");
  plotData(svgSP, xScaleSP, yScaleSP, scatter_plot_data["Chicago"], "Chicago");
  plotData(svgSP, xScaleSP, yScaleSP, scatter_plot_data["New York"], "New York");
  plotData(svgSP, xScaleSP, yScaleSP, scatter_plot_data["San Francisco"], "San Francisco");

  plotScatterPlotTexts(svgSP, xScaleSP, yScaleSP, scatter_plot_data["Boston"], "Boston");
  plotScatterPlotTexts(svgSP, xScaleSP, yScaleSP, scatter_plot_data["Chicago"], "Chicago");
  plotScatterPlotTexts(svgSP, xScaleSP, yScaleSP, scatter_plot_data["New York"], "New York");
  plotScatterPlotTexts(svgSP, xScaleSP, yScaleSP, scatter_plot_data["San Francisco"], "San Francisco");
  showScatterPlotlabels();
}

function plotData(svgSP, xScale, yScale, data, city) {
  if (!isUpdated) {
    svgSP.append('g')
      .selectAll(`.circle-${city}`)
      .data(data)
      .enter()
      .append("circle")
      .attr("class", `circle-${city}`)
      .attr("cx", function (d) { 
        return xScale(d["x"]); 
      })
      .attr("cy", function (d) { 
        return yScale(d["y"]); 
      })
      .attr("r", 3)
      .style("fill", city_color(city));
  } else {
    svgSP.selectAll(`.circle-${city}`)
      .data(data)
      .transition()
      .duration(1000)
     /* .delay(function (d, i) {
        return i / data.length * 500;
      })*/
      .attr("cx", function (d) { 
        return xScale(d["x"]); 
      })
      .attr("cy", function (d) { 
        return yScale(d["y"]); 
      });
  }
}

function plotScatterPlotTexts(svgSP, xScale, yScale, data, city) {
  if (!isUpdated) {
    svgSP.append('g')
      .selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "labels-sp")
      .attr("id", (d) => { return `${city}-labels-sp-${d["id"]}` })
      .attr("x",
        function (d) {
          return xScale(d["x"]) + 5;
        })
      .attr("y", function (d) { return yScale(d["y"]) + 5; })
      .text(data => data["id"])
      .style("fill", city_color(city))
      .style("font-size", "10px")
  } else {

    data.forEach(d => {
      d3.select(`#${city}-labels-sp-${d["id"]}`)
        .transition()
        .duration(1000)
        .attr("x",
          function (ele) {
            return xScale(d["x"]) + 5;
          })
        .attr("y", function (ele) { 
          return yScale(d["y"]) + 5; 
        })
    })
  }
}

function labelsSPcheck() {
  showScatterPlotlabels();
}

function showScatterPlotlabels() {
  labelFlags = document.getElementById('labelsSP').checked;
  if (labelFlags) {
    d3.selectAll(`.labels-sp`)
      .attr("visibility", "show");
  } else {
    d3.selectAll(`.labels-sp`)
      .attr("visibility", "hidden");
  }
}


function applyScatterPlotTransition(scatter_plot_data) {
  xScaleSP
  .domain([scatter_plot_data["mins"]["x_min"], scatter_plot_data["maxes"]["x_max"]]);
  yScaleSP
    .domain([scatter_plot_data["mins"]["y_min"], scatter_plot_data["maxes"]["y_max"]]);

  svgSP.select(".x-axix-sp")
    .transition()
    .duration(1000)
    .call(d3.axisBottom(xScaleSP));

  // Update Y Axis
  svgSP.select(".y-axix-sp")
    .transition()
    .duration(1000)
    .call(d3.axisLeft(yScaleSP));

  plotData(svgSP, xScaleSP, yScaleSP, scatter_plot_data["Boston"], "Boston");
  plotData(svgSP, xScaleSP, yScaleSP, scatter_plot_data["Chicago"], "Chicago");
  plotData(svgSP, xScaleSP, yScaleSP, scatter_plot_data["New York"], "New York");
  plotData(svgSP, xScaleSP, yScaleSP, scatter_plot_data["San Francisco"], "San Francisco");
  plotScatterPlotTexts(svgSP, xScaleSP, yScaleSP, scatter_plot_data["Boston"], "Boston");
  plotScatterPlotTexts(svgSP, xScaleSP, yScaleSP, scatter_plot_data["Chicago"], "Chicago");
  plotScatterPlotTexts(svgSP, xScaleSP, yScaleSP, scatter_plot_data["New York"], "New York");
  plotScatterPlotTexts(svgSP, xScaleSP, yScaleSP, scatter_plot_data["San Francisco"], "San Francisco");
}

function loadDandelions() {
  fetch("http://localhost:5000/api/dandelion")
    .then(response => response.json())
    .then(
      data => {
        data["Boston"].forEach(ele => {
          bostonCrimeDataMap.set(ele["offense_type"], ele["offense_total"]);
        });
        data["Chicago"].forEach(ele => {
          chicagoCrimeDataMap.set(ele["offense_type"], ele["offense_total"]);
        });
        data["San Francisco"].forEach(ele => {
          sanFranciscoCrimeDataMap.set(ele["offense_type"], ele["offense_total"]);
        });
        data["New York"].forEach(ele => {
          newYorkCrimeDataMap.set(ele["offense_type"], ele["offense_total"]);
        });
        maxCrimes = data["max_offense_total"];
        drawDandelions();
      });
}

function drawDandelions() {
  drawDandelion(bostonCrimeDataMap, "#bostondandelion", "Boston", "boston");
  drawDandelion(chicagoCrimeDataMap, "#chicagodandelion", "Chicago", "chicago");
  drawDandelion(newYorkCrimeDataMap, "#newyorkdandelion", "New York", "new_york");
  drawDandelion(sanFranciscoCrimeDataMap, "#sanfranciscodandelion", "San Francisco", "san_francisco");
}

function drawDandelion(crimeDataMap, svgName, city, id) {


  var marginD = { top: 10, right: 10, bottom: 10, left: 10 };
  var innerWidthD = parseInt(d3.select('.dandelion-svg-holder').style('width').replace("px", '')) - marginD.left - marginD.right;
  var innerHeightD = parseInt(d3.select('.dandelion-svg-holder').style('height').replace("px", '')) - marginD.top - marginD.bottom;

  // append the svg object to the body of the page
  var svgD = d3.select(svgName)
    .attr("width", parseInt(d3.select('.dandelion-svg-holder').style('width').replace("px", '')))
    .attr("height", parseInt(d3.select('.dandelion-svg-holder').style('height').replace("px", '')));

  svgD = svgD.append("g")
    .attr("width", innerWidthD)
    .attr("height", innerHeightD)
    .attr("transform",
      "translate(" + 0 + "," + 0 + ")");

  const maxPathLength = 110;

  var centrePointX = innerWidthD / 2 - 120;
  var centrePointY = innerHeightD / 2;
  var pathLength = ((crimeDataMap.get("Larceny") * 1.0) / maxCrimes) * maxPathLength;

  svgD.append("circle")
    //.style("stroke", "black")
    .attr('class', `${id}-background-circle`)
    .attr("cx", centrePointX)
    .attr("cy", centrePointY)
    .attr("r", maxPathLength + 10)
    .attr("fill", "#eeeeee");

  svgD.append("line")
    .style("stroke", "black")
    .attr("x1", centrePointX)
    .attr("y1", centrePointY)
    .attr("class", `${id}-lines`)
    .attr("x2", getXCoordinate(pathLength, 25, centrePointX))
    .attr("y2", getYCoordinate(pathLength, 25, centrePointY));

  svgD.append("circle")
    .attr('class', `${id}-circles`)
    .attr("r", 5)
    .attr("cx", getXCoordinate(pathLength, 25, centrePointX))
    .attr("cy", getYCoordinate(pathLength, 25, centrePointY))
    .style("fill", city_color(city))
    .on('mousemove', (event, d) => {
      mousemove(event, d, "Larceny", city);
    })
    .on('click', (event, d) => {
      divToolTipDL.style("opacity", 0);
      loadDonutChart(city, id, "Larceny", centrePointX, centrePointY, svgD, maxPathLength + 10);
    })
    .on("mouseout", mouseout);



  pathLength = ((crimeDataMap.get("Vandalism") * 1.0) / maxCrimes) * maxPathLength;
  svgD.append("line")
    .style("stroke", "black")
    .attr("class", `${id}-lines`)
    .attr("x1", centrePointX)
    .attr("y1", centrePointY)
    .attr("x2", getXCoordinate(pathLength, 90, centrePointX))
    .attr("y2", getYCoordinate(pathLength, 90, centrePointY));

  svgD.append("circle")
    .attr('class', `${id}-circles`)
    .attr("r", 5)
    .attr("cx", getXCoordinate(pathLength, 90, centrePointX))
    .attr("cy", getYCoordinate(pathLength, 90, centrePointY))
    .on('mousemove', (event, d) => {
      mousemove(event, d, "Vandalism", city);
    })
    .on('click', (event, d) => {
      divToolTipDL.style("opacity", 0);
      loadDonutChart(city, id, "Vandalism", centrePointX, centrePointY, svgD, maxPathLength + 10);
    })
    .on("mouseout", mouseout)
    .style("fill", city_color(city));


  pathLength = ((crimeDataMap.get("Drug abuse") * 1.0) / maxCrimes) * maxPathLength;
  svgD.append("line")
    .style("stroke", "black")
    .attr("class", `${id}-lines`)
    .attr("x1", centrePointX)
    .attr("y1", centrePointY)
    .attr("x2", getXCoordinate(pathLength, 130, centrePointX))
    .attr("y2", getYCoordinate(pathLength, 130, centrePointY));

  svgD.append("circle")
    .attr('class', `${id}-circles`)
    .attr("r", 5)
    .attr("cx", getXCoordinate(pathLength, 130, centrePointX))
    .attr("cy", getYCoordinate(pathLength, 130, centrePointY))
    .on('mousemove', (event, d) => {
      mousemove(event, d, "Drug abuse", city);
    })
    .on('click', (event, d) => {
      divToolTipDL.style("opacity", 0);
      loadDonutChart(city, id, "Drug abuse", centrePointX, centrePointY, svgD, maxPathLength + 10);
    })
    .on("mouseout", mouseout)
    .style("fill", city_color(city));


  pathLength = ((crimeDataMap.get("Assault") * 1.0) / maxCrimes) * maxPathLength;
  svgD.append("line")
    .style("stroke", "black")
    .attr("class", `${id}-lines`)
    .attr("x1", centrePointX)
    .attr("y1", centrePointY)
    .attr("x2", getXCoordinate(pathLength, 200, centrePointX))
    .attr("y2", getYCoordinate(pathLength, 200, centrePointY));


  svgD.append("circle")
    .attr('class', `${id}-circles`)
    .attr("r", 5)
    .attr("cx", getXCoordinate(pathLength, 200, centrePointX))
    .attr("cy", getYCoordinate(pathLength, 200, centrePointY))
    .on('mousemove', (event, d) => {
      mousemove(event, d, "Assault", city);
    })
    .on('click', (event, d) => {
      divToolTipDL.style("opacity", 0);
      loadDonutChart(city, id, "Assault", centrePointX, centrePointY, svgD, maxPathLength + 10);
    })
    .on("mouseout", mouseout)
    .style("fill", city_color(city));



  pathLength = ((crimeDataMap.get("Homicide") * 1.0) / maxCrimes) * maxPathLength;
  svgD.append("line")
    .style("stroke", "black")
    .attr('class', `${id}-circles`)
    .attr("x1", centrePointX)
    .attr("y1", centrePointY)
    .attr("x2", getXCoordinate(pathLength, 330, centrePointX))
    .attr("y2", getYCoordinate(pathLength, 330, centrePointY));

  svgD.append("circle")
    .attr('class', `${id}-circles`)
    .attr("r", 5)
    .attr("cx", getXCoordinate(pathLength, 330, centrePointX))
    .attr("cy", getYCoordinate(pathLength, 330, centrePointY))
    .on('mousemove', (event, d) => {
      mousemove(event, d, "Homicide", city);
    })
    .on('click', (event, d) => {
      divToolTipDL.style("opacity", 0);
      loadDonutChart(city, id, "Homicide", centrePointX, centrePointY, svgD, maxPathLength + 10);
    })
    .on("mouseout", mouseout)
    .style("fill", city_color(city));

  var svgDLegends = svgD.append("g")
    .attr("width", innerWidthD - 40)
    .attr("height", innerHeightD)
    .attr("transform", `translate(40,40)`)


  svgDLegends.append("rect")
    .attr("height", 30)
    .attr("width", 170)
    .attr("class", "text-background")
    .attr("x", 232)
    .attr("y", 20)
    .style("fill", city_color(city));

  svgDLegends.append("rect")
    .attr("height", 150)
    .attr("width", 170)
    .attr("x", 232)
    .attr("y", 20)
    .style("stroke", "black")
    .style("stroke-width", 1)
    .style("fill-opacity", 0);

  svgDLegends.append("text")
    .text(city + " (8 Officers)")
    .style("font-size", "13px")
    .style("fill", "white")
    .attr("alignment-baseline", "middle")
    .attr("stroke-width", "3px")
    .attr("x", 240)
    .attr("y", 40);

  d3.selectAll(".text-background").moveToBack();


  svgDLegends.append("text").attr("x", 240).attr("y", 70).text("Larceny (Total :" + crimeDataMap.get("Larceny") + ")").style("font-size", "12px").attr("alignment-baseline", "middle").attr("stroke-width", "3px")
  svgDLegends.append("text").attr("x", 240).attr("y", 90).text("Vandalism (Total :" + crimeDataMap.get("Vandalism") + ")").style("font-size", "12px").attr("alignment-baseline", "middle").attr("stroke-width", "3px")
  svgDLegends.append("text").attr("x", 240).attr("y", 110).text("Drug abuse (Total :" + crimeDataMap.get("Drug abuse") + ")").style("font-size", "12px").attr("alignment-baseline", "middle").attr("stroke-width", "3px")
  svgDLegends.append("text").attr("x", 240).attr("y", 130).text("Homicide (Total :" + crimeDataMap.get("Homicide") + ")").style("font-size", "12px").attr("alignment-baseline", "middle").attr("stroke-width", "3px")
  svgDLegends.append("text").attr("x", 240).attr("y", 150).text("Assault (Total :" + crimeDataMap.get("Assault") + ")").style("font-size", "12px").attr("alignment-baseline", "middle").attr("stroke-width", "3px")


}

function mousemove(event, d, crime, city) {
  if (dandelion_mode) {
    var color = city_color(city)
    divToolTipDL.style("opacity", 1);
    divToolTipDL.html(`<div style="color:${color}"><strong>${crime}</strong></div>`)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px");
  }
}
function mouseout(d) {
  divToolTipDL.style("opacity", 0);
};

function mousemoveDonut(event, id, cases) {
  divToolTipDonut.style("opacity", 1);
  var colorcode = donut_color(id);
  divToolTipDonut.html(`<div style="color:${colorcode}"><strong>Officer:${id}</strong> <br>
                        <strong>Total:${cases}</strong><br></div>`)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px");

}
function mouseoutDonut(d) {
  divToolTipDonut.style("opacity", 0);
};


function loadDonutChart(city, id, offense_type, centrePointX, centrePointY, svgD, radius) {
  fetch(`http://localhost:5000/api/donut_chart/${city}?offense_type=${offense_type}`)
    .then(response => response.json())
    .then(data => {
      donut_color = d3.scaleOrdinal().range(donut_color_map.get(city));
      drawDonutChart(id, data, centrePointX, centrePointY, svgD, radius);
    })
}
function drawDonutChart(id, data, centrePointX, centrePointY, svgD, radius) {
  dandelion_mode = false;
  svgD.selectAll(`.${id}-circles`)
    .style("opacity", 0);
  svgD.selectAll(`.${id}-lines`)
    .style("opacity", 0);
  svgD.selectAll(`.${id}-background-circle`)
    .style("opacity", 0);


  var svgDonut = svgD
    .append("g")
    .attr("transform", "translate(" + centrePointX + "," + centrePointY + ")");
  var arc = d3.arc()
    .outerRadius(radius)
    .innerRadius(radius - 50);

  var pie = d3.pie()
    .sort(null)
    .startAngle(1.1 * Math.PI)
    .endAngle(3.1 * Math.PI)
    .value(function (d) {
      return d.offense_total;
    });

  var g = svgDonut.selectAll(".arc")
    .data(pie(data))
    .enter().append("g")
    .attr("class", "arc");

  g.append("path")
    .style("fill", function (d) {
      return donut_color(d.data.id);
    })
    .on('mouseover', function (d, i) {
      //you can also write d3.select(d.currentTarget).style("stroke-width",4)

      d3.select(this).style("stroke-width", 4);

    }).on('mousemove', function (event, d) {
      divToolTipDonut.style("opacity", 1);
      mousemoveDonut(event, d.data.id, d.data.offense_total);
    }).on('mouseout', function (d, i) {
      mouseoutDonut(d);
    })
    .transition()
    .delay(function (d, i) {
      return i * 50;
    }).duration(75)
    .on("end", (d) => {
      g.append("text")
        .text(`Back`)
        .attr('transform', 'translate(0,0)')
        .attr('text-anchor', 'middle')
        .attr('text-baseline', 'middle')
        .style("font-size", "12px")
        .attr("x", 0)
        .attr("y", 30)

      g.append("svg:image")
        .attr("xlink:href", "data/back.svg")
        .attr("width", 40)
        .attr("height", 40)
        .attr("x", -20)
        .attr("y", -20)
        .on("click", (d, i) => {
          dandelion_mode = true;
          svgDonut.transition(200).style("opacity", 0).remove();
          svgD.selectAll(`.${id}-circles`)
            .transition(200)
            .style("opacity", 1);
          svgD.selectAll(`.${id}-lines`)
            .transition(200)
            .style("opacity", 1);
          svgD.selectAll(`.${id}-background-circle`)
            .transition(200)
            .style("opacity", 1);
        })

    })

    .attrTween('d', function (d) {
      var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
      return function (t) {
        d.endAngle = i(t);
        return arc(d);
      }
    });
  g.append("text")
    .attr("transform", function(d) {
        //set the label's origin to the center of the arc
      d.innerRadius = 0;
      d.outerRadius = radius;
      return "translate(" + arc.centroid(d) + ")";
  })
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style('fill', 'white')
    .text(function(d, i) {
      return data[i].offense_percent + '%';
    });
}

//stacked Radar chart

function fetchStackedRadarData(city, id) {
  fetch(`http://localhost:5000/api/stacked_radar/${city}`)
    .then(response => response.json())
    .then(
      data => {
        locationBasedCrimeDetailsMap.clear();
        resetPrevCrimeMap();
        drawStackedRadar(data, city, id, ((stacked_radar_tracker % 2) + 1));
        stacked_radar_tracker++;
      }
    );
}

function drawStackedRadar(data, city, id, stacked_radar_tracker) {
  var marginStackedRadar = { top: 10, right: 10, bottom: 10, left: 10 };
  var innerHeightSvgRadar = parseInt(d3.select(`#stacked-radar-${stacked_radar_tracker}`).style("height").replace("px", '')) - marginStackedRadar.top - marginStackedRadar.bottom;
  var innerWidthSvgRadar = parseInt(d3.select(`#stacked-radar-container`).style("width").replace("px", '')) - marginStackedRadar.left - marginStackedRadar.right;
  radarCentreX = (innerWidthSvgRadar / 2.0) - 100;
  radarCentreY = innerHeightSvgRadar / 2.0 + 50;


  d3.select(`.stacked-radar-group-${stacked_radar_tracker}`).remove();
  svgRadar = d3.select(`#stacked-radar-${stacked_radar_tracker}`).attr("width", d3.select(`#stacked-radar-container`).style("width"))
    .append("g")
    .attr("class", `stacked-radar-group-${stacked_radar_tracker}`)
    .attr('width', innerWidthSvgRadar)
    .attr('height', innerHeightSvgRadar)
    .attr("transform", `translate(${marginStackedRadar.left},${marginStackedRadar.top})`);

  data.forEach(ele => {
    var crimeMap = new Map();
    var legendsCrimeMap = new Map();
    ele["offense_details"].forEach(data => {
      legendsCrimeMap.set(data["offense_type"], data["offense_total"]);
      crimeMap.set(data["offense_type"], data["offense_total"] + prevCrimeMap.get(data["offense_type"]));
    });
    prevCrimeMap = crimeMap;
    locationBasedCrimeDetailsMap.set(ele["id"], crimeMap);
    legendsInfoMap.set(ele["id"], legendsCrimeMap);
  });
  var selectedMap;
  if (city == "Boston") {
    selectedMap = bostonCrimeDataMap;
    for (const value of bostonCrimeDataMap.values()) {
      totalCrimeInEachCity = Math.max(maxCrimes, value);
    }
  } else if (city == "San Francisco") {
    selectedMap = sanFranciscoCrimeDataMap;
    for (const value of sanFranciscoCrimeDataMap.values()) {
      totalCrimeInEachCity = Math.max(maxCrimes, value);
    }
  } else if (city == "Chicago") {
    selectedMap = chicagoCrimeDataMap;
    for (const value of chicagoCrimeDataMap.values()) {
      totalCrimeInEachCity = Math.max(maxCrimes, value);
    }
  } else if (city == "New York") {
    selectedMap = newYorkCrimeDataMap;
    for (const value of newYorkCrimeDataMap.values()) {
      totalCrimeInEachCity = Math.max(maxCrimes, value);
    }
  }
  maxPathLengthRadar = 150;
  drawStackedRadarChart(radarCentreX, radarCentreY, maxPathLengthRadar, selectedMap);
  drawPolygon(radarCentreX, radarCentreY, maxPathLengthRadar, id, city, stacked_radar_tracker);
  drawLegendsForStackedRadar(data, id, city);
}

function drawLegendsForStackedRadar(data, id, city) {

  var crimeMap = locationBasedCrimeDetailsMap.get(id);
  var legendsInfo = [{id:0, percentage:0}];
  var legendsCrimeMap = legendsInfoMap.get(id);
  for (const key of legendsCrimeMap.keys()) {
    legendsInfo.push({ id: `${key}`, percetage: `${Math.round((legendsCrimeMap.get(key) / prevCrimeMap.get(key)) * 100)}%` })
  }


  var svgRadarLegends = svgRadar.append("g").attr("transform", "translate(350,80)");
  svgRadarLegends.append("rect")
    .attr("height", 120)
    .attr("width", 110)
    .attr("x", 0)
    .attr("y", 0)
    .style("stroke", "black")
    .style("stroke-width", 1)
    .style("fill-opacity", 0);

  svgRadarLegends.append("rect")
    .attr("height", 20)
    .attr("width", 110)
    .attr("x", 0)
    .attr("y", 0)
    .style("fill", city_color(city));

  svgRadarLegends.append("text")
    .text(`Officer: ${id}`)
    .style("font-size", "13px")
    .style("fill", "white")
    .attr("alignment-baseline", "middle")
    .attr("stroke-width", "3px")
    .attr("x", 6)
    .attr("y", 12);



  svgRadarLegends.selectAll("text")
    .data(legendsInfo)
    .enter()
    .append("text")
    .text((d) => {
       return `${d.id}: ${d.percetage}
       ` })
    .style("font-size", "13px")
    .style("fill", "black")
    .attr("alignment-baseline", "middle")
    .attr("stroke-width", "3px")
    .attr("x", 6)
    .attr("y", function (d, i) { return 15 + i * 20 });

}

function drawPolygon(x1, y1, maxPathLengthRadar, id, city, stacked_radar_tracker) {

  for (const key of locationBasedCrimeDetailsMap.keys()) {
    const poly = [];
    const crimeMap = locationBasedCrimeDetailsMap.get(key);
    var pathLength = ((crimeMap.get("Larceny") * 1.0) / totalCrimeInEachCity) * maxPathLengthRadar;
    var X2 = getXCoordinate(pathLength, 25, x1);
    var Y2 = getYCoordinate(pathLength, 25, y1);
    poly.push({ x: X2, y: Y2 });

    pathLength = ((crimeMap.get("Vandalism") * 1.0) / totalCrimeInEachCity) * maxPathLengthRadar;
    X2 = getXCoordinate(pathLength, 90, x1);
    Y2 = getYCoordinate(pathLength, 90, y1);
    poly.push({ x: X2, y: Y2 });

    pathLength = ((crimeMap.get("Drug abuse") * 1.0) / totalCrimeInEachCity) * maxPathLengthRadar;
    X2 = getXCoordinate(pathLength, 130, x1);
    Y2 = getYCoordinate(pathLength, 130, y1);
    poly.push({ x: X2, y: Y2 });

    pathLength = ((crimeMap.get("Assault") * 1.0) / totalCrimeInEachCity) * maxPathLengthRadar;
    X2 = getXCoordinate(pathLength, 200, x1);
    Y2 = getYCoordinate(pathLength, 200, y1);
    poly.push({ x: X2, y: Y2 });

    pathLength = ((crimeMap.get("Homicide") * 1.0) / totalCrimeInEachCity) * maxPathLengthRadar;
    X2 = getXCoordinate(pathLength, 330, x1);
    Y2 = getYCoordinate(pathLength, 330, y1);
    poly.push({ x: X2, y: Y2 });

    svgRadar.append("polygon")
      .attr("points", function (d) {
        return poly.map(function (d) {
          return [d.x, d.y].join(",");
        }).join(" ");
      })
      .attr("id", key)
      .attr("class", `polygon-${stacked_radar_tracker}`)
      .style("fill", "white")
      .style("fill-opacity", 0);
  }


  const polygons = d3.selectAll(`.polygon-${stacked_radar_tracker}`)._groups[0];

  var count = 1;
  var is_event_count = false;
  polygons.forEach(ele => {
    if (ele.id == id) {
      if (count % 2 == 0) {
        is_event_count = true;
      }
      return;
    }
    count++;
  });

  count = 1;
  polygons.forEach(ele => {
    if (ele.id == id) {
      d3.select(ele).style("fill", city_color(city));
      d3.select(ele).style("fill-opacity", 1);
      d3.select(ele).moveToBack();
    } else {
      if (is_event_count) {
        if (count % 2 == 0) {
          d3.select(ele).style("fill", alt_color(city));
        } else {
          d3.select(ele).style("fill", "#d5d4d2");
        }
      } else {
        if (count % 2 == 1) {
          d3.select(ele).style("fill", alt_color(city));
        } else {
          d3.select(ele).style("fill", "#d5d4d2");
        }

      }
      d3.select(ele).style("fill-opacity", 1);
      d3.select(ele).moveToBack();
    }
    count++;
  });

}



function drawStackedRadarChart(x1, y1, maxPathLengthRadar, crimeDataMap) {

  var pathLength = ((crimeDataMap.get("Larceny") * 1.0) / totalCrimeInEachCity) * maxPathLengthRadar;

  svgRadar.append("text")
    .attr("x", getXCoordinate(pathLength, 25, x1) + 5)
    .attr("y", getYCoordinate(pathLength, 25, y1) + 5)
    .attr("dy", "-0.2em")
    .text("Larceny")
    .style("font-style", "arial")
    .style("font-size", "12px");

  svgRadar.append("line")
    //.style("stroke", "black")
    .attr('class', "lines")
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", getXCoordinate(pathLength, 25, x1))
    .attr("y2", getYCoordinate(pathLength, 25, y1));


  pathLength = ((crimeDataMap.get("Vandalism") * 1.0) / totalCrimeInEachCity) * maxPathLengthRadar;

  svgRadar.append("text")
    .attr("x", getXCoordinate(pathLength, 90, x1) - 5)
    .attr("y", getYCoordinate(pathLength, 90, y1) + 2)
    .attr("dy", "-0.2em")
    .text("Vandalism")
    .style("font-style", "arial")
    .style("font-size", "12px");

  svgRadar.append("line")
    // .style("stroke", "black")
    .attr('class', "lines")
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", getXCoordinate(pathLength, 90, x1))
    .attr("y2", getYCoordinate(pathLength, 90, y1));

  pathLength = ((crimeDataMap.get("Drug abuse") * 1.0) / totalCrimeInEachCity) * maxPathLengthRadar;
  svgRadar.append("text")
    .attr("x", getXCoordinate(pathLength, 130, x1) - 60)
    .attr("y", getYCoordinate(pathLength, 130, y1))
    .attr("dy", "-0.2em")
    .text("Drug abuse")
    .style("font-style", "arial")
    .style("font-size", "12px");


  svgRadar.append("line")
    //.style("stroke", "black")
    .attr('class', "lines")
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", getXCoordinate(pathLength, 130, x1))
    .attr("y2", getYCoordinate(pathLength, 130, y1));

  pathLength = ((crimeDataMap.get("Assault") * 1.0) / totalCrimeInEachCity) * maxPathLengthRadar;

  svgRadar.append("text")
    .attr("x", getXCoordinate(pathLength, 200, x1) - 45)
    .attr("y", getYCoordinate(pathLength, 200, y1) + 5)
    .attr("dy", "-0.2em")
    .text("Assault")
    .style("font-style", "arial")
    .style("font-size", "12px");


  svgRadar.append("line")
    //.style("stroke", "black")
    .attr('class', "lines")
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", getXCoordinate(pathLength, 200, x1))
    .attr("y2", getYCoordinate(pathLength, 200, y1));

  pathLength = ((crimeDataMap.get("Homicide") * 1.0) / totalCrimeInEachCity) * maxPathLengthRadar;
  svgRadar.append("text")
    .attr("x", getXCoordinate(pathLength, 330, x1) + 5)
    .attr("y", getYCoordinate(pathLength, 330, y1) + 5)
    .attr("dy", "-0.2em")
    .text("Homicide")
    .style("font-style", "arial")
    .style("font-size", "12px");


  svgRadar.append("line")
    //.style("stroke", "black")
    .attr('class', "lines")
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", getXCoordinate(pathLength, 330, x1))
    .attr("y2", getYCoordinate(pathLength, 330, y1));
}

function getXCoordinate(pathLength, angle, x1) {
  return x1 + (pathLength * Math.cos((360 - angle) * ((22.0 / 7) / 180)));
}

function getYCoordinate(pathLength, angle, y1) {
  return y1 + (pathLength * Math.sin((360 - angle) * ((22.0 / 7) / 180)));

}




