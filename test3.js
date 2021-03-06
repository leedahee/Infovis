// NO2
d3.csv("new_pollution_no2.csv", function(err, data) {

  var config = {"color1":"#d3e5ff","color2":"#08306B","State":"state_or_territory","defaultValue":"2001","state":"State"};
  
  var WIDTH = 800, HEIGHT = 500;

  var COLOR_COUNTS = 9;
  
  var SCALE = 0.7;
  
  function Interpolate(start, end, steps, count) {
      var s = start,
          e = end,
          final = s + (((e - s) / steps) * count);
      return Math.floor(final);
  }
  
  function Color(_r, _g, _b) {
      var r, g, b;
      var setColors = function(_r, _g, _b) {
          r = _r;
          g = _g;
          b = _b;
      };
  
      setColors(_r, _g, _b);
      this.getColors = function() {
          var colors = {
              r: r,
              g: g,
              b: b
          };
          return colors;
      };
  }
  
  function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
  }
  
  function valueFormat(d) {
    if (d > 1000000000) {
      return Math.round(d / 1000000000 * 10) / 10 + "B";
    } else if (d > 1000000) {
      return Math.round(d / 1000000 * 10) / 10 + "M";
    } else if (d > 1000) {
      return Math.round(d / 1000 * 10) / 10 + "K";
    } else {
      return d;
    }
  }
  
  var fields = Object.keys(data[0]);
  var option_select = d3.select('#selectors').append("select")
      .attr("class", "option-select");
  for (var i = 0; i < fields.length; i++) {
    if (fields[i] !== config.state) {
      var opt = option_select.append("option")
        .attr("value", fields[i])
        .text(fields[i]);
      
      if (fields[i] === config.defaultValue) {
        opt.attr("selected", "true");
      }
    }
  }
  
  var COLOR_FIRST = config.color1, COLOR_LAST = config.color2;
  
  var rgb = hexToRgb(COLOR_FIRST);
  
  var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);
  
  rgb = hexToRgb(COLOR_LAST);
  var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);
  
  var width = WIDTH,
      height = HEIGHT;
  
  var startColors = COLOR_START.getColors(),
      endColors = COLOR_END.getColors();
  
  var colors = [];
  
  for (var i = 0; i < COLOR_COUNTS; i++) {
    var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
    var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
    var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
    colors.push(new Color(r, g, b));
  }
  
  var quantize = d3.scale.quantize()
      .domain([0, 1.0])
      .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));
  
  var path = d3.geo.path();
  
  var svg = d3.select("#canvas-svg").append("svg")
      .attr("width", width)
      .attr("height", height);
  
  d3.tsv("https://s3-us-west-2.amazonaws.com/vida-public/geo/us-state-names.tsv", function(error, names) {
  d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/us.json", function(error, us) {
    
    var name_id_map = {};
    var id_name_map = {};
    
    for (var i = 0; i < names.length; i++) {
      name_id_map[names[i].name] = names[i].id;
      id_name_map[names[i].id] = names[i].name;
    }
    
    var dataMap = {};
    
    data.forEach(function(d) {
      if (!dataMap[d[config.state]]) {
        dataMap[d[config.state]] = {};
      }
      
      for (var i = 0; i < Object.keys(data[0]).length; i++) {
        if (Object.keys(data[0])[i] !== config.state) {
          dataMap[d[config.state]][Object.keys(data[0])[i]] =
            +d[Object.keys(data[0])[i]];
        }
      }
    });
    
    function drawMap(dataColumn) {
      var valueById = d3.map();
      
      data.forEach(function(d) {
        var id = name_id_map[d[config.state]];
        valueById.set(id, +d[dataColumn]); 
      });
      
      quantize.domain([d3.min(data, function(d){ return +d[dataColumn] }),
        d3.max(data, function(d){ return +d[dataColumn] })]);
    
      svg.append("g")
          .attr("class", "states-choropleth")
        .selectAll("path")
          .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
          .attr("transform", "scale(" + SCALE + ")")
          .style("fill", function(d) {
            if (valueById.get(d.id)) {
              var i = quantize(valueById.get(d.id));
              var color = colors[i].getColors();
              return "rgb(" + color.r + "," + color.g +
                  "," + color.b + ")";
            } else {
              return "";
            }
          })
          .attr("d", path)
          .on("click", function(d) {
              var html = "";
              var dataArray = {};

              //dataArray += id_name_map[d.id];
    
              html += "<div class=\"tooltip_kv\">";
              html += "<span class=\"tooltip_key\">";
              html += id_name_map[d.id];
              html += "</span>";
              html += "</div>";
              
              for (var i = 1; i < Object.keys(data[0]).length; i++) {
                html += "<div class=\"tooltip_kv\">";
                html += "<span class='tooltip_key'>";
                html += Object.keys(data[0])[i];
                html += "</span>";
                html += "<span class=\"tooltip_value\">";
                html += valueFormat(dataMap[id_name_map[d.id]][Object.keys(data[0])[i]]);
                html += "";
                html += "</span>";
                html += "</div>";

                dataArray[Object.keys(data[0])[i]] = valueFormat(dataMap[id_name_map[d.id]][Object.keys(data[0])[i]]);
              }
               dataArray = [dataArray] 
              //console.log(html)
              console.log(dataArray)

//dataArray2 = [{2001: 40, 2002: 40},{2001: 40, 2002: 40}]

              YearList = [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016]

              var svgWidth=900;
              var svgHeight=200;
              var subChartWidth=svgWidth/dataArray.length;
              console.log(subChartWidth)

              //////////////////plot bar charts/////////////////////
              //settings for bar chart
              var xStartLoc=30; //the left offset from canvas to the first bar
              var spaceBetweenBar=5;
              var yStartLoc=120; // the top offset from canvas to the bottom of the bar.
              var width=10; //width of bar

              var heightRange = {min:0, max:120}

              var heightScale = d3.scale.linear()
                .domain([0,100])
                .range([heightRange.min, heightRange.max]);


              var dataCompDIV = d3.select('body')
                  .append('div')
                  .attr("class","barCharts");

              var dataCompTitle=dataCompDIV.append('h3')
                  .text("Bar Charts")

              var dataCompSVG=dataCompDIV.append('svg')
                  .attr('width', svgWidth)
                  .attr('height', svgHeight);

              var dataCompG=dataCompSVG.selectAll('rect')
                  .data(dataArray)
                  .enter();

                  //sdfdf

              // var dataCompHeightScale=d3.scale.linear()
              //     .domain([dataArray.min,dataArray.max])
              //     .range([0, 100]);

        colorList=["green","green","green", "green", "green","green","green", "green", "green","green","green", "green", "green","green","green", "green"];

        function plotEachBar(colorofBar, xStart, fieldName) {

            var barForSingleProject = dataCompG
                .append('rect')
                .attr('class', fieldName)
                .attr('x', function(d,i){return xStartLoc+xStart+i*subChartWidth})
                .attr('y', function(d){return yStartLoc - heightScale(d[fieldName])})
                .attr('height', function(d){return heightScale(d[fieldName])})
                .attr('width', width)
                .style('fill', colorofBar);

            // var labelForEach = chartCompG.append('text')
            //     .text(fieldName)
            //     .attr('x', function(d,i){ return xStartLoc+xStart+i*subChartWidth})
            //     .attr('y', yStartLoc+10)

            return (barForSingleProject)

        }
        for(let i in YearList){
          plotEachBar(colorList[i],i*(width+spaceBetweenBar),YearList[i])

    }



              
              $("#tooltip-container").html(html);
              $(this).attr("fill-opacity", "0.7");
              $("#tooltip-container").show();
              
              var coordinates = d3.mouse(this);
              
              var map_width = $('.states-choropleth')[0].getBoundingClientRect().width;
              
              if (d3.event.layerX < map_width / 2) {
                d3.select("#tooltip-container")
                  .style("top", (d3.event.layerY + 15) + "px")
                  .style("left", (d3.event.layerX + 15) + "px");
              } else {
                var tooltip_width = $("#tooltip-container").width();
                d3.select("#tooltip-container")
                  .style("top", (d3.event.layerY + 15) + "px")
                  .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
              }
          })
          .on("mouseout", function() {
                  $(this).attr("fill-opacity", "1.0");
                  $("#tooltip-container").hide();
              });


    
      svg.append("path")
          .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
          .attr("class", "states")
          .attr("transform", "scale(" + SCALE + ")")
          .attr("d", path);
    }
    
    drawMap(config.defaultValue);
    
    option_select.on("change", function() {
      drawMap($("#selectors").find(".option-select").val());
    });
  
  
  });

  });

});








