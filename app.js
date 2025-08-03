const dbName = "InspectionDB";
const dbVersion = 1;
let db;

const checklistData = {
  rcc: ["Uneven surfaces", "Visible cracks", "Undulation across spans"],
  brick: ["Pointing", "Incorrect header and stretcher jointing"],
  plaster: ["Loose plaster", "Surface dents"],
  tile: ["Cracked tiles", "Improper leveling"],
  door: ["Cracks on frames", "Loose hinges"],
  window: ["Frame dents", "Air gaps when closed"],
  electrical: ["Proper cable distribution", "Correct wire sizing"],
  plumbing: ["Leakage at joints", "Wall outlet integrity"],
  safety: ["Cleanliness of site", "Loose tools"]
};

function initDB() {
  const request = indexedDB.open(dbName, dbVersion);
  request.onerror = () => console.error("DB failed to open");
  request.onsuccess = () => db = request.result;
  request.onupgradeneeded = (e) => {
    db = e.target.result;
    const store = db.createObjectStore("inspections", { keyPath: "id", autoIncrement: true });
  };
}

function saveInspectionEntry(entry) {
  const tx = db.transaction(["inspections"], "readwrite");
  tx.objectStore("inspections").add(entry);
}

function exportAllEntries(callback) {
  const tx = db.transaction(["inspections"], "readonly");
  const store = tx.objectStore("inspections");
  const request = store.getAll();
  request.onsuccess = () => callback(request.result);
}

