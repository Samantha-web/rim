// Rim data from the provided table
      const rimData = [
        {
          type: "Single Wall",
          profile: "HLQ10C",
          size: "12 x 1.75",
          length: 2.04,
        },
        {
          type: "Single Wall",
          profile: "HLQ10C",
          size: "14 x 1.75",
          length: 2.5,
        },
        {
          type: "Single Wall",
          profile: "HLQ10C",
          size: "16 x 1.75",
          length: 3,
        },
        {
          type: "Single Wall",
          profile: "HLQ10C",
          size: "18 x 1.75",
          length: 3.4,
        },
        {
          type: "Single Wall",
          profile: "HLQ10C",
          size: "20 x 1.75",
          length: 4,
        },
        {
          type: "Single Wall",
          profile: "HLQ10C",
          size: "24 x 1.75",
          length: 4.9,
        },
        {
          type: "Single Wall",
          profile: "HLQ10C",
          size: "26 x 1.75",
          length: 5.4,
        },
        {
          type: "Single Wall",
          profile: "HLQ10C",
          size: "26 x 1 3/8",
          length: 5.7,
        },
        {
          type: "Single Wall",
          profile: "HLQ10C",
          size: "27 x 1.75",
          length: 5.6,
        },
        {
          type: "Single Wall",
          profile: "HLQ10C",
          size: "700C x 1.75",
          length: 6,
        },
        {
          type: "Double Wall",
          profile: "HLQC-23Y",
          size: "20 x 1.75",
          length: 3.95,
        },
        {
          type: "Double Wall",
          profile: "HLQC-23Y",
          size: "24 x 1.75",
          length: 4.95,
        },
        {
          type: "Double Wall",
          profile: "HLQC-23Y",
          size: "26 x 1.75",
          length: 5.4,
        },
        {
          type: "Double Wall",
          profile: "HLQC02D",
          size: "20 x 1.75",
          length: 4,
        },
        {
          type: "Double Wall",
          profile: "HLQC02D",
          size: "24 x 1.75",
          length: 4.95,
        },
        {
          type: "Double Wall",
          profile: "HLQC02D",
          size: "26 x 1.75",
          length: 5.4,
        },
        {
          type: "Double Wall",
          profile: "HLQC02D",
          size: "27.5 x 1.75",
          length: 5.6,
        },
        {
          type: "Double Wall",
          profile: "HLQC02D",
          size: "28 x 1.75",
          length: 6,
        },
        {
          type: "Double Wall",
          profile: "HLQC02D",
          size: "29 x 1.75",
          length: 6,
        },
        {
          type: "Double Wall",
          profile: "HLQC02D",
          size: "700C x 1.75",
          length: 6,
        },
        { type: "Double Wall", profile: "HLQC06", size: "700", length: 6 },
      ];

      let currentUnit = "mm";
      const MM_TO_INCH = 0.0393701;

      document.addEventListener("DOMContentLoaded", function () {
        // Add event listeners
        document
          .getElementById("add-material")
          .addEventListener("click", addMaterialRow);
        document
          .getElementById("add-size")
          .addEventListener("click", addSizeRow);
        document
          .getElementById("reset-btn")
          .addEventListener("click", resetForm);

        // Unit toggle
        document.querySelectorAll(".unit-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            document
              .querySelectorAll(".unit-btn")
              .forEach((b) => b.classList.remove("active"));
            this.classList.add("active");
            currentUnit = this.dataset.unit;
            updateUnits();
            updateResults();
          });
        });

        // Add event delegation for delete buttons
        document.querySelectorAll(".input-table").forEach((table) => {
          table.addEventListener("click", function (e) {
            if (e.target.classList.contains("remove-row")) {
              const row = e.target.closest("tr");
              const tbody = row.parentElement;
              if (tbody.children.length > 1) {
                row.remove();
              } else {
                resetRow(row);
              }
              updateResults();
            }
          });
        });

        // Add change listeners to tables
        document.querySelectorAll(".input-table").forEach((table) => {
          table.addEventListener("change", function (e) {
            if (
              e.target.classList.contains("wall-type") ||
              e.target.classList.contains("profile-code") ||
              e.target.classList.contains("size") ||
              e.target.classList.contains("material-qty") ||
              e.target.classList.contains("size-qty")
            ) {
              updateResults();
            }
          });
        });

        // Initialize first rows
        initFirstRow(document.querySelector("#materials-table tbody tr"));
        document
          .querySelectorAll("#sizes-table tbody tr")
          .forEach(initFirstRow);

        // Auto-update results on page load
        updateResults();
      });

      function resetRow(row) {
        const wallTypeSelect = row.querySelector(".wall-type");
        wallTypeSelect.value = "";

        const profileSelect = row.querySelector(".profile-code");
        profileSelect.innerHTML = '<option value="">Select Profile</option>';
        profileSelect.disabled = true;

        const sizeSelect = row.querySelector(".size");
        sizeSelect.innerHTML = '<option value="">Select Size</option>';
        sizeSelect.disabled = true;

        if (row.querySelector(".material-length")) {
          row.querySelector(".material-length").value = "";
        }
        if (row.querySelector(".size-length")) {
          row.querySelector(".size-length").value = "";
        }

        if (row.querySelector(".material-qty")) {
          row.querySelector(".material-qty").value = "1";
        }
        if (row.querySelector(".size-qty")) {
          row.querySelector(".size-qty").value = "1";
        }
      }

      function initFirstRow(row) {
        const wallTypeSelect = row.querySelector(".wall-type");
        const profileSelect = row.querySelector(".profile-code");
        const sizeSelect = row.querySelector(".size");

        populateWallTypes(wallTypeSelect);

        wallTypeSelect.addEventListener("change", function () {
          const wallType = this.value;
          profileSelect.disabled = !wallType;
          if (wallType) {
            populateProfiles(profileSelect, wallType);
          } else {
            profileSelect.innerHTML =
              '<option value="">Select Profile</option>';
            sizeSelect.innerHTML = '<option value="">Select Size</option>';
            sizeSelect.disabled = true;
          }
          updateResults();
        });

        profileSelect.addEventListener("change", function () {
          const profile = this.value;
          sizeSelect.disabled = !profile;
          if (profile) {
            populateSizes(sizeSelect, wallTypeSelect.value, profile);
          } else {
            sizeSelect.innerHTML = '<option value="">Select Size</option>';
          }
          updateResults();
        });

        sizeSelect.addEventListener("change", function () {
          const size = this.value;
          if (size) {
            const sizeData = rimData.find(
              (item) =>
                item.type === wallTypeSelect.value &&
                item.profile === profileSelect.value &&
                item.size === size
            );

            if (sizeData) {
              let length =
                sizeData.length *
                (currentUnit === "mm" ? 1000 : 1000 * MM_TO_INCH);
              if (row.closest("#materials-table")) {
                row.querySelector(".material-length").value = length.toFixed(2);
              } else {
                const perRim = length / 3;
                row.querySelector(".size-length").value = perRim.toFixed(2);
              }
            }
          }
          updateResults();
        });
      }

      function populateWallTypes(select) {
        const wallTypes = [...new Set(rimData.map((item) => item.type))];
        wallTypes.forEach((type) => {
          const option = document.createElement("option");
          option.value = type;
          option.textContent = type;
          select.appendChild(option);
        });
      }

      function populateProfiles(select, wallType) {
        select.innerHTML = '<option value="">Select Profile</option>';
        const profiles = [
          ...new Set(
            rimData
              .filter((item) => item.type === wallType)
              .map((item) => item.profile)
          ),
        ];

        profiles.forEach((profile) => {
          const option = document.createElement("option");
          option.value = profile;
          option.textContent = profile;
          select.appendChild(option);
        });
      }

      function populateSizes(select, wallType, profile) {
        select.innerHTML = '<option value="">Select Size</option>';
        const sizes = rimData
          .filter((item) => item.type === wallType && item.profile === profile)
          .map((item) => item.size);

        sizes.forEach((size) => {
          const option = document.createElement("option");
          option.value = size;
          option.textContent = size;
          select.appendChild(option);
        });
      }

      function addMaterialRow() {
        const tbody = document.querySelector("#materials-table tbody");
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
                <td>
                    <select class="wall-type">
                        <option value="">Select Type</option>
                    </select>
                </td>
                <td>
                    <select class="profile-code" disabled>
                        <option value="">Select Profile</option>
                    </select>
                </td>
                <td>
                    <select class="size" disabled>
                        <option value="">Select Size</option>
                    </select>
                </td>
                <td>
                    <input type="number" class="material-length" readonly>
                </td>
                <td>
                    <input type="number" min="1" class="material-qty" value="" placeholder="Enter Qty">
                </td>
                <td><button class="btn-danger remove-row"><i class="fas fa-trash"></i></button></td>
            `;
        tbody.appendChild(newRow);
        initFirstRow(newRow);
        updateResults();
      }

      function addSizeRow() {
        const tbody = document.querySelector("#sizes-table tbody");
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
                <td>
                    <select class="wall-type">
                        <option value="">Select Type</option>
                    </select>
                </td>
                <td>
                    <select class="profile-code" disabled>
                        <option value="">Select Profile</option>
                    </select>
                </td>
                <td>
                    <select class="size" disabled>
                        <option value="">Select Size</option>
                    </select>
                </td>
                <td>
                    <input type="number" class="size-length" readonly>
                </td>
                <td>
                    <input type="number" min="1" class="size-qty" value="" placeholder="Enter Qty">
                </td>
                <td><button class="btn-danger remove-row"><i class="fas fa-trash"></i></button></td>
            `;
        tbody.appendChild(newRow);
        initFirstRow(newRow);
        updateResults();
      }

      function resetForm() {
        const materialsTbody = document.querySelector("#materials-table tbody");
        while (materialsTbody.children.length > 1) {
          materialsTbody.removeChild(materialsTbody.lastChild);
        }

        const sizesTbody = document.querySelector("#sizes-table tbody");
        while (sizesTbody.children.length > 1) {
          sizesTbody.removeChild(sizesTbody.lastChild);
        }

        resetRow(materialsTbody.querySelector("tr"));
        resetRow(sizesTbody.querySelector("tr"));
        updateResults();
      }

      function updateUnits() {
        document
          .querySelectorAll(
            "#materials-table .material-length, #sizes-table .size-length"
          )
          .forEach((input) => {
            const row = input.closest("tr");
            const sizeData = rimData.find(
              (item) =>
                item.type === row.querySelector(".wall-type").value &&
                item.profile === row.querySelector(".profile-code").value &&
                item.size === row.querySelector(".size").value
            );

            if (sizeData) {
              let length =
                sizeData.length *
                (currentUnit === "mm" ? 1000 : 1000 * MM_TO_INCH);
              if (input.classList.contains("size-length")) {
                length = length / 3;
              }
              input.value = length.toFixed(2);
            }
          });

        document
          .querySelectorAll(
            "#materials-table th:nth-child(4), #sizes-table th:nth-child(4)"
          )
          .forEach((th) => {
            th.textContent = `Strip Length (${currentUnit})`;
          });
      }

      function collectInputData() {
        const materials = [];
        document
          .querySelectorAll("#materials-table tbody tr")
          .forEach((row) => {
            const length = parseFloat(
              row.querySelector(".material-length").value
            );
            const qty = parseInt(row.querySelector(".material-qty").value);
            const type = row.querySelector(".wall-type").value;
            const profile = row.querySelector(".profile-code").value;
            const size = row.querySelector(".size").value;

            if (length && qty && type && profile && size) {
              materials.push({ length, qty, type, profile, size });
            }
          });

        const sizeRequirements = [];
        document.querySelectorAll("#sizes-table tbody tr").forEach((row) => {
          const length = parseFloat(row.querySelector(".size-length").value);
          const qty = parseInt(row.querySelector(".size-qty").value);
          const type = row.querySelector(".wall-type").value;
          const profile = row.querySelector(".profile-code").value;
          const size = row.querySelector(".size").value;

          if (length && qty && type && profile && size) {
            for (let i = 0; i < qty; i++) {
              sizeRequirements.push({ length, type, profile, size });
            }
          }
        });

        return { materials, sizeRequirements };
      }

      function updateResults() {
        const data = collectInputData();
        const { materials, sizeRequirements } = data;

        // Show/hide results section
        const resultsSection = document.getElementById("results-section");
        if (materials.length > 0 && sizeRequirements.length > 0) {
          resultsSection.style.display = "block";
          const result = calculateCuttingPlan(materials, sizeRequirements);
          displayResults(result, currentUnit);
        } else {
          resultsSection.style.display = "none";
        }
      }

      function calculateCuttingPlan(materials, sizeRequirements) {
        // Group available materials by profile
        const materialsByProfile = {};
        materials.forEach((material) => {
          if (!materialsByProfile[material.profile]) {
            materialsByProfile[material.profile] = [];
          }
          materialsByProfile[material.profile].push(material);
        });

        // Group required sizes by profile
        const sizesByProfile = {};
        sizeRequirements.forEach((sizeReq) => {
          if (!sizesByProfile[sizeReq.profile]) {
            sizesByProfile[sizeReq.profile] = [];
          }
          sizesByProfile[sizeReq.profile].push(sizeReq);
        });

        let totalPlan = [];
        let totalWaste = 0;
        let totalStripsUsed = 0;
        let totalUsedMaterial = 0;
        let unassignedPieces = [];
        const profileMismatches = [];

        // Process each profile separately
        Object.keys(sizesByProfile).forEach((profile) => {
          const requiredPieces = sizesByProfile[profile];
          const availableMaterials = materialsByProfile[profile] || [];

          if (availableMaterials.length === 0) {
            // No materials for this profile - all pieces are unassigned
            unassignedPieces = unassignedPieces.concat(requiredPieces);
            profileMismatches.push(profile);
            return;
          }

          // Prepare available strips for this profile
          let availableStrips = [];
          availableMaterials.forEach((material) => {
            for (let i = 0; i < material.qty; i++) {
              availableStrips.push({
                length: material.length,
                type: material.type,
                profile: material.profile,
                size: material.size,
                remaining: material.length,
                cuts: [],
              });
            }
          });

          // Run optimization for this specific profile
          const result = optimizeProfile(availableStrips, requiredPieces);
          totalPlan = totalPlan.concat(result.plan);
          totalWaste += result.totalWaste;
          totalStripsUsed += result.totalStripsUsed;
          totalUsedMaterial += result.totalUsedMaterial;
          unassignedPieces = unassignedPieces.concat(result.unassignedPieces);
        });

        const wastePercent = totalUsedMaterial
          ? (totalWaste / totalUsedMaterial) * 100
          : 0;
        const utilization = 100 - wastePercent;

        const materialSummary = materials.map((m) => ({
          type: m.type,
          profile: m.profile,
          size: m.size,
          length: m.length,
          total: m.qty,
          used: totalPlan.filter(
            (s) =>
              s.type === m.type &&
              s.profile === m.profile &&
              s.size === m.size &&
              s.cuts.length > 0
          ).length,
          remaining:
            m.qty -
            totalPlan.filter(
              (s) =>
                s.type === m.type &&
                s.profile === m.profile &&
                s.size === m.size &&
                s.cuts.length > 0
            ).length,
        }));

        // Group unassigned pieces by type, profile, and size
        const groupedShortages = {};
        unassignedPieces.forEach((piece) => {
          const key = `${piece.type}|${piece.profile}|${piece.size}`;
          if (!groupedShortages[key]) {
            groupedShortages[key] = {
              type: piece.type,
              profile: piece.profile,
              size: piece.size,
              length: piece.length,
              count: 0,
              requiredTubes: 0,
            };
          }
          groupedShortages[key].count++;
          groupedShortages[key].requiredTubes = Math.ceil(
            groupedShortages[key].count / 3
          );
        });

        const shortages = Object.values(groupedShortages);

        return {
          plan: totalPlan,
          totalWaste,
          materialSummary,
          shortages,
          profileMismatches,
          totalRims: sizeRequirements.length - unassignedPieces.length,
          minRimLength: Math.min(...sizeRequirements.map((p) => p.length)),
          utilization,
          wastePercent,
          totalStripsUsed,
          totalUsedMaterial,
          recalculated: true,
        };

        function optimizeProfile(availableStrips, requiredPieces) {
          availableStrips.sort((a, b) => b.length - a.length);
          let localRequiredPieces = [...requiredPieces];
          localRequiredPieces.sort((a, b) => b.length - a.length);

          let bestPlan = null;
          let bestWaste = Infinity;
          let totalStripsUsed = 0;
          let totalUsedMaterial = 0;
          let unassignedPieces = [];

          // Try multiple packing strategies
          for (let i = 0; i < 3; i++) {
            const strategyPlan = tryPackingStrategy(
              [...availableStrips],
              [...localRequiredPieces],
              i
            );
            if (strategyPlan.totalWaste < bestWaste) {
              bestPlan = strategyPlan;
              bestWaste = strategyPlan.totalWaste;
              totalStripsUsed = strategyPlan.totalStripsUsed;
              totalUsedMaterial = strategyPlan.totalUsedMaterial;
              unassignedPieces = strategyPlan.unassignedPieces;
            }
          }

          return {
            ...bestPlan,
            totalStripsUsed,
            totalUsedMaterial,
            unassignedPieces,
          };
        }

        function tryPackingStrategy(strips, pieces, strategy) {
          let localTotalStripsUsed = 0;
          let localTotalUsedMaterial = 0;
          strips.forEach((strip) => {
            strip.remaining = strip.length;
            strip.cuts = [];
          });
          pieces.forEach((piece) => (piece.assigned = false));

          const plan = [];
          let totalWaste = 0;

          if (strategy === 0) {
            for (const piece of pieces) {
              const strip = findBestStrip(piece, strips);
              if (strip) {
                addToStrip(piece, strip, plan);
              }
            }
          } else if (strategy === 1) {
            for (const piece of pieces) {
              const strip = findBestStrip(piece, strips, true);
              if (strip) {
                addToStrip(piece, strip, plan);
              }
            }
          } else {
            const sizeGroups = {};
            pieces.forEach((piece) => {
              const key = `${piece.type}|${piece.profile}|${piece.size}`;
              if (!sizeGroups[key]) sizeGroups[key] = [];
              sizeGroups[key].push(piece);
            });

            const sortedGroups = Object.values(sizeGroups).sort(
              (a, b) => b[0].length - a[0].length
            );

            for (const group of sortedGroups) {
              for (const piece of group) {
                const strip = findBestStrip(piece, strips);
                if (strip) {
                  addToStrip(piece, strip, plan);
                }
              }
            }
          }

          const unassigned = pieces.filter((p) => !p.assigned);
          for (const piece of unassigned) {
            const strip = findBestStrip(piece, strips, false, false);
            if (strip) {
              addToStrip(piece, strip, plan);
            }
          }

          plan.forEach((strip) => {
            totalWaste += strip.remaining;
          });

          const totalRequiredLength = pieces.reduce(
            (sum, piece) => sum + piece.length,
            0
          );
          const wastePercent = localTotalUsedMaterial
            ? (totalWaste / localTotalUsedMaterial) * 100
            : 0;
          const utilization = 100 - wastePercent;

          return {
            plan,
            totalWaste,
            totalUsedMaterial: localTotalUsedMaterial,
            totalStripsUsed: localTotalStripsUsed,
            utilization,
            wastePercent,
            unassignedPieces: pieces.filter((p) => !p.assigned),
          };

          function findBestStrip(
            piece,
            strips,
            bestFit = false,
            requireTypeMatch = true
          ) {
            const suitableStrips = strips.filter(
              (strip) =>
                strip.remaining >= piece.length &&
                (!requireTypeMatch || strip.type === piece.type)
            );

            if (suitableStrips.length === 0) return null;

            if (bestFit) {
              return suitableStrips.reduce((best, current) => {
                const bestWaste = best.remaining - piece.length;
                const currentWaste = current.remaining - piece.length;
                return currentWaste < bestWaste ? current : best;
              });
            }

            return suitableStrips[0];
          }

          function addToStrip(piece, strip, plan) {
            const existingCut = strip.cuts.find(
              (c) =>
                c.size === piece.size &&
                c.type === piece.type &&
                c.profile === piece.profile
            );

            if (existingCut) {
              existingCut.count++;
            } else {
              strip.cuts.push({
                size: piece.size,
                length: piece.length,
                count: 1,
                type: piece.type,
                profile: piece.profile,
              });
            }

            strip.remaining -= piece.length;
            piece.assigned = true;

            if (strip.cuts.length === 1) {
              localTotalStripsUsed++;
              localTotalUsedMaterial += strip.length;
              if (!plan.includes(strip)) {
                plan.push(strip);
              }
            }
          }
        }
      }

      function displayResults(result, currentUnit) {
        const resultsContainer = document.getElementById("results-container");
        resultsContainer.innerHTML = "";

        // Show profile mismatch warnings
        if (result.profileMismatches.length > 0) {
          const warningContainer = document.createElement("div");
          warningContainer.className = "shortage-container";
          warningContainer.innerHTML = `
                    <div class="shortage-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        Profile Mismatch Warning
                    </div>
                    <div class="profile-warning">
                        <i class="fas fa-exclamation-circle"></i>
                        <div>
                            The following required profiles are not available: 
                            <strong>${result.profileMismatches.join(
                              ", "
                            )}</strong>
                        </div>
                    </div>
                    <div class="shortage-details">
                        <i class="fas fa-info-circle"></i> 
                        Please add materials with matching profiles to optimize cutting
                    </div>
                `;
          resultsContainer.appendChild(warningContainer);
        }

        if (result.plan.some((strip) => strip.cuts.length === 0)) {
          const warning = document.createElement("div");
          warning.className = "warning-box";
          warning.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>Warning:</strong> Some pieces could not be assigned due to insufficient material.
                    </div>
                `;
          resultsContainer.appendChild(warning);
        }

        const wasteSummary = document.createElement("div");
        wasteSummary.className = `waste-summary ${
          result.wastePercent < 5 ? "waste-low" : "waste-high"
        }`;
        const efficiencyClass =
          result.utilization > 90
            ? "efficiency-high"
            : result.utilization > 75
            ? "efficiency-medium"
            : "efficiency-low";
        const efficiencyText =
          result.utilization > 90
            ? "High Efficiency"
            : result.utilization > 75
            ? "Medium Efficiency"
            : "Low Efficiency";
        wasteSummary.innerHTML = `
                <div>
                    <i class="fas fa-recycle"></i> Total Waste: <span id="total-waste">${result.totalWaste.toFixed(
                      2
                    )} ${currentUnit}</span>
                </div>
                <div>
                    Utilization Rate: <span id="waste-percent">${result.utilization.toFixed(
                      1
                    )}%</span>
                    <div class="efficiency-label ${efficiencyClass}">${efficiencyText}</div>
                </div>
            `;
        resultsContainer.appendChild(wasteSummary);

        const recalcMessage = document.createElement("div");
        recalcMessage.className = "recalc-message";
        recalcMessage.style.display = result.recalculated ? "flex" : "none";
        recalcMessage.innerHTML = `
                <i class="fas fa-sync-alt"></i>
                <span>Optimized using advanced bin-packing algorithm</span>
            `;
        resultsContainer.appendChild(recalcMessage);

        const progressContainer = document.createElement("div");
        progressContainer.className = "progress-container";
        const utilizationPercent = Math.round(result.utilization);
        const circumference = 2 * Math.PI * 80;
        const offset =
          circumference - (utilizationPercent / 100) * circumference;
        progressContainer.innerHTML = `
                <div class="progress-ring">
                    <svg width="180" height="180" viewBox="0 0 180 180">
                        <circle cx="90" cy="90" r="80" stroke="#e0e0e0" stroke-width="12" fill="none"></circle>
                        <circle id="utilization-ring" cx="90" cy="90" r="80" 
                                stroke="${
                                  utilizationPercent >= 90
                                    ? "#2ecc71"
                                    : utilizationPercent >= 75
                                    ? "#f1c40f"
                                    : "#e74c3c"
                                }" 
                                stroke-width="12" stroke-dasharray="502.4" stroke-dashoffset="${offset}" 
                                stroke-linecap="round" fill="none" transform="rotate(-90 90 90)"></circle>
                    </svg>
                    <div class="progress-text"><span id="utilization-percent">${utilizationPercent}%</span></div>
                </div>
                <div class="progress-label">Material Utilization</div>
            `;
        resultsContainer.appendChild(progressContainer);

        const summaryCard = document.createElement("div");
        summaryCard.className = "summary-card";
        summaryCard.innerHTML = `
                <div>
                    <div class="value" id="total-rims">${result.totalRims}</div>
                    <div class="label">Rims Produced</div>
                </div>
                <div>
                    <div class="value" id="utilization">${result.utilization.toFixed(
                      1
                    )}%</div>
                    <div class="label">Efficiency</div>
                </div>
            `;
        resultsContainer.appendChild(summaryCard);

        if (result.shortages.length > 0) {
          const shortageContainer = document.createElement("div");
          shortageContainer.className = "shortage-container";
          shortageContainer.innerHTML = `
                    <div class="shortage-header">
                        <i class="fas fa-exclamation-circle"></i>
                        Material Shortages
                    </div>
                `;

          result.shortages.forEach((shortage) => {
            const shortageItem = document.createElement("div");
            shortageItem.className = "shortage-item";
            shortageItem.innerHTML = `
                            <div class="shortage-size">${shortage.type} - ${shortage.profile} - ${shortage.size}</div>
                            <div class="shortage-qty">${shortage.count} rims, ${shortage.requiredTubes} Strips required</div>
                        `;
            shortageContainer.appendChild(shortageItem);
          });

          if (shortageContainer.children.length > 1) {
            shortageContainer.innerHTML += `
                        <div class="shortage-details">
                            <i class="fas fa-info-circle"></i> 
                            Additional material required to fulfill these rim requirements
                        </div>
                    `;
            resultsContainer.appendChild(shortageContainer);
          }
        }

        const materialSummaryContainer = document.createElement("div");
        materialSummaryContainer.className = "result-container";
        materialSummaryContainer.innerHTML =
          '<h3><i class="fas fa-boxes"></i> Material Usage Summary</h3>';
        const materialSummary = document.createElement("div");
        materialSummary.id = "material-summary";

        if (result.materialSummary.length > 0) {
          result.materialSummary.forEach((material) => {
            const materialElem = document.createElement("div");
            materialElem.className = "material-usage";
            materialElem.innerHTML = `
                        <div class="material-header">
                            <span>${material.type} - ${material.profile} - ${
              material.size
            }</span>
                            <span>${material.length.toFixed(
                              2
                            )} ${currentUnit} Strips</span>
                        </div>
                        <div class="size-details">
                            <div><span>Total:</span> ${
                              material.total
                            } strips</div>
                            <div><span>Used:</span> ${
                              material.used
                            } strips</div>
                            <div><span>Remaining:</span> ${
                              material.remaining
                            } strips</div>
                            <div class="utilization-bar">
                                <div class="utilization-fill" style="width: ${
                                  (material.used / material.total) * 100
                                }%"></div>
                            </div>
                        </div>
                    `;
            materialSummary.appendChild(materialElem);
          });
        } else {
          materialSummary.innerHTML = "<p>No materials used in this plan.</p>";
        }
        materialSummaryContainer.appendChild(materialSummary);
        resultsContainer.appendChild(materialSummaryContainer);

        const cuttingPlanContainer = document.createElement("div");
        cuttingPlanContainer.className = "result-container";
        cuttingPlanContainer.innerHTML =
          '<h3><i class="fas fa-cut"></i> Optimal Cutting Plan</h3>';
        const cuttingPlan = document.createElement("div");
        cuttingPlan.id = "cutting-plan";

        if (result.plan.length > 0) {
          // Group identical cutting patterns
          const patternGroups = {};
          result.plan.forEach((strip) => {
            if (strip.cuts.length === 0) return;

            // Create a unique key for the pattern
            const patternKey = strip.cuts
              .map((c) => `${c.size}:${c.count}`)
              .join("_");
            const groupKey = `${strip.type}|${strip.profile}|${strip.size}|${patternKey}|${strip.remaining}`;

            if (!patternGroups[groupKey]) {
              patternGroups[groupKey] = {
                count: 1,
                strip: strip,
              };
            } else {
              patternGroups[groupKey].count++;
            }
          });

          // Display each pattern group
          Object.keys(patternGroups).forEach((key, index) => {
            const group = patternGroups[key];
            const strip = group.strip;
            const quantity = group.count;

            const stripElem = document.createElement("div");
            stripElem.className = "material-usage";
            const utilization = (
              ((strip.length - strip.remaining) / strip.length) *
              100
            ).toFixed(1);

            let visualization = '<div class="cut-visualization">';
            let currentPosition = 0;
            strip.cuts.forEach((cut) => {
              const widthPercent =
                ((cut.length * cut.count) / strip.length) * 100;
              visualization += `
                            <div class="cut-bar">
                                <div class="cut-segment cut-segment-used" style="width: ${widthPercent}%; left: ${currentPosition}%">
                                    <span class="cut-label">${cut.size} x${cut.count}</span>
                                </div>
                            </div>`;
              currentPosition += widthPercent;
            });
            if (strip.remaining > 0) {
              visualization += `
                            <div class="cut-bar">
                                <div class="cut-segment cut-segment-waste" style="width: ${
                                  (strip.remaining / strip.length) * 100
                                }%; left: ${currentPosition}%">
                                    <span class="cut-label">Waste: ${strip.remaining.toFixed(
                                      2
                                    )} ${currentUnit}</span>
                                </div>
                            </div>`;
            }
            visualization += "</div>";

            stripElem.innerHTML = `
                        <div class="material-header">
                            <span>Strip Pattern #${
                              index + 1
                            } <span class="pattern-badge">x${quantity}</span></span>
                            <span>${strip.type} - ${strip.profile} - ${
              strip.size
            }</span>
                        </div>
                        <div class="material-header">
                            <span>Strip Length: ${strip.length.toFixed(
                              2
                            )} ${currentUnit}</span>
                            <span>Utilization: ${utilization}%</span>
                        </div>
                        <div class="cuts-list">
                            ${strip.cuts
                              .map(
                                (cut) => `
                                <div class="cut-item">
                                    <span class="cut-size">${cut.size}</span>
                                    <span class="cut-count">${cut.count}</span>
                                </div>
                            `
                              )
                              .join("")}
                            ${
                              strip.remaining > 0
                                ? `
                                <div class="cut-item waste-item">
                                    <i class="fas fa-trash"></i> Waste: ${strip.remaining.toFixed(
                                      2
                                    )} ${currentUnit}
                                </div>
                            `
                                : ""
                            }
                        </div>
                        ${visualization}
                    `;
            cuttingPlan.appendChild(stripElem);
          });
        } else {
          cuttingPlan.innerHTML = "<p>No cutting plan generated.</p>";
        }
        cuttingPlanContainer.appendChild(cuttingPlan);
        resultsContainer.appendChild(cuttingPlanContainer);

        if (result.totalWaste > result.minRimLength) {
          const warning = document.createElement("div");
          warning.className = "warning-box";
          warning.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>Note:</strong> The total waste (${result.totalWaste.toFixed(
                          2
                        )} ${currentUnit}) is more than the smallest rim length (${result.minRimLength.toFixed(
            2
          )} ${currentUnit}). 
                        <br>Consider producing additional rims to utilize waste.
                    </div>
                `;
          resultsContainer.insertBefore(warning, resultsContainer.firstChild);
        }
      }