// CO
d3.csv("new_pollution_co.csv", function(err, data) {

  var config = {"color1":"#d3e5ff","color2":"#08306B","State":"state_or_territory","defaultValue":"2001","state":"State"};
  
  var WIDTH = 800, HEIGHT = 500;

  var COLOR_COUNTS = 9;
  
  var SCALE = 0.7;
  
  function Interpolate(start, end, steps, count) {
      var s = start,
          e = end,
          final = s + (((e - s) / steps) * count);
      return Math.floor(final);
  }
  
  function Color(_r, _g, _b) {
      var r, g, b;
      var setColors = function(_r, _g, _b) {
          r = _r;
          g = _g;
          b = _b;
      };
  
      setColors(_r, _g, _b);
      this.getColors = function() {
          var colors = {
              r: r,
              g: g,
              b: b
          };
          return colors;
      };
  }
  
  function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
  }
  
  function valueFormat(d) {
    if (d > 1000000000) {
      return Math.round(d / 1000000000 * 10) / 10 + "B";
    } else if (d > 1000000) {
      return Math.round(d / 1000000 * 10) / 10 + "M";
    } else if (d > 1000) {
      return Math.round(d / 1000 * 10) / 10 + "K";
    } else {
      return d;
    }
  }
  
  var fields = Object.keys(data[0]);
  var option_select = d3.select('#selectors2').append("select")
      .attr("class", "option-select");
  for (var i = 0; i < fields.length; i++) {
    if (fields[i] !== config.state) {
      var opt = option_select.append("option")
        .attr("value", fields[i])
        .text(fields[i]);
      
      if (fields[i] === config.defaultValue) {
        opt.attr("selected", "true");
      }
    }
  }
  
  var COLOR_FIRST = config.color1, COLOR_LAST = config.color2;
  
  var rgb = hexToRgb(COLOR_FIRST);
  
  var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);
  
  rgb = hexToRgb(COLOR_LAST);
  var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);
  
  var width = WIDTH,
      height = HEIGHT;
  
  var startColors = COLOR_START.getColors(),
      endColors = COLOR_END.getColors();
  
  var colors = [];
  
  for (var i = 0; i < COLOR_COUNTS; i++) {
    var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
    var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
    var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
    colors.push(new Color(r, g, b));
  }
  
  var quantize = d3.scale.quantize()
      .domain([0, 1.0])
      .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));
  
  var path = d3.geo.path();
  
  var svg = d3.select("#canvas-svg").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(700,-495)");
  
  d3.tsv("https://s3-us-west-2.amazonaws.com/vida-public/geo/us-state-names.tsv", function(error, names) {
  d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/us.json", function(error, us) {
    
    var name_id_map = {};
    var id_name_map = {};
    
    for (var i = 0; i < names.length; i++) {
      name_id_map[names[i].name] = names[i].id;
      id_name_map[names[i].id] = names[i].name;
    }
    
    var dataMap = {};
    
    data.forEach(function(d) {
      if (!dataMap[d[config.state]]) {
        dataMap[d[config.state]] = {};
      }
      
      for (var i = 0; i < Object.keys(data[0]).length; i++) {
        if (Object.keys(data[0])[i] !== config.state) {
          dataMap[d[config.state]][Object.keys(data[0])[i]] =
            +d[Object.keys(data[0])[i]];
        }
      }
    });
    
    function drawMap(dataColumn) {
      var valueById = d3.map();
      
      data.forEach(function(d) {
        var id = name_id_map[d[config.state]];
        valueById.set(id, +d[dataColumn]); 
      });
      
      quantize.domain([d3.min(data, function(d){ return +d[dataColumn] }),
        d3.max(data, function(d){ return +d[dataColumn] })]);
    
      svg.append("g")
          .attr("class", "states-choropleth")
        .selectAll("path")
          .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
          .attr("transform", "scale(" + SCALE + ")")
          .style("fill", function(d) {
            if (valueById.get(d.id)) {
              var i = quantize(valueById.get(d.id));
              var color = colors[i].getColors();
              return "rgb(" + color.r + "," + color.g +
                  "," + color.b + ")";
            } else {
              return "";
            }
          })
          .attr("d", path)
          .on("click", function(d) {
              var html = "";
              var dataArray = {};

              //dataArray += id_name_map[d.id];
    
              html += "<div class=\"tooltip_kv\">";
              html += "<span class=\"tooltip_key\">";
              html += id_name_map[d.id];
              html += "</span>";
              html += "</div>";
              
              for (var i = 1; i < Object.keys(data[0]).length; i++) {
                html += "<div class=\"tooltip_kv\">";
                html += "<span class='tooltip_key'>";
                html += Object.keys(data[0])[i];
                html += "</span>";
                html += "<span class=\"tooltip_value\">";
                html += valueFormat(dataMap[id_name_map[d.id]][Object.keys(data[0])[i]]);
                html += "";
                html += "</span>";
                html += "</div>";

                dataArray[Object.keys(data[0])[i]] = valueFormat(dataMap[id_name_map[d.id]][Object.keys(data[0])[i]]);
              }
               dataArray = [dataArray] 
              //console.log(html)
              console.log(dataArray)

//dataArray2 = [{2001: 40, 2002: 40},{2001: 40, 2002: 40}]

              YearList = [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016]

              var svgWidth=900;
              var svgHeight=200;
              var subChartWidth=svgWidth/dataArray.length;
              console.log(subChartWidth)

              //////////////////plot bar charts/////////////////////
              //settings for bar chart
              var xStartLoc=30; //the left offset from canvas to the first bar
              var spaceBetweenBar=5;
              var yStartLoc=120; // the top offset from canvas to the bottom of the bar.
              var width=10; //width of bar

              var heightRange = {min:0, max:120}

              var heightScale = d3.scale.linear()
                .domain([0,100])
                .range([heightRange.min, heightRange.max]);


              var dataCompDIV = d3.select('body')
                  .append('div')
                  .attr("class","barCharts");

              var dataCompTitle=dataCompDIV.append('h3')
                  .text("Bar Charts")

              var dataCompSVG=dataCompDIV.append('svg')
                  .attr('width', svgWidth)
                  .attr('height', svgHeight);

              var dataCompG=dataCompSVG.selectAll('rect')
                  .data(dataArray)
                  .enter();

                  //sdfdf

              // var dataCompHeightScale=d3.scale.linear()
              //     .domain([dataArray.min,dataArray.max])
              //     .range([0, 100]);

        colorList=["green","green","green", "green", "green","green","green", "green", "green","green","green", "green", "green","green","green", "green"];

        function plotEachBar(colorofBar, xStart, fieldName) {

            var barForSingleProject = dataCompG
                .append('rect')
                .attr('class', fieldName)
                .attr('x', function(d,i){return xStartLoc+xStart+i*subChartWidth})
                .attr('y', function(d){return yStartLoc - heightScale(d[fieldName])})
                .attr('height', function(d){return heightScale(d[fieldName])})
                .attr('width', width)
                .style('fill', colorofBar);

            // var labelForEach = chartCompG.append('text')
            //     .text(fieldName)
            //     .attr('x', function(d,i){ return xStartLoc+xStart+i*subChartWidth})
            //     .attr('y', yStartLoc+10)

            return (barForSingleProject)

        }
        for(let i in YearList){
          plotEachBar(colorList[i],i*(width+spaceBetweenBar),YearList[i])

    }



              
              $("#tooltip-container").html(html);
              $(this).attr("fill-opacity", "0.7");
              $("#tooltip-container").show();
              
              var coordinates = d3.mouse(this);
              
              var map_width = $('.states-choropleth')[0].getBoundingClientRect().width;
              
              if (d3.event.layerX < map_width / 2) {
                d3.select("#tooltip-container")
                  .style("top", (d3.event.layerY + 15) + "px")
                  .style("left", (d3.event.layerX + 15) + "px");
              } else {
                var tooltip_width = $("#tooltip-container").width();
                d3.select("#tooltip-container")
                  .style("top", (d3.event.layerY + 15) + "px")
                  .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
              }
          })
          .on("mouseout", function() {
                  $(this).attr("fill-opacity", "1.0");
                  $("#tooltip-container").hide();
              });


    
      svg.append("path")
          .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
          .attr("class", "states")
          .attr("transform", "scale(" + SCALE + ")")
          .attr("d", path);
    }
    
    drawMap(config.defaultValue);
    
    option_select.on("change", function() {
      drawMap($("#selectors2").find(".option-select").val());
    });
  
  
  });

  });

});