function renderEntries() {
  exportAllEntries((data) => {
    const tbody = document.querySelector("#entriesTable tbody");
    tbody.innerHTML = "";

    data.forEach((entry) => {
      const inspections = (entry.component_inspections || []).map((ci, i) => {
        const imagesHTML = (ci.photos || []).map(photo =>
          `<a href="${photo}" target="_blank"><img src="${photo}" alt="photo" style="margin-top: 4px; width: 100px; border-radius: 4px; border: 1px solid #ccc; margin-right: 5px;" /></a>`
        ).join("");

        return `
          <div style="margin-bottom: 10px;">
            <strong>${i + 1})</strong><br>
            <strong>Floor:</strong> ${ci.floor}<br>
            <strong>Component:</strong> ${ci.component}<br>
            <strong>Checkpoint:</strong> ${ci.checkpoint}<br>
            <strong>location:</strong> ${ci.location}<br>
            <strong>Rating:</strong> ${ci.rating}<br>
            <strong>Remark:</strong> ${ci.comment || '-'}<br>
            ${imagesHTML}
          </div>
        `;
      }).join("");

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.project}</td>
        <td>${entry.unit}</td>
        <td>${entry.date}</td>
        <td>${entry.inspector}</td>
        <td>${entry.areas?.join(", ") || ''}</td>
        <td>${entry.address || ''}</td>
        <td>${inspections}</td>
      `;
      tbody.appendChild(row);
    });
  });
}

function populateCheckpoints(selectEl) {
  const component = selectEl.value;
  const container = selectEl.closest(".component-inspection");
  const checkpoint = container.querySelector(".checkpoint");
  checkpoint.innerHTML = '<option value="">Select</option>';
  if (component && checklistData[component]) {
    checklistData[component].forEach(item => {
      const option = document.createElement("option");
      option.text = item;
      checkpoint.add(option);
    });
  }
}

function addComponentInspection() {
  const wrapper = document.getElementById("componentInspectionsWrapper");
  const section = document.createElement("div");
  section.className = "form-section component-inspection";
  section.innerHTML = `
    <label>Floor:</label>
<select class="floor" onchange="toggleCustomFloor(this)" >
  <option value="">Select</option>
  <option>Ground</option>
  <option>First</option>
  <option>Second</option>
  <option>Third</option>
  <option>Fourth</option>
  <option value="custom">➕ Add your own floor</option>
</select>
<div class="customFloorDiv" style="display: none; margin-top: 10px;">
  <label>Enter Custom Floor:</label>
  <input type="text" class="customFloor" placeholder="Enter floor name" />
</div>


    <label>Component:</label>
    <select class="component" onchange="populateCheckpoints(this)" required>
      <option value="">Select</option>
      <option value="rcc">RCC Elements</option>
      <option value="brick">Brick Masonry</option>
      <option value="plaster">Plaster Surfaces</option>
      <option value="tile">Tile & Stone Flooring</option>
      <option value="door">Door Frames</option>
      <option value="window">Window Frames</option>
      <option value="electrical">Electrical</option>
      <option value="plumbing">Plumbing & Sanitary</option>
      <option value="safety">Safety & Clean</option>
	  
    </select>

    <label>Checkpoint:</label>
    <select class="checkpoint" required>
      <option value="">Select Component First</option>
    </select>
	<label>Location:</label>
<select class="location" required>
  <option value="">Select Location</option>
  <option>Left</option>
  <option>Right</option>
  <option>Front</option>
  <option>Back</option>
  <option>Top</option>
  <option>Bottom</option>
</select>


    <label>Rating:</label>
    <select class="rating" required>
      <option value="">Select</option>
      <option>Acceptable</option>
      <option>Marginal</option>
      <option>Defective</option>
      <option>Not Inspected</option>
      <option>Work Remain</option>
    </select>

    <label>Remark:</label>
    <textarea class="comment"></textarea>

    <label>Upload Photos:</label>
    <input type="file" class="photo" accept="image/*" multiple />
    <hr>
  `;
  wrapper.appendChild(section);
}
function exportToExcel() {
  exportAllEntries((data) => {
    const rows = [];
    let srNo = 1;

    data.forEach((entry) => {
      const components = entry.component_inspections || [];

      if (components.length === 0) {
        rows.push({
          "Sr. No": srNo++,
          Project: entry.project,
          Unit: entry.unit,
          Date: entry.date,
          Inspector: entry.inspector,
          Areas: entry.areas?.join(', ') || '',
          Address: entry.address || '',
          Floor: '',
          Component: '',
          Checkpoint: '',
          Location: '',
          Rating: '',
          Comments: ''
        });
      } else {
        components.forEach((ci, index) => {
          rows.push({
            "Sr. No": index === 0 ? srNo++ : '',
            Project: index === 0 ? entry.project : '',
            Unit: index === 0 ? entry.unit : '',
            Date: index === 0 ? entry.date : '',
            Inspector: index === 0 ? entry.inspector : '',
            Areas: index === 0 ? (entry.areas?.join(', ') || '') : '',
            Address: index === 0 ? (entry.address || '') : '',
            Floor: ci.floor || '',
            Component: ci.component || '',
            Checkpoint: ci.checkpoint || '',
            Location: ci.location || '',
            Rating: ci.rating || '',
            Comments: ci.comment || ''
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Apply header style
    const headerStyle = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "BDD7EE" }  // light blue
      },
      font: {
        bold: true,
        color: { rgb: "000000" }
      }
    };

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = headerStyle;
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inspection Report");

    XLSX.writeFile(workbook, "Inspection_Export.xlsx");
  });
}

function exportToExcel3() {
  exportAllEntries((data) => {
    const rows = [];

    data.forEach((entry) => {
      const components = entry.component_inspections || [];

      if (components.length === 0) {
        rows.push({
          Project: entry.project,
          Unit: entry.unit,
          Date: entry.date,
          Inspector: entry.inspector,
          Areas: entry.areas?.join(', ') || '',
          Address: entry.address || '',
          Floor: '',
          Component: '',
          Checkpoint: '',
          Location: '',
          Rating: '',
          Comments: ''
        });
      } else {
        components.forEach((ci, index) => {
          rows.push({
            Project: index === 0 ? entry.project : '',
            Unit: index === 0 ? entry.unit : '',
            Date: index === 0 ? entry.date : '',
            Inspector: index === 0 ? entry.inspector : '',
            Areas: index === 0 ? (entry.areas?.join(', ') || '') : '',
            Address: index === 0 ? (entry.address || '') : '',
            Floor: ci.floor || '',
            Component: ci.component || '',
            Checkpoint: ci.checkpoint || '',
            Location: ci.location || '',
            Rating: ci.rating || '',
            Comments: ci.comment || ''
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inspection Report");
    XLSX.writeFile(workbook, "Inspection_Export.xlsx");
  });
}

function exportToExcel2() {
  exportAllEntries((data) => {
    const rows = [];

    data.forEach((entry) => {
      const components = entry.component_inspections || [];

      if (components.length === 0) {
        // Push empty row if no components
        rows.push({
          Project: entry.project,
          Unit: entry.unit,
          Date: entry.date,
          Inspector: entry.inspector,
          Areas: entry.areas?.join(', ') || '',
          Address: entry.address || '',
          Floor: '',
          Component: '',
          Checkpoint: '',
          Location: '',
          Rating: '',
          Comments: ''
        });
      } else {
        // Push one row per component
        components.forEach((ci) => {
          rows.push({
            Project: entry.project,
            Unit: entry.unit,
            Date: entry.date,
            Inspector: entry.inspector,
            Areas: entry.areas?.join(', ') || '',
            Address: entry.address || '',
            Floor: ci.floor || '',
            Component: ci.component || '',
            Checkpoint: ci.checkpoint || '',
            Location: ci.location || '',
            Rating: ci.rating || '',
            Comments: ci.comment || ''
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inspection Report");
    XLSX.writeFile(workbook, "Inspection_Export.xlsx");
  });
}


function exportToExcel1() {
  exportAllEntries((data) => {
    const rows = [];

    data.forEach((entry) => {
      const components = (entry.component_inspections || []).map((ci, i) => {
        return `${i + 1}) Floor: ${ci.floor}, Component: ${ci.component}, Checkpoint: ${ci.checkpoint},Location: ${ci.location}, Rating: ${ci.rating}, Comments: ${ci.comment || '-'}`;
      }).join(" | ");

      rows.push({
        Project: entry.project,
        Unit: entry.unit,
        Date: entry.date,
        Inspector: entry.inspector,
        Areas: entry.areas?.join(', ') || '',
        Address: entry.address || '',
        'Component Inspections': components
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inspection Report");
    XLSX.writeFile(workbook, "Inspection_Export.xlsx");
  });
}

window.onload = function () {
	document.getElementById("date").value = new Date().toISOString().split("T")[0];

  initDB();
  setTimeout(renderEntries, 500);

  document.getElementById("inspectionForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const inspectionList = [];

    const fileReadPromises = [];
    document.querySelectorAll(".component-inspection").forEach((section) => {
      const floorSelect = section.querySelector(".floor").value;
const customFloor = section.querySelector(".customFloor")?.value || "";
const floor = (floorSelect === "custom") ? customFloor : floorSelect;

      const component = section.querySelector(".component").value;
      const checkpoint = section.querySelector(".checkpoint").value;
      const rating = section.querySelector(".rating").value;
      const comment = section.querySelector(".comment").value;
      const photoInputs = section.querySelector(".photo").files;
	  const location = section.querySelector(".location").value;


      const photoPromises = Array.from(photoInputs).map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });

      const sectionPromise = Promise.all(photoPromises).then(photos => {
        inspectionList.push({ floor, component, checkpoint, location,rating, comment, photos });
      });

      fileReadPromises.push(sectionPromise);
    });

    Promise.all(fileReadPromises).then(() => {
      const entry = {
		inspector: (document.getElementById("inspector").value === "custom")
		  ? document.getElementById("customInspector").value
		  : document.getElementById("inspector").value,

        date: document.getElementById("date").value,
		project: (document.getElementById("project").value === "custom")
		  ? document.getElementById("customProject").value
		  : document.getElementById("project").value,
        tower: document.getElementById("tower").value,
        unit: document.getElementById("unit").value,
        areas: Array.from(document.getElementById("areas").selectedOptions).map(opt => opt.value),
        address: document.getElementById("address").value,
        component_inspections: inspectionList
      };

      saveInspectionEntry(entry);
      alert("Inspection data saved locally.");
      document.getElementById("inspectionForm").reset();
      document.getElementById("componentInspectionsWrapper").innerHTML = "";
      setTimeout(renderEntries, 300);
    });
  });
};
function toggleEntries() {
  const container = document.getElementById("entriesContainer");
  const button = document.getElementById("toggleButton");

  if (container.style.display === "none") {
    container.style.display = "block";
    button.textContent = "🔽 Hide Submitted Entries";
    renderEntries(); // Fetch fresh data
  } else {
    container.style.display = "none";
    button.textContent = "📄 View Submitted Entries";
  }
}
function toggleInspectorInput() {
  const inspectorSelect = document.getElementById("inspector");
  const customDiv = document.getElementById("customInspector");
  const wrapper = document.getElementById("customInspectorDiv");

  if (inspectorSelect.value === "custom") {
    wrapper.style.display = "block";
    customDiv.setAttribute("required", true);
  } else {
    wrapper.style.display = "none";
    customDiv.removeAttribute("required");
  }
}
function toggleProjectInput() {
  const projectSelect = document.getElementById("project");
  const customDiv = document.getElementById("customProjectDiv");
  const customInput = document.getElementById("customProject");

  if (projectSelect.value === "custom") {
    customDiv.style.display = "block";
    customInput.setAttribute("required", true);
  } else {
    customDiv.style.display = "none";
    customInput.removeAttribute("required");
  }
}
function toggleCustomFloor(selectEl) {
  const container = selectEl.closest(".component-inspection");
  const customDiv = container.querySelector(".customFloorDiv");
  const customInput = container.querySelector(".customFloor");

  if (selectEl.value === "custom") {
    customDiv.style.display = "block";
    customInput.setAttribute("required", true);
  } else {
    customDiv.style.display = "none";
    customInput.removeAttribute("required");
  }
}
$(document).ready(function () {
  $('#areas').select2({
    placeholder: "Select areas being inspected",
    allowClear: false
  });

  $('#areas').on('change', function () {
    if ($(this).val().includes('custom')) {
      $('#customAreaDiv').show();
      $('#customArea').attr('required', true);
    } else {
      $('#customAreaDiv').hide();
      $('#customArea').removeAttr('required');
    }
  });
});
