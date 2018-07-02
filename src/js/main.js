data = [];
cummulativeEpsilon = 0;

function generateData(size) {
  data = [];
  histogramData = [];
  cummulativeEpsilon = 0;

  var htmlContent = "<table width='100%'><tr><th>Gender</th><th>Age</th><th>Survival chances</th><th>Illness</th></tr>"

  for (var i = 0; i < size; i++) {
    var age = Math.round(Math.random() * 100);
    var gender = Math.round(Math.random());
    if(gender == 0){
      gender = "male";
    }else{
      gender = "female";
    }
    var survivalChances = Math.round((Math.max(0, 1 - age / 200) - Math.random() * 0.2) * 100) / 100;
    var illness = "cold";
    if (Math.random() < 0.05 + age / 300.0) {
      illness = "cancer";
    }
    if (gender == 0 && Math.random() < 0.20) {
      illness = "aids";
    }
    if (gender == 1 && Math.random() < 0.20) {
      illness = "aids";
    }

    if (illness == "cold") {
      survivalChances = Math.round((Math.max(0, 1 - age / 400 * Math.random()) - Math.random() * 0.05) * 100) / 100;
    }

    data.push({gender: gender, age: age, survivalChances: survivalChances, illness: illness});
    htmlContent += "<tr><td>" + gender + "</td><td>" + age + "</td><td>" + Math.round(survivalChances * 100) + "%</td><td>" + illness + "</td></tr>";
  }
  htmlContent += "</table>";

  var win = window.open("", "Generated data", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=200,top="+(screen.height-400)+",left="+(screen.width-840));
  win.document.body.innerHTML = "<html><head><title>Generated data</title></head><body>"+htmlContent+"</body></html>";
}

function sgn(x) {
  return x < 0 ? -1 : 1;
}

// From wikipedia:
// Lap(X) = mu - b sgn(U) ln (1-2|U|) where U is a random variable between -0.5 and 0.5
function laplace(mu, b) {
  var U = Math.random() - 0.5;
  return mu - (b * sgn(U) * Math.log(1 - 2 * Math.abs(U)));
}

function privatize(F, deltaF, epsilon) {
  return F + laplace(0.0, deltaF / epsilon);
}

function updateSensitivity(){
  var radios = document.getElementsByName('method');

  for (var i = 0, length = radios.length; i < length; i++)
  {
    if (radios[i].checked)
    {
      // do whatever you want with the checked radio
      if(radios[i].value === "count"){
        document.getElementById("sensitivity").innerHTML = "&Delta;f: 1";
      }
      if(radios[i].value === "average"){
        document.getElementById("sensitivity").innerHTML = "&Delta;f: 1/n ";
      }
      if(radios[i].value === "max"){
        document.getElementById("sensitivity").innerHTML = "&Delta;f: Range(field)";
      }
    }
  }
}

function performMethod(){
  var radios = document.getElementsByName('method');
  var epsilon = Number(document.getElementById("epsilon").value);
  var selector = document.getElementById("selector").value;

  for (var i = 0, length = radios.length; i < length; i++)
  {
    if (radios[i].checked)
    {
      // do whatever you want with the checked radio
      if(radios[i].value === "count"){
        eval("var output  = count(epsilon, val => "+selector+");");
        cummulativeEpsilon += epsilon;
        updateDiagram(output);
        break;
      }
      if(radios[i].value === "average"){
        eval("var output  = average(epsilon, val => "+selector+");");
        cummulativeEpsilon += epsilon;
        updateDiagram(output);
        break;
      }
      if(radios[i].value === "max"){
        eval("var output  = average(epsilon, val => "+selector+");");
        cummulativeEpsilon += epsilon;
        updateDiagram(output);
        break;
      }
      // only one radio can be logically checked, don't check the rest

    }
  }

}

function count(epsilon, method) {
  var trueValue = data.reduce((val1, val2) => val1 + (method(val2) ? 1 : 0), 0);
  var privatizedValue = privatize(trueValue, 1, epsilon);
  histogramData.push(privatizedValue);

  console.log("epsilon: "+epsilon);

  var b = 1 / epsilon;

  return {real: trueValue, privatized: privatizedValue, b: b};
}

function updateDiagram(queryOutput){

  document.getElementById("trueValue").innerHTML = queryOutput.real;
  document.getElementById("privatizedValue").innerHTML = queryOutput.privatized;
  document.getElementById("cummulativeEpsilon").innerHTML = cummulativeEpsilon;
  var trace1 = {
    x: [],
    y: [],
    type: 'scatter'
  };

  var trace2 = {
    x: histogramData,
    type: 'histogram',
    opacity: 0.75,
    xbins: {
      end: queryOutput.real * 2,
      size: queryOutput.b/3,
      start: 0

    },
    yaxis: 'y2'
  };

  for (var x = 0; x < queryOutput.real * 2; x += 0.1) {
    trace1.x.push(x);
    trace1.y.push(1 / (2 * queryOutput.b) * Math.exp(-Math.abs(queryOutput.real - x) / queryOutput.b));
  }

  var layout = {
    title: 'expected and real distribution',
    yaxis: {title: 'probability density function'},
    yaxis2: {
      title: 'occurence count',
      titlefont: {color: 'rgb(148, 103, 189)'},
      tickfont: {color: 'rgb(148, 103, 189)'},
      overlaying: 'y',
      side: 'right'
    },
    shapes: [

      //line vertical

      {
        type: 'line',
        x0: queryOutput.privatized,
        y0: 0,
        x1: queryOutput.privatized,
        y1: Math.max(...trace1.y),
        line: {
          color: 'rgb(255, 0, 0)',
          width: 3
        }
      }
    ]
  };

  var plotdata = [trace1, trace2];

  Plotly.newPlot('plot', plotdata, layout);

}

window.onload = function(){
  updateSensitivity();
}