// // O3
// d3.csv("new_pollution_o3.csv", function(err, data) {

//   var config = {"color1":"#d3e5ff","color2":"#08306B","State":"state_or_territory","defaultValue":"2001","state":"State"};
  
//   var WIDTH = 800, HEIGHT = 500;

//   var COLOR_COUNTS = 9;
  
//   var SCALE = 0.7;
  
//   function Interpolate(start, end, steps, count) {
//       var s = start,
//           e = end,
//           final = s + (((e - s) / steps) * count);
//       return Math.floor(final);
//   }
  
//   function Color(_r, _g, _b) {
//       var r, g, b;
//       var setColors = function(_r, _g, _b) {
//           r = _r;
//           g = _g;
//           b = _b;
//       };
  
//       setColors(_r, _g, _b);
//       this.getColors = function() {
//           var colors = {
//               r: r,
//               g: g,
//               b: b
//           };
//           return colors;
//       };
//   }
  
//   function hexToRgb(hex) {
//       var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//       return result ? {
//           r: parseInt(result[1], 16),
//           g: parseInt(result[2], 16),
//           b: parseInt(result[3], 16)
//       } : null;
//   }
  
//   function valueFormat(d) {
//     if (d > 1000000000) {
//       return Math.round(d / 1000000000 * 10) / 10 + "B";
//     } else if (d > 1000000) {
//       return Math.round(d / 1000000 * 10) / 10 + "M";
//     } else if (d > 1000) {
//       return Math.round(d / 1000 * 10) / 10 + "K";
//     } else {
//       return d;
//     }
//   }
  
