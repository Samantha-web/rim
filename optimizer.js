function calculateCuttingPlan(materials, sizeRequirements) {
        const materialsByProfile = {};
        materials.forEach((material) => {
          if (!materialsByProfile[material.profile]) {
            materialsByProfile[material.profile] = [];
          }
          materialsByProfile[material.profile].push(material);
        });

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

        Object.keys(sizesByProfile).forEach((profile) => {
          const requiredPieces = sizesByProfile[profile];
          const availableMaterials = materialsByProfile[profile] || [];

          if (availableMaterials.length === 0) {
            unassignedPieces = unassignedPieces.concat(requiredPieces);
            profileMismatches.push(profile);
            return;
          }

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

        const shortageStripTips = {};
        sizeRequirements.forEach((req) => {
          const key = `${req.type}|${req.profile}`;
          if (!shortageStripTips[key]) {
            const matchingMaterial = materials.find(
              (m) => m.type === req.type && m.profile === req.profile
            );
            if (matchingMaterial) {
              shortageStripTips[key] = {
                type: req.type,
                profile: req.profile,
                availSize: matchingMaterial.size,
                availLength: matchingMaterial.length,
                currentStrips: matchingMaterial.qty,
                totalRequiredCount: 0,
                totalRequiredLength: 0,
                minPieceLength: Infinity,
              };
            }
          }
          if (shortageStripTips[key]) {
            shortageStripTips[key].totalRequiredCount++;
            shortageStripTips[key].totalRequiredLength += req.length;
            if (req.length < shortageStripTips[key].minPieceLength) {
              shortageStripTips[key].minPieceLength = req.length;
            }
          }
        });

        Object.values(shortageStripTips).forEach((tip) => {
          const lengthBased = Math.ceil(
            tip.totalRequiredLength / tip.availLength
          );
          const maxPerStrip = Math.floor(
            tip.availLength / tip.minPieceLength
          );
          const countBased = Math.ceil(
            tip.totalRequiredCount / maxPerStrip
          );
          tip.totalStripsNeeded = Math.max(lengthBased, countBased);
          tip.additionalStrips = Math.max(
            0,
            tip.totalStripsNeeded - tip.currentStrips
          );
        });

        return {
          plan: totalPlan,
          totalWaste,
          materialSummary,
          shortages,
          shortageStripTips: Object.values(shortageStripTips),
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

          const sizeGroups = {};
          requiredPieces.forEach((p) => {
            const key = `${p.type}|${p.profile}|${p.size}`;
            if (!sizeGroups[key]) sizeGroups[key] = [];
            sizeGroups[key].push(p);
          });
          const sortedSizeKeys = Object.keys(sizeGroups).sort(
            (a, b) => sizeGroups[b][0].length - sizeGroups[a][0].length
          );

          let bestPlan = null;
          let bestUnassigned = Infinity;
          let totalStripsUsed = 0;
          let totalUsedMaterial = 0;
          let unassignedPieces = [];

          for (let i = 0; i < 4; i++) {
            const strategyPlan = tryPackingStrategy(
              [...availableStrips],
              [...requiredPieces],
              i,
              sortedSizeKeys,
              sizeGroups
            );
            const unassignedCount = strategyPlan.unassignedPieces.length;
            if (unassignedCount < bestUnassigned) {
              bestPlan = strategyPlan;
              bestUnassigned = unassignedCount;
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

        function tryPackingStrategy(
          strips,
          pieces,
          strategy,
          sortedSizeKeys,
          sizeGroups
        ) {
          let localTotalStripsUsed = 0;
          let localTotalUsedMaterial = 0;
          strips = strips.map((strip) => ({
            ...strip,
            remaining: strip.length,
            cuts: [],
          }));
          pieces.forEach((piece) => (piece.assigned = false));

          const plan = [];
          let totalWaste = 0;

          if (strategy === 0) {
            const sorted = [...pieces].sort(
              (a, b) => b.length - a.length
            );
            for (const piece of sorted) {
              const strip = findBestStrip(piece, strips);
              if (strip) {
                addToStrip(piece, strip, plan);
              }
            }
          } else if (strategy === 1) {
            const sorted = [...pieces].sort(
              (a, b) => b.length - a.length
            );
            for (const piece of sorted) {
              const strip = findBestStrip(piece, strips, true);
              if (strip) {
                addToStrip(piece, strip, plan);
              }
            }
          } else if (strategy === 2) {
            const localGroups = {};
            pieces.forEach((piece) => {
              const key = `${piece.type}|${piece.profile}|${piece.size}`;
              if (!localGroups[key]) localGroups[key] = [];
              localGroups[key].push(piece);
            });
            const sortedGroups = Object.values(localGroups).sort(
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
          } else {
            for (const key of sortedSizeKeys) {
              const group = sizeGroups[key];
              const pLen = group.length > 0 ? group[0].length : 0;
              if (pLen === 0) continue;
              let placed = true;
              while (placed) {
                placed = false;
                for (const strip of strips) {
                  if (strip.remaining < pLen) continue;
                  const unassigned = group.filter((p) => !p.assigned);
                  if (unassigned.length === 0) break;
                  addToStrip(unassigned[0], strip, plan);
                  placed = true;
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

            if (!plan.includes(strip)) {
              localTotalStripsUsed++;
              localTotalUsedMaterial += strip.length;
              plan.push(strip);
            }
          }
        }
      }

      function displayResults(result, currentUnit, isFullCalculation = false) {
        const resultsContainer = document.getElementById("results-container");
        resultsContainer.innerHTML = "";

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

        const hasRealShortage =
          result.shortages.length > 0 &&
          (!result.shortageStripTips ||
            result.shortageStripTips.length === 0 ||
            result.shortageStripTips.some((tip) => tip.additionalStrips > 0));

        if (hasRealShortage) {
          const shortageContainer = document.createElement("div");
          shortageContainer.className = "shortage-container";

          const headerDiv = document.createElement("div");
          headerDiv.className = "shortage-header";
          headerDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Material Shortages';
          shortageContainer.appendChild(headerDiv);

          result.shortages.forEach((shortage) => {
            const shortageItem = document.createElement("div");
            shortageItem.className = "shortage-item";
            shortageItem.innerHTML = `
                            <div class="shortage-size">${shortage.type} - ${shortage.profile} - ${shortage.size}</div>
                            <div class="shortage-qty">${shortage.count} rims shortage &rarr; need ${shortage.requiredTubes} more strips</div>
                        `;
            shortageContainer.appendChild(shortageItem);
          });

          if (result.shortageStripTips && result.shortageStripTips.length > 0) {
            result.shortageStripTips.forEach((tip) => {
              const tipDiv = document.createElement("div");
              tipDiv.className = "shortage-note";
              tipDiv.innerHTML = `<i class="fas fa-lightbulb"></i> Total <strong>${tip.availSize}</strong> strips needed: <strong>${tip.totalStripsNeeded}</strong> (have ${tip.currentStrips}, need <strong>${tip.additionalStrips}</strong> more)`;
              shortageContainer.appendChild(tipDiv);
            });
          }

          const detailsDiv = document.createElement("div");
          detailsDiv.className = "shortage-details";
          detailsDiv.innerHTML = '<i class="fas fa-info-circle"></i> Add more strips of matching type/profile to cover the shortage';
          shortageContainer.appendChild(detailsDiv);
          resultsContainer.appendChild(shortageContainer);
        }

        const materialSummaryContainer = document.createElement("div");
        materialSummaryContainer.className = "result-container";
        const summaryTitle = isFullCalculation
          ? '<h3><i class="fas fa-boxes"></i> Material Usage Summary <span class="pattern-badge">Full Requirements</span></h3>'
          : '<h3><i class="fas fa-boxes"></i> Material Usage Summary</h3>';
        materialSummaryContainer.innerHTML = summaryTitle;
        const materialSummary = document.createElement("div");
        materialSummary.id = "material-summary";

        if (result.materialSummary.length > 0) {
          result.materialSummary.forEach((material, idx) => {
            const materialElem = document.createElement("div");
            materialElem.className = "material-usage";

            let detailsHtml;
            if (isFullCalculation && result.originalQtys) {
              const availQty = result.originalQtys[idx] || 0;
              const reqQty = result.requiredQtys
                ? result.requiredQtys[idx]
                : material.total;
              const needMore = Math.max(0, reqQty - availQty);

              detailsHtml = `
                        <div class="size-details">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span>Available:</span>
                                <span style="font-weight: bold;">${availQty} strips</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; color: #3498db;">
                                <span>Required:</span>
                                <span style="font-weight: bold;">${reqQty} strips</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; ${
                              needMore > 0
                                ? "color: #e74c3c;"
                                : "color: #2ecc71;"
                            }">
                                <span>Need More:</span>
                                <span style="font-weight: bold;">${
                                  needMore > 0 ? needMore : "0"
                                } strips${needMore === 0 ? " ✓" : ""}</span>
                            </div>
                            <div style="border-top: 1px dashed #ccc; margin: 8px 0;"></div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Used:</span>
                                <span style="font-weight: bold;">${
                                  material.used
                                } strips</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Remaining:</span>
                                <span style="font-weight: bold;">${
                                  material.remaining
                                } strips</span>
                            </div>
                            <div class="utilization-bar">
                                <div class="utilization-fill" style="width: ${
                                  reqQty > 0
                                    ? (material.used / reqQty) * 100
                                    : 0
                                }%"></div>
                            </div>
                            ${
                              needMore > 0
                                ? `
                            <div class="shortage-note" style="margin-top: 10px;">
                                <i class="fas fa-lightbulb"></i> Total <strong>${material.size}</strong> strips needed: <strong>${reqQty}</strong> (have ${availQty}, need <strong>${needMore}</strong> more)
                            </div>`
                                : ""
                            }
                        </div>
                    `;
            } else {
              detailsHtml = `
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
            }

            materialElem.innerHTML = `
                        <div class="material-header">
                            <span>${material.type} - ${material.profile} - ${
              material.size
            }</span>
                            <span>${material.length.toFixed(
                              2
                            )} ${currentUnit} Strips</span>
                        </div>
                        ${detailsHtml}
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
          const patternGroups = {};
          result.plan.forEach((strip) => {
            if (strip.cuts.length === 0) return;

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
