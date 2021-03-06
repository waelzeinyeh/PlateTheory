var colors = ['31, 119, 180', '255, 127, 14', '44, 160, 44', '214, 39, 40']
document.querySelectorAll(".tableFixHead").forEach(el => el.addEventListener("scroll", tableFixHead));

const column = document.getElementById("column");
column.width = window.innerWidth;
column.height = 100;

const ctx = column.getContext("2d");
var nb_cpds = 1;
var frame = 0;
var play_list;
var eq_list;
var nb_plates = 20;
var nb_cpd_input = document.getElementById("nb_cpd_input");

var nb_plt_input = document.getElementById("nb_plt_input");
var wait1 = document.getElementById("wait1");
wait1.style.visibility = "hidden";
nb_cpd_input.value = 1;
nb_plt_input.value = 20;
var c_table = document.getElementById("c_table");
var play_but = document.getElementById("play_but");
var eq_but = document.getElementById("eq_but");
var re_but = document.getElementById("re_but");
var cpd_but = document.getElementById("cpd_but");
var nb_but = document.getElementById("nb_but");
var info_table_div = document.getElementById("info_table_div");
var info_dead_div = document.getElementById("info_dead_div");
var info_nb_div = document.getElementById("info_nb_div");
var info_K_div = document.getElementById("info_K_div");
var autoscroll = document.getElementById("autoscroll");
var interv;
var calc_head = document.getElementById("calc_head");
var calc_body = document.getElementById("calc_body");

play_but.addEventListener("click", play);
eq_but.addEventListener("click", eq);
re_but.addEventListener("click", reset);
nb_but.addEventListener("click", nb_but_click);
cpd_but.addEventListener("click", cpd_but_click);
nb_but.disabled = true;
cpd_but.disabled = true;

var init_data = [];
init_data.push({
    x: [],
    y: [],
});
Plotly.newPlot(play_graph, init_data, {
    xaxis: {
        title: "Time (minutes)"
    },
    yaxis: {
        title: "Signal (arbitrary unit)"
    },
    margin: {
        t: 50,
        b: 50,
        l: 50,
        r: 50
    },
    font: {
        size: 10
    }
}, {
    staticPlot: true,
    responsive: true
});
new_table();


///////////////////////////////////////////////////////////////////////////////////////////////////////////

