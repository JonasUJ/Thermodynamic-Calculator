var element_template;
var suggestion_template;
var data;
var searcher;

function onload() {
    var request = new XMLHttpRequest();
    request.open("GET", "values.json", true);
    request.send(null)
    request.onreadystatechange = function() {
        if ( request.readyState === 4 && request.status === 200 ) {
            data = JSON.parse(request.responseText);
            searcher = new FuzzySearch(data, ["name", "other"], { sort: true });
        }
    }

    element_template = document.querySelector("#element-template");
    suggestion_template = document.querySelector("#suggestion-template");
    var input_containers = document.querySelectorAll(".element-container");
    input_containers.forEach(p => addElement(p));
}

function addElement(parent) {
    var el = document.importNode(element_template.content, true);
    elem = el.querySelector(".element");
    elem.setAttribute("data-name", parent.getAttribute("data-title") + " #" + (parent.children.length + 1));
    refreshTitle(elem);
    parent.appendChild(el);
}

function addSuggestion(o, parent) {
    var sug = document.importNode(suggestion_template.content, true);
    s = sug.querySelector(".suggestion");
    s.setAttribute("data-formula", o.name);
    s.setAttribute("data-state", o.state);
    sug.querySelector(".suggestion-formula").innerHTML = formatFormula(1, o.name, o.state);
    sug.querySelector(".suggestion-other").innerHTML = o.other;
    sug.querySelector("#H").innerHTML = o.H ? o.H : '-';
    sug.querySelector("#S").innerHTML = o.S ? o.S : '-';
    sug.querySelector("#G").innerHTML = o.G ? o.G : '-';
    parent.appendChild(sug);
}

function buttonClick(btn) {
    var elem_container = btn.parentNode.parentNode.querySelector(".element-container");
    if (btn.id == "add") {
        addElement(elem_container);
    }
    else if (btn.id == "remove" && elem_container.children.length > 1) {
        elem_container.removeChild(elem_container.lastChild);
    }
}

function suggestionObject(elem) {
    return o = {
        formula: elem.getAttribute("data-formula"),
        state: elem.getAttribute("data-state"),
        H: elem.querySelector("#H").innerHTML,
        S: elem.querySelector("#S").innerHTML,
        G: elem.querySelector("#G").innerHTML,
    };
}

function suggestionClick(elem) {
    o = suggestionObject(elem);
    parent = elem.parentNode.parentNode.parentNode;
    parent.querySelector("#formula").value = o.formula;
    parent.querySelector("#state").value = o.state;
    if (o.H != '-') { parent.querySelector("#H").value = o.H; }
    if (o.S != '-') { parent.querySelector("#S").value = o.S; }
    if (o.G != '-') { parent.querySelector("#G").value = o.G; }
    refreshTitle(parent);
    parent.querySelector(".element-suggestions-wrapper").classList.add("hidden");
}

function getElements() {
    o = []
    elems = document.querySelectorAll(".element");
    elems.forEach(el => o.push({
        type: el.parentNode.getAttribute("data-title"),
        co: el.querySelector("#coefficient").value,
        formula: el.querySelector("#formula").value,
        state: el.querySelector("#state").value,
        H: el.querySelector("#H").value,
        S: el.querySelector("#S").value,
        G: el.querySelector("#G").value,
    }));
    return o;
}

function doCalculation(elems) {
    o = {
        H: 0,
        S: 0,
        G: 0,
        H_missing: [],
        S_missing: [],
        G_missing: []
    };

    var validH, validS, validG = true;
    var sumHR = 0, sumHP = 0, sumSR = 0, sumSP = 0, sumGR = 0, sumGP = 0;

    function isValid(num) {
        return /^-?\d+(\.\d+)?$/.test(num);
    }

    elems.forEach(el => {
        if (!isValid(el.H)) {
            o.H_missing.push(el.formula);
            validH = false;
        } else {
            if (el.type == "Reagent") {
                sumHR += el.co * el.H
            } else {
                sumHP += el.co * el.H
            }
        }
        if (!isValid(el.S)) {
            o.S_missing.push(el.formula);
            validS = false;
        } else {
            if (el.type == "Reagent") {
                sumSR += el.co * el.S
            } else {
                sumSP += el.co * el.S
            }
        }
        if (!isValid(el.G)) {
            o.G_missing.push(el.formula);
            validG = false;
        } else {
            if (el.type == "Reagent") {
                sumGR += el.co * el.G
            } else {
                sumGP += el.co * el.G
            }
        }
    })

    o.H = sumHP - sumHR;
    o.S = sumSP - sumSR;
    o.G = sumGP - sumGR;
    return o;
}

function calculateClick(btn) {
    btn.blur();
    elems = getElements();
    res = doCalculation(elems);
    resdiv = document.querySelector(".results");
    resdiv.innerHTML = "H = " + res.H + "<br>S = " + res.S + "<br>G = " + res.G;
}

function formatFormula(co, text, state) {
    var res = "";
    var sup = false;
    var sub = false;
    for (var i = 0; i < text.length; i++) {
        if (sup) {}
        else if (text[i] == '-' || text[i] == '+') {
            sup = true;
            if (sub) {
                sub = false;
                res += "</sub>";
            }
            res += "<sup>";
        } else if (text[i] == '*') {
            if (sub) {
                sub = false;
                res += "</sub>";
            }
            res += '•';
            continue;
        } else if (text[i-1] != '*' && text[i-1] != '.' && /^\d$/.test(text[i]) && /^[^\d]$/.test(text[i-1])) {
            sub = true;
            res += "<sub>";
        } else if (/^[^\d]$/.test(text[i]) && sub) {
            sub = false;
            res += "</sub>";
        }
        res += text[i];
    }

    if (sub) {
        res += "</sub>";
    }
    if (sup) {
        res += "</sup>";
    }
    if (co != '1') {
        res = co + ' ' + res;
    }
    if (state != "") {
        if (state == 'l') {
            state = 'ℓ';
        }
        res += " (" + state + ')';
    }

    return res;
}

function refreshTitle(elem) {
    var title = elem.querySelector(".element-title");
    var co = elem.querySelector("#coefficient");
    var formula = elem.querySelector("#formula");
    var state = elem.querySelector("#state");

    var coVal = co.value;
    if (!co.checkValidity()) {
        coVal = '1';
    }

    if (coVal == '1' && formula.value == '' && state.value == '') {
        title.innerHTML = elem.getAttribute("data-name");
    } else {
        title.innerHTML = formatFormula(coVal, formula.value, state.value);
    }
}

function updateSuggestions(val, state, container) {
    container.innerHTML = '';
    if (val == '') {
        container.parentNode.classList.add("hidden")
        return;
    }
    var res = searcher.search(val);
    if (state != '') {
        res = res.filter(r => r.state == state);
    }
    if (res.length > 0) {
        for (var i = 0; i < (res.length < 16 ? res.length : 16); i++) {
            addSuggestion(res[i], container);
        }
        container.parentNode.classList.remove("hidden")
    } else {
        container.parentNode.classList.add("hidden")
    }
}

function coEdit(inp) {
    var elem = inp.parentNode.parentNode;
    refreshTitle(elem);
}

function formulaEdit(inp) {
    var elem = inp.parentNode.parentNode;
    refreshTitle(elem);
    updateSuggestions(inp.value, elem.querySelector("#state").value, elem.querySelector(".element-suggestions"));
}

function stateEdit(inp) {
    var elem = inp.parentNode.parentNode;
    refreshTitle(elem);
    updateSuggestions(elem.querySelector("#formula").value, inp.value, elem.querySelector(".element-suggestions"));
}