//   var fields = Object.keys(data[0]);
//   var option_select = d3.select('#selectors3').append("select")
//       .attr("class", "option-select");
//   for (var i = 0; i < fields.length; i++) {
//     if (fields[i] !== config.state) {
//       var opt = option_select.append("option")
//         .attr("value", fields[i])
//         .text(fields[i]);
      
//       if (fields[i] === config.defaultValue) {
//         opt.attr("selected", "true");
//       }
//     }
//   }
  
//   var COLOR_FIRST = config.color1, COLOR_LAST = config.color2;
  
//   var rgb = hexToRgb(COLOR_FIRST);
  
//   var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);
  
//   rgb = hexToRgb(COLOR_LAST);
//   var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);
  
//   var width = WIDTH,
//       height = HEIGHT;
  
//   var startColors = COLOR_START.getColors(),
//       endColors = COLOR_END.getColors();
  
//   var colors = [];
  
//   for (var i = 0; i < COLOR_COUNTS; i++) {
//     var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
//     var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
//     var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
//     colors.push(new Color(r, g, b));
//   }
  
//   var quantize = d3.scale.quantize()
//       .domain([0, 1.0])
//       .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));
  
//   var path = d3.geo.path();
  
//   var svg = d3.select("#canvas-svg").append("svg")
//       .attr("width", width)
//       .attr("height", height);
  