function range(start, end, step, digits) {
    var j = [];
    for (var i = start; i < end; i = i + step) {
        j.push(i.toFixed(digits));
    }
    return j;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function Compound(lambda, plates, c0) {
    this.lambda = lambda;
    this.plates = plates;
    this.column_conc = [];
    this.stat = [];
    this.mobil = [];
    this.c0 = c0;
    this.last_plate = [];
    this.mobil[0] = [c0];
    this.stat[0] = [0];
    this.last_plate[0] = 0;
    var n = 1;
    while (n <= this.plates - 1) {
        this.mobil[0].push(0);
        this.stat[0].push(0);
        n = n + 1
    }
    this.eq = function (step) {
        var n = 0;
        if (this.lambda != 0) {
            while (n <= this.plates - 1) {
                var add = this.stat[step][n] + this.mobil[step][n];
                this.stat[step][n] = add * this.lambda / (1 + this.lambda);
                this.mobil[step][n] = this.stat[step][n] / this.lambda;
                n = n + 1
            }
        }
    }
    this.move = function (step) {
        var n = 0;
        this.mobil.push([]);
        this.stat.push([]);
        this.last_plate.push(this.mobil[step][this.plates - 1]);
        while (n < this.plates - 1) {
            this.mobil[step + 1][n + 1] = this.mobil[step][n];
            n = n + 1
        }
        this.mobil[step + 1][0] = 0;
        n = 0;
        while (n <= this.plates - 1) {
            this.stat[step + 1][n] = this.stat[step][n];
            n = n + 1
        }
    }
    this.calc_column_conc = function (t, dead_t) {
        this.column_conc = [];
        var n = 1;
        var v = t * (1 / (1 + this.lambda)) / dead_t * this.plates;
        var c;
        while (n <= this.plates) {
            c = this.c0 / (1 + this.lambda) / Math.sqrt(2 * Math.PI * n) * ((v / n) ** n) * Math.exp(n - v);
            if (isNaN(c)) {
                c = 0
            };
            this.column_conc.push(c);
            n = n + 1;
        }
    }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function verify_input() {
    if (nb_cpd_input.value === "" || parseInt(nb_cpd_input.value, 10) < 1) {
        nb_cpd_input.value = nb_cpds;
    }

    if (parseInt(nb_cpd_input.value, 10) > 4) {
        nb_cpd_input.value = 4;
    }


    if (nb_plt_input.value === "" || parseInt(nb_plt_input.value, 10) < 10) {
        nb_plt_input.value = nb_plates;
    }

    if (parseInt(nb_plt_input.value, 10) > 2000) {
        nb_plt_input.value = 2000;
    }



    var i = 0;
    while (i < nb_cpds) {
        if (document.getElementById("lambda_" + (i + 1)).value === "" || parseInt(document.getElementById("lambda_" + (i + 1)).value, 10) < 0) {
            document.getElementById("lambda_" + (i + 1)).value = 1
        }
        i = i + 1
    }

    nb_plates = parseInt(nb_plt_input.value, 10);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function nb_cpds_or_plts_change() {
    verify_input();
    if (nb_cpds < parseInt(nb_cpd_input.value, 10)) {
        var n = nb_cpds;
        while (n < parseInt(nb_cpd_input.value, 10)) {
            n = n + 1;
            var row = c_table.insertRow(-1);
            var c0 = row.insertCell(0);
            var c1 = row.insertCell(1);
            c0.innerHTML = "Compound " + n + " :";
            c0.style = "color:rgb(" + colors[n - 1] + ")";
            c1.innerHTML = "<input id='lambda_" + n + "' type='number' min='0' step='0.01' value='1' oninput='cpd_but_act()'></td>";
        }
        nb_cpds = parseInt(nb_cpd_input.value, 10);
    }
    if (nb_cpds > parseInt(nb_cpd_input.value, 10)) {
        var n = nb_cpds;
        while (n > parseInt(nb_cpd_input.value, 10)) {
            c_table.deleteRow(-1);
            n = n - 1
        }
        nb_cpds = parseInt(nb_cpd_input.value, 10)
    }
    new_table();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function play() {
    var flow_input = document.getElementById("flow_input");
    var dead_vol_input = document.getElementById("dead_vol_input");
    if (flow_input.value === "" || parseFloat(flow_input.value) <= 0) {
        flow_input.value = "1";
    }
    if (dead_vol_input.value === "" || parseFloat(dead_vol_input.value) <= 0) {
        dead_vol_input.value = "1";
    }
    var dead_vol = dead_vol_input.value;
    var flow = flow_input.value;
    var dead_time = dead_vol / flow;
    if (play_but.value === "Play") {
        play_but.value = "Stop";
        clearInterval(interv);
        fill_old();
        var t = 0;
        var frame_nb_for_plot = 0;
        var sum = [];
        var xs = [];
        var t_step = dead_time / 100;
        xs[0] = 0;
        var data = [{
            x: xs,
            y: sum,
            mode: "lines",
            line: {
                color: "black"
            },
            hovertemplate: "Time: %{x:.2f}<br>Signal: %{y:.2f}<extra></extra>"
        }];
        var y_range = 0;
        var y_max = [];
        Plotly.newPlot(play_graph, data, {
            xaxis: {
                title: "Time (minutes)",
                fixedrange: true
            },
            yaxis: {
                title: "Signal (arbitrary unit)",
                fixedrange: true
            },
            margin: {
                t: 50,
                b: 50,
                l: 50,
                r: 50
            },
            font: {
                size: 10
            },
            hovermode: "closest"
        }, {
            staticPlot: false,
            responsive: true
        });

        for (var i = 0; i < nb_cpds; i++) {
            y_max[i] = 1
        }

        interv = setInterval(function () {
            sum[frame_nb_for_plot] = 0;
            var cpd_nb = 0;
            var m;

            while (cpd_nb < nb_cpds) {
                play_list[cpd_nb].calc_column_conc(t, dead_time);
                sum[frame_nb_for_plot] = sum[frame_nb_for_plot] + play_list[cpd_nb].column_conc[nb_plates - 1];
                m = Math.max(...play_list[cpd_nb].column_conc);
                if (Number.isFinite(m) && m > play_list[cpd_nb].column_conc[nb_plates - 1]) {
                    y_max[cpd_nb] = m
                }
                cpd_nb = cpd_nb + 1
            }
            xs[frame_nb_for_plot] = t;

            y_range = Math.max(...sum);
            if (y_range < 0.1) {
                y_range = 0.1
            }
            layout_update = {
                yaxis: {
                    title: "Signal (arbitrary unit)",
                    range: [0, y_range + 0.1],
                    fixedrange: true
                }
            };

            Plotly.relayout(play_graph, layout_update);

            ctx.clearRect(0, 0, column.width, column.height);
            i = 0;
            while (i < nb_cpds) {
                var plate_nb = 0;
                var alpha;
                while (plate_nb <= nb_plates - 1) {
                    alpha = (play_list[i].column_conc[plate_nb]) / y_max[i];
                    ctx.fillStyle = 'rgba(' + colors[i] + ',' + alpha + ')';
                    ctx.fillRect(column.width / nb_plates * plate_nb - 1, 0, column.width / nb_plates + 1, 100);
                    plate_nb = plate_nb + 1
                }
                i = i + 1
            }

            t = t + t_step;
            frame_nb_for_plot = frame_nb_for_plot + 1;
        }, 100)
    } else if (play_but.value === "Stop") {
        play_but.value = "Play";
        clearInterval(interv)
    };
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function new_table() {
    Plotly.purge(eq_graph);
    Plotly.purge(chrom_graph);
    eq_but.value = "Equilibrate";
    frame = 0;
    calc_head.innerHTML = "";
    var r0, r1, c, c0, c1;
    r0 = document.createElement("tr");
    calc_head.appendChild(r0);
    r1 = document.createElement("tr");
    calc_head.appendChild(r1);


    c = document.createElement("th");
    c1 = document.createElement("th");
    c1.style["color"] = 'rgb(0,0,0)';
    c1.innerHTML = "Plate number";
    c1.colSpan = "1";
    r0.appendChild(c);
    r1.appendChild(c1);
    calc_body.innerHTML = "";
    var i = 0;
    while (i < nb_plates) {
        row = calc_body.insertRow(-1);
        c = row.insertCell(-1);
        c.innerHTML = (i + 1);
        i = i + 1
    }


    i = 0;
    while (i < nb_cpds) {
        c = document.createElement("th");
        c0 = document.createElement("th");
        c1 = document.createElement("th");
        c.colSpan = "2";
        c.style["color"] = 'rgb(' + colors[i] + ')';
        c.innerHTML = "Compound " + (i + 1);
        c0.style["color"] = 'rgb(' + colors[i] + ')';
        c0.innerHTML = "Stationary phase ";
        c1.style["color"] = 'rgb(' + colors[i] + ')';
        c1.innerHTML = "Mobile phase ";
        r0.appendChild(c);
        r1.appendChild(c0);
        r1.appendChild(c1);
        i = i + 1;
    }


    var j = 0;
    while (j < nb_plates) {
        row = calc_body.rows[j];
        i = 0;
        while (i < nb_cpds) {
            c0 = row.insertCell(-1);
            c1 = row.insertCell(-1);
            c0.innerHTML = "0.00";
            c0.style["color"] = 'lightgrey';
            if (j === 0) {
                c1.innerHTML = "100.00";
                c1.style["color"] = 'rgb(' + colors[i] + ')';
            } else {
                c1.innerHTML = "0.00";
                c1.style["color"] = 'lightgrey';
            };
            i = i + 1;
        }
        j = j + 1;
    }

    eq_list = [];
    play_list = [];
    i = 0;
    while (i < nb_cpds) {
        var cpd = new Compound(parseFloat(document.getElementById("lambda_" + (i + 1)).value), nb_plates, 100);
        eq_list.push(cpd);
        play_list.push(cpd);
        i = i + 1
    }
    cpd_but.disabled = true;

    var k = 0;
    var eq_data = [];
    while (k < nb_cpds) {
        var ys = eq_list[k].mobil[0];
        var xs = range(1, 10, 1, 0);
        eq_data.push({
            x: xs,
            y: ys,
            name: "Compound " + (k + 1),
            mode: "lines+markers"
        });
        k = k + 1
    }

    Plotly.react(eq_graph, eq_data, {
        title: "Concentration<br>on the column",
        xaxis: {
            title: "Plate number"
        },
        yaxis: {
            title: "Concentration on the plate (%)<br>(mobile + stat. phases)",
            range: [0, 110]
        },
        showlegend: false,
        margin: {
            t: 50,
            b: 50,
            l: 50,
            r: 50
        },
        font: {
            size: 10
        }

    }, {
        staticPlot: true,
        responsive: true
    });

    k = 0;
    var chrom_data = [];
    while (k < nb_cpds) {
        var ys = 0;
        var xs = 0;
        chrom_data.push({
            x: xs,
            y: ys,
            name: "Compound " + (k + 1),
            mode: "lines+markers"
        });
        k = k + 1
    }

    Plotly.react(chrom_graph, chrom_data, {
        title: "Concentration<br>at the column output",
        xaxis: {
            title: "Nb of plates<br>pushed on the column",
            range: [0, 10]
        },
        yaxis: {
            title: "Concentration (%)",
            range: [0, 110]
        },
        showlegend: false,
        margin: {
            t: 50,
            b: 50,
            l: 50,
            r: 50
        },
        font: {
            size: 10
        }

    }, {
        staticPlot: true,
        responsive: true
    });

    fill_old();
    var calc_table = document.getElementById("calc_table");
    var rows = calc_table.getElementsByTagName("tr");
    calc_table.parentNode.scrollTop = rows[0].offsetTop - rows[0].offsetHeight;
    tableFixHead();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function eq() {
    clearInterval(interv);
    play_but.value = "Play";
    wait1.style.visibility = "visible";
    var to_plate, c0, c1;
    setTimeout(() => {
        fill_old();
        if (eq_but.value === "Equilibrate") {
            i = 0;
            while (i < nb_cpds) {
                eq_list[i].eq(frame);
                i = i + 1
            }

            var j = 0;
            if (frame < nb_plates) {
                to_plate = frame
            } else {
                to_plate = nb_plates - 1
            }

            while (j <= to_plate) {
                var row = calc_body.rows[j];
                i = 0;
                while (i < nb_cpds) {
                    c0 = row.cells[i * 2 + 1];
                    c1 = row.cells[i * 2 + 2];
                    if (eq_list[i].stat[frame][j] < 0.01 && eq_list[i].stat[frame][j] != 0) {
                        c0.innerHTML = "&#8776; 0"
                    } else {
                        c0.innerHTML = eq_list[i].stat[frame][j].toFixed(2)
                    }
                    if (eq_list[i].mobil[frame][j] < 0.01 && eq_list[i].mobil[frame][j] != 0) {
                        c1.innerHTML = "&#8776; 0"
                    } else {
                        c1.innerHTML = eq_list[i].mobil[frame][j].toFixed(2)
                    }
                    if (eq_list[i].stat[frame][j] != 0) {
                        c0.style["color"] = 'rgb(' + colors[i] + ')';
                    } else {
                        c0.style["color"] = 'lightgrey';
                    }
                    if (eq_list[i].mobil[frame][j] != 0) {
                        c1.style["color"] = 'rgb(' + colors[i] + ')';
                    } else {
                        c1.style["color"] = 'lightgrey';
                    }
                    i = i + 1;
                }
                j = j + 1;
            }
            var k = 0;
            var eq_data = [];
            var y_eq;
            var y_range_eq = [];
            while (k < nb_cpds) {
                y_eq = eq_list[k].mobil[frame].map(function (num, idx) {
                    return num + eq_list[k].stat[frame][idx]
                });
                y_range_eq[k] = Math.max(...y_eq);
                if (y_range_eq[k] < 1) {
                    y_range_eq[k] = 1
                }
                var x_eq;
                if (frame <= 7) {
                    x_eq = range(1, 10, 1, 0)
                } else {
                    x_eq = range(1, frame + 3, 1, 0)
                };
                eq_data.push({
                    x: x_eq,
                    y: y_eq,
                    name: "Compound " + (k + 1),
                    mode: "lines+markers"
                });
                k = k + 1
            }
            k = 0;
            var y_range_chrom = [];
            var chrom_data = [];
            var y_chrom;
            while (k < nb_cpds) {
                y_chrom = eq_list[k].last_plate;
                y_range_chrom[k] = Math.max(...y_chrom);
                if (y_range_chrom[k] < 1) {
                    y_range_chrom[k] = 1
                }
                var x_chrom;
                x_chrom = range(0, frame + 2, 1, 0)
                chrom_data.push({
                    x: x_chrom,
                    y: y_chrom,
                    name: "Compound " + (k + 1),
                    mode: "lines+markers"
                });
                k = k + 1
            }
            var y_range;
            if (Math.max(...y_range_eq) > Math.max(...y_range_chrom)) {
                y_range = Math.max(...y_range_eq)
            } else {
                y_range = Math.max(...y_range_chrom)
            }
            Plotly.react(eq_graph, eq_data, {
                title: "Concentration<br>on the column",
                xaxis: {
                    title: "Plate number"
                },
                yaxis: {
                    title: "Concentration on the plate (%)<br>(mobile + stat. phases)",
                    range: [0, y_range * 1.1]
                },
                showlegend: false,
                margin: {
                    t: 50,
                    b: 50,
                    l: 50,
                    r: 50
                },
                font: {
                    size: 10
                }

            }, {
                staticPlot: true,
                responsive: true
            });

            Plotly.react(chrom_graph, chrom_data, {
                title: "Concentration<br>at the column output",
                xaxis: {
                    title: "Nb of plates<br>pushed on the column",
                    range: [0, frame]
                },
                yaxis: {
                    title: "Concentration (%)",
                    range: [0, y_range * 1.1]
                },
                showlegend: false,
                margin: {
                    t: 50,
                    b: 50,
                    l: 50,
                    r: 50
                },
                font: {
                    size: 10
                }

            }, {
                staticPlot: true,
                responsive: true
            });
            eq_but.value = "Push mobile phase"
        } else {
            var i = 0
            while (i < nb_cpds) {
                eq_list[i].move(frame);
                i = i + 1
            }

            var j = 0;
            if (frame < nb_plates - 1) {
                to_plate = frame + 1
            } else {
                to_plate = nb_plates - 1
            }
            while (j < to_plate + 1) {
                var row = calc_body.rows[j];
                i = 0;
                while (i < nb_cpds) {
                    c0 = row.cells[i * 2 + 1];
                    c1 = row.cells[i * 2 + 2];
                    if (eq_list[i].stat[frame + 1][j] < 0.01 && eq_list[i].stat[frame + 1][j] != 0) {
                        c0.innerHTML = "&#8776; 0"
                    } else {
                        c0.innerHTML = eq_list[i].stat[frame + 1][j].toFixed(2)
                    }
                    if (eq_list[i].mobil[frame + 1][j] < 0.01 && eq_list[i].mobil[frame + 1][j] != 0) {
                        c1.innerHTML = "&#8776; 0"
                    } else {
                        c1.innerHTML = eq_list[i].mobil[frame + 1][j].toFixed(2)
                    }

                    if (eq_list[i].stat[frame + 1][j] != 0) {
                        c0.style["color"] = 'rgb(' + colors[i] + ')';
                    } else {
                        c0.style["color"] = 'lightgrey';
                    }
                    if (eq_list[i].mobil[frame + 1][j] != 0) {
                        c1.style["color"] = 'rgb(' + colors[i] + ')';
                    } else {
                        c1.style["color"] = 'lightgrey';
                    }
                    i = i + 1;
                }
                j = j + 1;
            }
            eq_but.value = "Equilibrate";
            frame = frame + 1;
        }
        tableFixHead();
        if (autoscroll.checked) {
            var calc_table = document.getElementById("calc_table");
            var rows = calc_table.getElementsByTagName("tr");
            if (frame > nb_plates + 2) {
                calc_table.parentNode.scrollTop = rows[nb_plates].offsetTop - rows[0].offsetHeight
            } else if (frame > 3) {
                calc_table.parentNode.scrollTop = rows[frame - 3].offsetTop - rows[0].offsetHeight
            } else {
                calc_table.parentNode.scrollTop = rows[0].offsetTop - rows[0].offsetHeight
            }
        }
        wait1.style.visibility = "hidden";
    }, 50)
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function reset() {
    new_table();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function fill_old() {
    nb_cpd_input.value = nb_cpds;
    nb_plt_input.value = nb_plates;
    var i = 0;
    while (i < nb_cpds) {
        document.getElementById("lambda_" + (i + 1)).value = eq_list[i].lambda;
        i = i + 1
    }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function nb_but_act() {
    nb_but.disabled = false
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function cpd_but_act() {
    cpd_but.disabled = false
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function nb_but_click() {
    nb_but.disabled = true;
    clearInterval(interv);
    play_but.value = "Play";
    nb_cpds_or_plts_change()
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function cpd_but_click() {
    cpd_but.disabled = true;
    clearInterval(interv);
    play_but.value = "Play";
    verify_input();
    new_table()
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function tableFixHead(e) {
    const el = document.getElementById("calc_div");
    const sT = el.scrollTop;
    el.querySelectorAll("thead th").forEach(th =>
        th.style.transform = `translateY(${sT}px)`
    );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////


function info_table() {
    if (info_table_div.style.display == "block") {
        info_table_hide()
    } else {
        info_table_div.style.display = "block"
    }
}

function info_table_hide() {
    info_table_div.style.display = "none"
}

function info_dead() {
    if (info_dead_div.style.display == "block") {
        info_dead_hide()
    } else {
        info_dead_div.style.display = "block"
    }
}

function info_dead_hide() {
    info_dead_div.style.display = "none"
}

function info_nb() {
    if (info_nb_div.style.display == "block") {
        info_nb_hide()
    } else {
        info_nb_div.style.display = "block"
    }
    info_K_div.style.display = "none"
}

function info_nb_hide() {
    info_nb_div.style.display = "none"
}

function info_K() {
    if (info_K_div.style.display == "block") {
        info_K_hide()
    } else {
        info_K_div.style.display = "block"
    }
    info_nb_div.style.display = "none"
}

function info_K_hide() {
    info_K_div.style.display = "none"
}

function info_play() {
    if (info_play_div.style.display == "block") {
        info_play_hide()
    } else {
        info_play_div.style.display = "block"
    }
}

function info_play_hide() {
    info_play_div.style.display = "none"
}
