Operation = {
    compare: 0,
    swap: 1,
    max: 2
};

OperationLabels = [];
OperationLabels[Operation.compare] = "Comparisons: ";
OperationLabels[Operation.swap] = "Swaps: ";

function refresh(state) {
    for (var i = 0; i < state.array.length; i++) {
        var item = state.array[i];
        var element = state.elements[i];
        var value = item.value;
        var label = "";
        for (var j = 0; j < value; j++) {
            label += "-";
        }
        element.innerText = label;

        var className = "";
        if (item.comparing) {
            className = className.concat("comparing");
        }

        if (item.swapping) {
            className = className.concat(" swapping");
        }

        element.className = className;
    }

    for (var i = 0; i < Operation.max; i++) {
        state.stats[i].element.innerText = OperationLabels[i] + state.stats[i].value;
    }
}

function areOutOfOrder(state, i , j) {
    var array = state.array;
    var a = array[i];
    var b = array[j];

    state.stats[Operation.compare].value++;
    a.comparing = true;
    b.comparing = true;

    return a.value > b.value;
}

function swapItems(state, i, j) {
    var array = state.array;
    var a = array[i];
    var b = array[j];

    state.stats[Operation.swap].value++;
    a.comparing = true;
    b.comparing = true;
    a.swapping = true;
    b.swapping = true;

    array[i] = b;
    array[j] = a;
}

function* bubbleSort(state) {
    var array = state.array;
    var length = array.length;
    var swapped = false;
    do {
        swapped = false;

        for (var i = 0; i < length - 1; i++) {
            yield;
            if (areOutOfOrder(state, i, i + 1)) {
                yield;
                swapItems(state, i, i + 1);
                swapped = true;
            }
        }
    } while (swapped);
}

function* selectionSort(state) {
    var array = state.array;
    var length = array.length;
    for (var i = 0; i < length - 1; i++) {
        var jMin = i;
        for (var j = i + 1; j < length; j++) {
            yield;
            if (areOutOfOrder(state, jMin, j)) {
                jMin = j;
            }
        }

        if (jMin != i) {
            yield;
            swapItems(state, i, jMin);
        }
    }
}

function* insertionSort(state) {
    var array = state.array;
    for (var i = 1; i < array.length; i++) {
        for (var j = i; j > 0; j--) {
            yield;
            if (!areOutOfOrder(state, j - 1, j)) {
                break;
            }

            yield;
            swapItems(state, j - 1, j);
        }
    }
}

function* quickSortInternal(state, min, max) {
    if (min < max) {
        var pivotIndex = min;
        var i = min - 1;
        var j = max + 1;
        var p;
        while (true) {
            do {
                yield;
                i++;
            } while (areOutOfOrder(state, pivotIndex, i));

            do {
                yield;
                j--;
            } while (areOutOfOrder(state, j, pivotIndex));

            if (i >= j) {
                p = j;
                break;
            }

            yield;
            swapItems(state, i, j);
        }

        yield* quickSortInternal(state, min, p);
        yield* quickSortInternal(state, p + 1, max);
    }
}

function* quickSort(state) {
    yield* quickSortInternal(state, 0, state.array.length - 1)
}

function step(states) {
    var millisecondsPerStep = 25;

    var done = true;
    for (var i = 0; i < states.length; i++) {
        var state = states[i];
        var pastDone = state.done;
        if (!state.done) {
            done = false;

            var result = state.iterator.next();
            state.done = result.done;
        }

        if (!state.pastDone) {
            refresh(state);
            state.pastDone = pastDone;

            // Reset all items
            for (var j = 0; j < state.array.length; j++) {
                var item = state.array[j];
                item.comparing = false;
                item.swapping = false;
            }
        }
    }

    if (!done) {
        setTimeout(function () {
            step(states);
        }, millisecondsPerStep);
    }
}

var setupStarted = false;
function go() {
    if (!setupStarted) {
        setupStarted = true;

        var itemCount = 30;
        var maxValue = itemCount;
        var algorithms = [
            { name: "Bubble Sort", func: bubbleSort },
            { name: "Selection Sort", func: selectionSort },
            { name: "Insertion Sort", func: insertionSort },
            { name: "Quick Sort", func: quickSort }
        ];

        var array = [];
        for (var i = 0; i < itemCount; i++) {
            array.push({
                value: Math.floor(Math.random() * maxValue),
                comparing: false,
                swapping: false
            });
        }

        var states = [];
        for (var i = 0; i < algorithms.length; i++) {
            var stats = [];
            for (var j = 0; j < Operation.max; j++) {
                stats[j] = {
                    value: 0,
                    element: null
                };
            }

            states[i] = {
                array: [],
                elements: [],
                stats: stats
            };

            for (var j = 0; j < itemCount; j++) {
                states[i].array[j] = array[j];
            }
        }
 
        var content = document.getElementById("content");
        var table = document.createElement("table");
        var tr = document.createElement("tr");
        for (var i = 0; i < algorithms.length; i++) {
            var th = document.createElement("th");
            th.innerText = algorithms[i].name;
            tr.appendChild(th);
        }
        table.appendChild(tr);

        for (var i = 0; i < Operation.max; i++) {
            var tr = document.createElement("tr");
            for (var j = 0; j < algorithms.length; j++) {
                tr.appendChild(states[j].stats[i].element = document.createElement("td"));
            }
            table.appendChild(tr);
        }

        for (var i = 0; i < itemCount; i++) {
            var tr = document.createElement("tr");
            for (var j = 0; j < states.length; j++) {
                var td = document.createElement("td");
                states[j].elements[i] = td;
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        content.appendChild(table);
    
        for (var i = 0; i < states.length; i++) {
            var state = states[i];
            refresh(state);
            state.iterator = algorithms[i].func(state);
            state.done = false;
        }

        step(states);
    }
}