//   d3.tsv("https://s3-us-west-2.amazonaws.com/vida-public/geo/us-state-names.tsv", function(error, names) {
//   d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/us.json", function(error, us) {
    
//     var name_id_map = {};
//     var id_name_map = {};
    
//     for (var i = 0; i < names.length; i++) {
//       name_id_map[names[i].name] = names[i].id;
//       id_name_map[names[i].id] = names[i].name;
//     }
    
//     var dataMap = {};
    
//     data.forEach(function(d) {
//       if (!dataMap[d[config.state]]) {
//         dataMap[d[config.state]] = {};
//       }
      
//       for (var i = 0; i < Object.keys(data[0]).length; i++) {
//         if (Object.keys(data[0])[i] !== config.state) {
//           dataMap[d[config.state]][Object.keys(data[0])[i]] =
//             +d[Object.keys(data[0])[i]];
//         }
//       }
//     });
    
//     function drawMap(dataColumn) {
//       var valueById = d3.map();
      
//       data.forEach(function(d) {
//         var id = name_id_map[d[config.state]];
//         valueById.set(id, +d[dataColumn]); 
//       });
      
//       quantize.domain([d3.min(data, function(d){ return +d[dataColumn] }),
//         d3.max(data, function(d){ return +d[dataColumn] })]);
    
//       svg.append("g")
//           .attr("class", "states-choropleth")
//         .selectAll("path")
//           .data(topojson.feature(us, us.objects.states).features)
//         .enter().append("path")
//           .attr("transform", "scale(" + SCALE + ")")
//           .style("fill", function(d) {
//             if (valueById.get(d.id)) {
//               var i = quantize(valueById.get(d.id));
//               var color = colors[i].getColors();
//               return "rgb(" + color.r + "," + color.g +
//                   "," + color.b + ")";
//             } else {
//               return "";
//             }
//           })
//           .attr("d", path)
//           .on("click", function(d) {
//               var html = "";
//               var dataArray = {};

//               //dataArray += id_name_map[d.id];
    
//               html += "<div class=\"tooltip_kv\">";
//               html += "<span class=\"tooltip_key\">";
//               html += id_name_map[d.id];
//               html += "</span>";
//               html += "</div>";
              
//               for (var i = 1; i < Object.keys(data[0]).length; i++) {
//                 html += "<div class=\"tooltip_kv\">";
//                 html += "<span class='tooltip_key'>";
//                 html += Object.keys(data[0])[i];
//                 html += "</span>";
//                 html += "<span class=\"tooltip_value\">";
//                 html += valueFormat(dataMap[id_name_map[d.id]][Object.keys(data[0])[i]]);
//                 html += "";
//                 html += "</span>";
//                 html += "</div>";

