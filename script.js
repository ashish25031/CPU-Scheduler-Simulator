document.getElementById("algorithm").addEventListener("change", function () {
    document.getElementById("quantum").style.display = this.value === "RoundRobin" ? "block" : "none";
  });
  
  let processes = [];
  
  function addProcess() {
    let table = document.getElementById("processTable").querySelector("tbody");
    let row = table.insertRow(-1);
  
    row.innerHTML = `
      <td>${processes.length + 1}</td>
      <td><input type="number" class="arrival bg-gray-800 text-white p-2 rounded" placeholder="AT" /></td>
      <td><input type="number" class="burst bg-gray-800 text-white p-2 rounded" placeholder="BT" /></td>
    `;
  
    processes.push({ id: processes.length + 1, arrival: 0, burst: 0 });
  }
  
  function resetProcesses() {
    document.getElementById("processTable").querySelector("tbody").innerHTML = "";
    processes = [];
  }
  
  function runSimulation() {
    let loading = document.getElementById("loading");
    let output = document.getElementById("output");
    let timeTakenDisplay = document.getElementById("timeTaken");
    let averageTimes = document.getElementById("averageTimes");
    let downloadBtn = document.getElementById("downloadBtn");
  
    loading.classList.remove("hidden");
    output.classList.add("hidden");
    timeTakenDisplay.classList.add("hidden");
    averageTimes.classList.add("hidden");
    downloadBtn.classList.add("hidden");
  
    processes = [];
    document.querySelectorAll(".arrival").forEach((arrivalInput, index) => {
      const arrival = parseInt(arrivalInput.value);
      const burst = parseInt(document.querySelectorAll(".burst")[index].value);
      if (!isNaN(arrival) && !isNaN(burst)) {
        processes.push({ id: index + 1, arrival, burst });
      }
    });
  
    const algorithm = document.getElementById("algorithm").value;
    const quantum = algorithm === "RoundRobin" ? parseInt(document.getElementById("quantum").value) : null;
    const startTime = performance.now();
  
    setTimeout(() => {
      let resultData = [];
  
      if (algorithm === "FCFS") resultData = calculateFCFS(processes);
      else if (algorithm === "SJF") resultData = calculateSJF(processes);
      else if (algorithm === "RoundRobin") resultData = calculateRoundRobin(processes, quantum);
  
      const endTime = performance.now();
      const totalTime = (endTime - startTime).toFixed(2);
  
      output.innerHTML = generateTable(resultData);
      document.getElementById("ganttChart").innerHTML = generateGanttChart(resultData);
  
      loading.classList.add("hidden");
      output.classList.remove("hidden");
      timeTakenDisplay.classList.remove("hidden");
      timeTakenDisplay.innerHTML = `<strong>Time Taken:</strong> ${totalTime} ms`;
      averageTimes.innerHTML = calculateAverages(resultData);
      averageTimes.classList.remove("hidden");
      downloadBtn.classList.remove("hidden");
  
      showToast();
    }, 500);
  }
  
  function calculateFCFS(processes) {
    processes.sort((a, b) => a.arrival - b.arrival);
    let time = 0;
    let result = [];
  
    processes.forEach(p => {
      time = Math.max(time, p.arrival) + p.burst;
      result.push({ ...p, start: time - p.burst, completion: time, turnaround: time - p.arrival, waiting: time - p.arrival - p.burst });
    });
  
    return result;
  }
  
  function calculateSJF(processes) {
    let time = 0, result = [], readyQueue = [];
    let proc = [...processes];
  
    while (proc.length > 0 || readyQueue.length > 0) {
      readyQueue.push(...proc.filter(p => p.arrival <= time));
      proc = proc.filter(p => p.arrival > time);
  
      if (readyQueue.length === 0) {
        time++;
        continue;
      }
  
      readyQueue.sort((a, b) => a.burst - b.burst);
      let current = readyQueue.shift();
      time = Math.max(time, current.arrival) + current.burst;
      result.push({ ...current, start: time - current.burst, completion: time, turnaround: time - current.arrival, waiting: time - current.arrival - current.burst });
    }
  
    return result;
  }
  
  function calculateRoundRobin(processes, quantum) {
    let queue = [...processes.map(p => ({ ...p }))];
    let time = 0, result = [], remaining = queue.map(p => ({ ...p, remainingBurst: p.burst }));
  
    while (remaining.some(p => p.remainingBurst > 0)) {
      remaining.forEach(p => {
        if (p.remainingBurst > 0 && p.arrival <= time) {
          const slice = Math.min(quantum, p.remainingBurst);
          p.start = time;
          time += slice;
          p.remainingBurst -= slice;
          if (p.remainingBurst === 0) {
            result.push({ id: p.id, arrival: p.arrival, burst: p.burst, start: p.start, completion: time, turnaround: time - p.arrival, waiting: time - p.arrival - p.burst });
          }
        }
      });
      if (!remaining.some(p => p.arrival <= time && p.remainingBurst > 0)) {
        time++;
      }
    }
  
    return result.sort((a, b) => a.id - b.id);
  }
  
  function generateTable(data) {
    let html = `<table class="table-auto w-full text-center border">
      <thead class="bg-gray-700">
        <tr>
          <th class="p-2 border">PID</th>
          <th class="p-2 border">Arrival</th>
          <th class="p-2 border">Burst</th>
          <th class="p-2 border">Completion</th>
          <th class="p-2 border">Turnaround</th>
          <th class="p-2 border">Waiting</th>
        </tr>
      </thead><tbody>`;
    data.forEach(p => {
      html += `
        <tr>
          <td class="p-2 border">${p.id}</td>
          <td class="p-2 border">${p.arrival}</td>
          <td class="p-2 border">${p.burst}</td>
          <td class="p-2 border">${p.completion}</td>
          <td class="p-2 border">${p.turnaround}</td>
          <td class="p-2 border">${p.waiting}</td>
        </tr>`;
    });
    html += "</tbody></table>";
    return html;
  }
  
  function generateGanttChart(data) {
  const colors = [
    'bg-red-400', 'bg-blue-400', 'bg-green-400',
    'bg-yellow-400', 'bg-purple-400', 'bg-pink-400',
    'bg-indigo-400', 'bg-teal-400', 'bg-orange-400'
  ];

  const ganttBars = data.map((p, idx) => `
    <div class="flex flex-col items-center ${colors[idx % colors.length]} text-black px-4 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-500 animate-fadeInUp" style="animation-delay: ${idx * 0.2}s">
      <div class="font-bold">P${p.id}</div>
      <div class="text-xs mt-1">${p.start} → ${p.completion}</div>
    </div>
  `).join('');

  return `
    <div class="gantt-container flex w-full overflow-x-auto gap-4 p-4 bg-gray-800 rounded-lg shadow-inner">
      ${ganttBars}
    </div>
  `;
}

  
  function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('bg-gray-900');
    html.classList.toggle('text-white');
    html.classList.toggle('bg-white');
    html.classList.toggle('text-black');
  }
  
  function downloadCSV() {
    let csv = "PID,Arrival,Burst,Completion,Turnaround,Waiting\n";
    document.querySelectorAll("#output tbody tr").forEach(row => {
      let cols = row.querySelectorAll("td");
      csv += Array.from(cols).map(col => col.innerText).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "simulation_results.csv";
    link.click();
  }
  
  function showToast() {
    const toast = document.getElementById("toast");
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  }
  
  function calculateAverages(data) {
    let totalTAT = 0, totalWT = 0;
    data.forEach(p => {
      totalTAT += p.turnaround;
      totalWT += p.waiting;
    });
    const avgTAT = (totalTAT / data.length).toFixed(2);
    const avgWT = (totalWT / data.length).toFixed(2);
    return `Average Turnaround Time: <span class="text-green-400">${avgTAT}</span> ms<br/>
            Average Waiting Time: <span class="text-green-400">${avgWT}</span> ms`;
  }
  