//                 dataArray[Object.keys(data[0])[i]] = valueFormat(dataMap[id_name_map[d.id]][Object.keys(data[0])[i]]);
//               }
//                dataArray = [dataArray] 
//               //console.log(html)
//               console.log(dataArray)

// //dataArray2 = [{2001: 40, 2002: 40},{2001: 40, 2002: 40}]

//               YearList = [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016]

//               var svgWidth=900;
//               var svgHeight=200;
//               var subChartWidth=svgWidth/dataArray.length;
//               console.log(subChartWidth)

//               //////////////////plot bar charts/////////////////////
//               //settings for bar chart
//               var xStartLoc=30; //the left offset from canvas to the first bar
//               var spaceBetweenBar=5;
//               var yStartLoc=120; // the top offset from canvas to the bottom of the bar.
//               var width=10; //width of bar

//               var heightRange = {min:0, max:120}

//               var heightScale = d3.scale.linear()
//                 .domain([0,100])
//                 .range([heightRange.min, heightRange.max]);


//               var dataCompDIV = d3.select('body')
//                   .append('div')
//                   .attr("class","barCharts");

//               var dataCompTitle=dataCompDIV.append('h3')
//                   .text("Bar Charts")

//               var dataCompSVG=dataCompDIV.append('svg')
//                   .attr('width', svgWidth)
//                   .attr('height', svgHeight);

//               var dataCompG=dataCompSVG.selectAll('rect')
//                   .data(dataArray)
//                   .enter();

//                   //sdfdf

//               // var dataCompHeightScale=d3.scale.linear()
//               //     .domain([dataArray.min,dataArray.max])
//               //     .range([0, 100]);

//         colorList=["green","green","green", "green", "green","green","green", "green", "green","green","green", "green", "green","green","green", "green"];

//         function plotEachBar(colorofBar, xStart, fieldName) {

//             var barForSingleProject = dataCompG
//                 .append('rect')
//                 .attr('class', fieldName)
//                 .attr('x', function(d,i){return xStartLoc+xStart+i*subChartWidth})
//                 .attr('y', function(d){return yStartLoc - heightScale(d[fieldName])})
//                 .attr('height', function(d){return heightScale(d[fieldName])})
//                 .attr('width', width)
//                 .style('fill', colorofBar);

//             // var labelForEach = chartCompG.append('text')
//             //     .text(fieldName)
//             //     .attr('x', function(d,i){ return xStartLoc+xStart+i*subChartWidth})
//             //     .attr('y', yStartLoc+10)

//             return (barForSingleProject)

//         }
//         for(let i in YearList){
//           plotEachBar(colorList[i],i*(width+spaceBetweenBar),YearList[i])

//     }



              
//               $("#tooltip-container").html(html);
//               $(this).attr("fill-opacity", "0.7");
//               $("#tooltip-container").show();
              
//               var coordinates = d3.mouse(this);
              
//               var map_width = $('.states-choropleth')[0].getBoundingClientRect().width;
              
//               if (d3.event.layerX < map_width / 2) {
//                 d3.select("#tooltip-container")
//                   .style("top", (d3.event.layerY + 15) + "px")
//                   .style("left", (d3.event.layerX + 15) + "px");
//               } else {
//                 var tooltip_width = $("#tooltip-container").width();
//                 d3.select("#tooltip-container")
//                   .style("top", (d3.event.layerY + 15) + "px")
//                   .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
//               }
//           })
//           .on("mouseout", function() {
//                   $(this).attr("fill-opacity", "1.0");
//                   $("#tooltip-container").hide();
//               });


    
//       svg.append("path")
//           .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
//           .attr("class", "states")
//           .attr("transform", "scale(" + SCALE + ")")
//           .attr("d", path);
//     }
    
//     drawMap(config.defaultValue);
    
//     option_select.on("change", function() {
//       drawMap($("#selectors3").find(".option-select").val());
//     });
  
  
//   });

//   });

// });










// // SO2
// d3.csv("new_pollution_so2.csv", function(err, data) {

//   var config = {"color1":"#d3e5ff","color2":"#08306B","State":"state_or_territory","defaultValue":"2001","state":"State"};
  
//   var WIDTH = 800, HEIGHT = 500;

//   var COLOR_COUNTS = 9;
  
//   var SCALE = 0.7;
  
//   function Interpolate(start, end, steps, count) {
//       var s = start,
//           e = end,
//           final = s + (((e - s) / steps) * count);
//       return Math.floor(final);
//   }
  
//   function Color(_r, _g, _b) {
//       var r, g, b;
//       var setColors = function(_r, _g, _b) {
//           r = _r;
//           g = _g;
//           b = _b;
//       };
  
//       setColors(_r, _g, _b);
//       this.getColors = function() {
//           var colors = {
//               r: r,
//               g: g,
//               b: b
//           };
//           return colors;
//       };
//   }
  
//   function hexToRgb(hex) {
//       var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//       return result ? {
//           r: parseInt(result[1], 16),
//           g: parseInt(result[2], 16),
//           b: parseInt(result[3], 16)
//       } : null;
//   }
  
//   function valueFormat(d) {
//     if (d > 1000000000) {
//       return Math.round(d / 1000000000 * 10) / 10 + "B";
//     } else if (d > 1000000) {
//       return Math.round(d / 1000000 * 10) / 10 + "M";
//     } else if (d > 1000) {
//       return Math.round(d / 1000 * 10) / 10 + "K";
//     } else {
//       return d;
//     }
//   }
  
//   var fields = Object.keys(data[0]);
//   var option_select = d3.select('#selectors4').append("select")
//       .attr("class", "option-select");
//   for (var i = 0; i < fields.length; i++) {
//     if (fields[i] !== config.state) {
//       var opt = option_select.append("option")
//         .attr("value", fields[i])
//         .text(fields[i]);
      
//       if (fields[i] === config.defaultValue) {
//         opt.attr("selected", "true");
//       }
//     }
//   }
  
//   var COLOR_FIRST = config.color1, COLOR_LAST = config.color2;
  
//   var rgb = hexToRgb(COLOR_FIRST);
  
//   var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);
  
//   rgb = hexToRgb(COLOR_LAST);
//   var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);
  
//   var width = WIDTH,
//       height = HEIGHT;
  
//   var startColors = COLOR_START.getColors(),
//       endColors = COLOR_END.getColors();
  
//   var colors = [];
  
//   for (var i = 0; i < COLOR_COUNTS; i++) {
//     var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
//     var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
//     var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
//     colors.push(new Color(r, g, b));
//   }
  
//   var quantize = d3.scale.quantize()
//       .domain([0, 1.0])
//       .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));
  
//   var path = d3.geo.path();
  
//   var svg = d3.select("#canvas-svg").append("svg")
//       .attr("width", width)
//       .attr("height", height);
  
//   d3.tsv("https://s3-us-west-2.amazonaws.com/vida-public/geo/us-state-names.tsv", function(error, names) {
//   d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/us.json", function(error, us) {
    
//     var name_id_map = {};
//     var id_name_map = {};
    
//     for (var i = 0; i < names.length; i++) {
//       name_id_map[names[i].name] = names[i].id;
//       id_name_map[names[i].id] = names[i].name;
//     }
    
//     var dataMap = {};
    
//     data.forEach(function(d) {
//       if (!dataMap[d[config.state]]) {
//         dataMap[d[config.state]] = {};
//       }
      
//       for (var i = 0; i < Object.keys(data[0]).length; i++) {
//         if (Object.keys(data[0])[i] !== config.state) {
//           dataMap[d[config.state]][Object.keys(data[0])[i]] =
//             +d[Object.keys(data[0])[i]];
//         }
//       }
//     });
    
//     function drawMap(dataColumn) {
//       var valueById = d3.map();
      
//       data.forEach(function(d) {
//         var id = name_id_map[d[config.state]];
//         valueById.set(id, +d[dataColumn]); 
//       });
      
//       quantize.domain([d3.min(data, function(d){ return +d[dataColumn] }),
//         d3.max(data, function(d){ return +d[dataColumn] })]);
    
//       svg.append("g")
//           .attr("class", "states-choropleth")
//         .selectAll("path")
//           .data(topojson.feature(us, us.objects.states).features)
//         .enter().append("path")
//           .attr("transform", "scale(" + SCALE + ")")
//           .style("fill", function(d) {
//             if (valueById.get(d.id)) {
//               var i = quantize(valueById.get(d.id));
//               var color = colors[i].getColors();
//               return "rgb(" + color.r + "," + color.g +
//                   "," + color.b + ")";
//             } else {
//               return "";
//             }
//           })
//           .attr("d", path)
//           .on("click", function(d) {
//               var html = "";
//               var dataArray = {};

//               //dataArray += id_name_map[d.id];
    
//               html += "<div class=\"tooltip_kv\">";
//               html += "<span class=\"tooltip_key\">";
//               html += id_name_map[d.id];
//               html += "</span>";
//               html += "</div>";
              
//               for (var i = 1; i < Object.keys(data[0]).length; i++) {
//                 html += "<div class=\"tooltip_kv\">";
//                 html += "<span class='tooltip_key'>";
//                 html += Object.keys(data[0])[i];
//                 html += "</span>";
//                 html += "<span class=\"tooltip_value\">";
//                 html += valueFormat(dataMap[id_name_map[d.id]][Object.keys(data[0])[i]]);
//                 html += "";
//                 html += "</span>";
//                 html += "</div>";

//                 dataArray[Object.keys(data[0])[i]] = valueFormat(dataMap[id_name_map[d.id]][Object.keys(data[0])[i]]);
//               }
//                dataArray = [dataArray] 
//               //console.log(html)
//               console.log(dataArray)

// //dataArray2 = [{2001: 40, 2002: 40},{2001: 40, 2002: 40}]

//               YearList = [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016]

//               var svgWidth=900;
//               var svgHeight=200;
//               var subChartWidth=svgWidth/dataArray.length;
//               console.log(subChartWidth)

//               //////////////////plot bar charts/////////////////////
//               //settings for bar chart
//               var xStartLoc=30; //the left offset from canvas to the first bar
//               var spaceBetweenBar=5;
//               var yStartLoc=120; // the top offset from canvas to the bottom of the bar.
//               var width=10; //width of bar

//               var heightRange = {min:0, max:120}

//               var heightScale = d3.scale.linear()
//                 .domain([0,100])
//                 .range([heightRange.min, heightRange.max]);


//               var dataCompDIV = d3.select('body')
//                   .append('div')
//                   .attr("class","barCharts");

//               var dataCompTitle=dataCompDIV.append('h3')
//                   .text("Bar Charts")

//               var dataCompSVG=dataCompDIV.append('svg')
//                   .attr('width', svgWidth)
//                   .attr('height', svgHeight);

//               var dataCompG=dataCompSVG.selectAll('rect')
//                   .data(dataArray)
//                   .enter();

//                   //sdfdf

//               // var dataCompHeightScale=d3.scale.linear()
//               //     .domain([dataArray.min,dataArray.max])
//               //     .range([0, 100]);

//         colorList=["green","green","green", "green", "green","green","green", "green", "green","green","green", "green", "green","green","green", "green"];

//         function plotEachBar(colorofBar, xStart, fieldName) {

//             var barForSingleProject = dataCompG
//                 .append('rect')
//                 .attr('class', fieldName)
//                 .attr('x', function(d,i){return xStartLoc+xStart+i*subChartWidth})
//                 .attr('y', function(d){return yStartLoc - heightScale(d[fieldName])})
//                 .attr('height', function(d){return heightScale(d[fieldName])})
//                 .attr('width', width)
//                 .style('fill', colorofBar);

//             // var labelForEach = chartCompG.append('text')
//             //     .text(fieldName)
//             //     .attr('x', function(d,i){ return xStartLoc+xStart+i*subChartWidth})
//             //     .attr('y', yStartLoc+10)

//             return (barForSingleProject)

//         }
//         for(let i in YearList){
//           plotEachBar(colorList[i],i*(width+spaceBetweenBar),YearList[i])

//     }



              
//               $("#tooltip-container").html(html);
//               $(this).attr("fill-opacity", "0.7");
//               $("#tooltip-container").show();
              
//               var coordinates = d3.mouse(this);
              
//               var map_width = $('.states-choropleth')[0].getBoundingClientRect().width;
              
//               if (d3.event.layerX < map_width / 2) {
//                 d3.select("#tooltip-container")
//                   .style("top", (d3.event.layerY + 15) + "px")
//                   .style("left", (d3.event.layerX + 15) + "px");
//               } else {
//                 var tooltip_width = $("#tooltip-container").width();
//                 d3.select("#tooltip-container")
//                   .style("top", (d3.event.layerY + 15) + "px")
//                   .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
//               }
//           })
//           .on("mouseout", function() {
//                   $(this).attr("fill-opacity", "1.0");
//                   $("#tooltip-container").hide();
//               });


    
//       svg.append("path")
//           .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
//           .attr("class", "states")
//           .attr("transform", "scale(" + SCALE + ")")
//           .attr("d", path);
//     }
    
//     drawMap(config.defaultValue);
    
//     option_select.on("change", function() {
//       drawMap($("#selectors4").find(".option-select").val());
//     });
  
  
//   });

//   });

// });















